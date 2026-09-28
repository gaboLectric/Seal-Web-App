import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  Link2,
  Video,
  Music,
  Check,
  Clipboard,
  X,
  Clock,
} from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  view_count: number;
  thumbnail: string;
  extractor: string;
  height?: number;
  width?: number;
}

interface QualityPreset {
  value: string;
  label: string;
}

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

const PRESET_LABELS: Record<string, string> = {
  best: 'Automática',
  worst: 'La más baja',
};

const sortPresets = (presets: QualityPreset[]) => {
  const rank = (v: string) => {
    if (v === 'best') return -2;
    if (v === 'worst') return 2;
    const n = parseFloat(v);
    return Number.isFinite(n) ? -n / 100000 : 0;
  };
  return [...presets].sort((a, b) => rank(a.value) - rank(b.value));
};

// Enlaces de prueba reales (del TEST_URLS.md del proyecto)
const QUICK_LINKS: { label: string; url: string }[] = [
  { label: 'youtube', url: 'https://www.youtube.com/watch?v=C0DPdy98e4c' },
  { label: 'archive', url: 'https://archive.org/details/BigBuckBunny_124' },
];

const formatDuration = (seconds: number) => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

const formatViews = (views: number) => {
  if (!views) return null;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')}M vistas`;
  if (views >= 1_000) return `${Math.round(views / 1000)}K vistas`;
  return `${views} vistas`;
};

// Traduce la última línea de yt-dlp a un paso legible
const stepFromLog = (log: string, status: string) => {
  if (status === 'starting') return 'Iniciando proceso yt-dlp…';
  if (/Destination/.test(log)) return 'Descargando flujo remoto…';
  if (/ExtractAudio/.test(log)) return 'Extrayendo pista de audio…';
  if (/Merger|Merging/.test(log)) return 'Fusionando video + audio…';
  if (/Embedding|thumbnail|metadata/i.test(log)) return 'Incrustando metadatos y carátula…';
  if (/Fragment|fragment/i.test(log)) return 'Descargando fragmentos…';
  return 'Procesando…';
};

const DownloadForm: React.FC = () => {
  const { downloads } = useSocket();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [audioOnly, setAudioOnly] = useState(false);
  const [format, setFormat] = useState('best');
  const [quality, setQuality] = useState('best');
  const [embedCover, setEmbedCover] = useState(true);
  const [embedSubs, setEmbedSubs] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qualityPresets, setQualityPresets] = useState<{ video: QualityPreset[]; audio: QualityPreset[] }>({
    video: [],
    audio: [],
  });
  const infoSeq = useRef(0);
  const lastId = useRef<string | null>(null);
  const prevStatus = useRef<Record<string, string>>({});

  const fetchQualityPresets = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/formats/quality-presets`);
      setQualityPresets(response.data);
    } catch {
      setQualityPresets({ video: [], audio: [] });
    }
  }, []);

  useEffect(() => {
    fetchQualityPresets();
  }, [fetchQualityPresets]);

  // Lee la información del enlace mientras se escribe; falla en silencio.
  const fetchVideoInfo = useCallback(async (targetUrl: string) => {
    if (!/^https?:\/\//i.test(targetUrl.trim())) {
      setVideoInfo(null);
      return;
    }
    const seq = ++infoSeq.current;
    setAnalyzing(true);
    try {
      const response = await axios.get(`${apiUrl}/info`, { params: { url: targetUrl } });
      if (seq === infoSeq.current) setVideoInfo(response.data);
    } catch {
      if (seq === infoSeq.current) setVideoInfo(null);
    } finally {
      if (seq === infoSeq.current) setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchVideoInfo(url), 700);
    return () => clearTimeout(timer);
  }, [url, fetchVideoInfo]);

  // Toca el toast cuando una descarga de esta sesión termina o falla
  useEffect(() => {
    for (const d of downloads) {
      const before = prevStatus.current[d.id];
      prevStatus.current[d.id] = d.status;
      if (!before || before === d.status) continue;
      if (d.status === 'completed') showToast(`✓ ${d.filename || 'Archivo'} guardado en la biblioteca`);
      if (d.status === 'error') showToast(`✗ ${d.error || 'La descarga falló'}`);
      if (d.status === 'cancelled') showToast('Descarga cancelada');
    }
  }, [downloads, showToast]);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Pega un enlace para empezar.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/download`, {
        url,
        format: audioOnly ? format : undefined,
        quality: !audioOnly ? quality : undefined,
        audioOnly,
        embedCover,
        embedSubs,
      });

      if (response.data.success) {
        lastId.current = response.data.downloadId;
        setUrl('');
        setVideoInfo(null);
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError('No hay conexión con el daemon. Ejecuta npm start.');
      } else {
        setError(err.response?.data?.error || 'No se pudo iniciar la descarga.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const id = lastId.current;
    if (!id) return;
    try {
      await axios.post(`${apiUrl}/download/cancel/${id}`);
    } catch {
      /* el proceso ya terminó */
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        return;
      }
    } catch {
      /* sin permiso de portapapeles */
    }
    setError('No pude leer el portapapeles; pega el enlace manualmente.');
  };

  const active =
    (lastId.current && downloads.find((d) => d.id === lastId.current)) || null;
  const busy = !!active && (active.status === 'starting' || active.status === 'downloading');
  const presets = sortPresets(audioOnly ? qualityPresets.audio : qualityPresets.video);
  const selectedValue = audioOnly ? format : quality;

  return (
    <section className="panel">
      {/* Entrada de URL */}
      <div>
        <div className={`url-wrap ${url ? 'has-value' : ''}`}>
          <span className="lead-icon">
            <Link2 size={16} />
          </span>
          <input
            type="text"
            className="url-input"
            placeholder="Pega un enlace aquí (YouTube, TikTok, Vimeo…)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
            aria-label="Enlace del video"
          />
          <div className="url-trailing">
            {url ? (
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setUrl('');
                  setVideoInfo(null);
                }}
                disabled={busy}
                aria-label="Limpiar enlace"
                title="Limpiar enlace"
              >
                <X size={16} />
              </button>
            ) : (
              <button type="button" className="paste-btn" onClick={handlePaste}>
                <Clipboard size={12} />
                <span>pegar</span>
              </button>
            )}
          </div>
        </div>

        {!url && !busy && (
          <div className="quick-links">
            <span>probar enlace rápido:</span>
            {QUICK_LINKS.map((q) => (
              <button key={q.label} type="button" onClick={() => setUrl(q.url)}>
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Análisis en curso */}
      {analyzing && !videoInfo && (
        <div className="analyze-card">
          <div className="skel" style={{ width: 96, height: 54, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="skel" style={{ height: 14, width: '70%', marginBottom: 8 }} />
            <div className="skel" style={{ height: 12, width: '40%' }} />
            <p className="analyze-cmd" style={{ margin: '10px 0 0' }}>
              $ yt-dlp --dump-json extrayendo metadatos…
            </p>
          </div>
        </div>
      )}

      {/* Vista previa de metadatos */}
      {videoInfo && !analyzing && (
        <div className="meta-card">
          <div className="meta-thumb">
            {videoInfo.thumbnail && <img src={videoInfo.thumbnail} alt="" />}
            <span className="meta-platform">{videoInfo.extractor}</span>
            {videoInfo.duration > 0 && (
              <span className="meta-duration">
                <Clock size={10} />
                {formatDuration(videoInfo.duration)}
              </span>
            )}
          </div>
          <div className="meta-body">
            <p className="meta-title">{videoInfo.title}</p>
            <div className="meta-line">
              <span className="author">{videoInfo.uploader}</span>
              {formatViews(videoInfo.view_count) && (
                <>
                  <span className="sep">·</span>
                  <span className="dim">{formatViews(videoInfo.view_count)}</span>
                </>
              )}
              {videoInfo.height && (
                <>
                  <span className="sep">·</span>
                  <span className="faint">{videoInfo.height}p</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles de formato */}
      <div className="divider-t">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div className="seg" role="tablist" aria-label="Tipo de descarga">
            <button
              type="button"
              role="tab"
              aria-selected={!audioOnly}
              className={!audioOnly ? 'active' : ''}
              onClick={() => setAudioOnly(false)}
              disabled={busy}
            >
              <Video size={14} />
              <span>Video</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audioOnly}
              className={audioOnly ? 'active' : ''}
              onClick={() => setAudioOnly(true)}
              disabled={busy}
            >
              <Music size={14} />
              <span>Audio</span>
            </button>
          </div>

          <div className="term-toggles">
            <label>
              <input
                type="checkbox"
                checked={audioOnly ? embedCover : embedSubs}
                onChange={(e) => (audioOnly ? setEmbedCover(e.target.checked) : setEmbedSubs(e.target.checked))}
                disabled={busy}
              />
              <span>{audioOnly ? 'incrustar carátula' : 'incrustar subtítulos'}</span>
            </label>
          </div>
        </div>

        {presets.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <span className="pill-row-label">
              {audioOnly ? 'codec / calidad de audio:' : 'resolución de video:'}
            </span>
            <div className="pill-row">
              {presets.map((preset) => {
                const selected = selectedValue === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    className={`pill ${selected ? 'selected' : ''}`}
                    onClick={() => (audioOnly ? setFormat(preset.value) : setQuality(preset.value))}
                    disabled={busy}
                  >
                    {selected && <Check size={12} strokeWidth={2.75} />}
                    <span>{PRESET_LABELS[preset.value] ?? preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Terminal de progreso en vivo */}
      {active && busy && (
        <div className="term">
          <div className="term-head">
            <div className="term-step">
              <span>{stepFromLog(active.logLine || '', active.status)}</span>
            </div>
            <button type="button" className="term-cancel" onClick={handleCancel}>
              cancelar
            </button>
          </div>
          <div className="term-bar">
            <div className="term-bar-fill" style={{ width: `${active.progress}%` }} />
          </div>
          <div className="term-stats">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="pct">{Math.round(active.progress)}%</span>
              {active.speed && <><span>·</span><span>{active.speed}</span></>}
              {active.totalSize && (
                <>
                  <span>·</span>
                  <span>{active.totalSize}</span>
                </>
              )}
            </div>
            {active.eta && (
              <span>
                ETA: <strong>{active.eta}</strong>
              </span>
            )}
          </div>
          <div className="term-log">
            {active.filename ? `${active.filename} — ` : ''}
            {active.logLine || '[yt-dlp] iniciando…'}
          </div>
        </div>
      )}

      {error && <p className="inline-msg error" role="alert">{error}</p>}

      {/* Botón de acción */}
      <div className="action-row">
        <button
          type="button"
          className="action-btn"
          onClick={handleDownload}
          disabled={!url.trim() || loading || busy}
        >
          <Download size={16} strokeWidth={2.2} />
          <span>Descargar {audioOnly ? 'Audio' : 'Video'}</span>
        </button>
      </div>
    </section>
  );
};

export default DownloadForm;
