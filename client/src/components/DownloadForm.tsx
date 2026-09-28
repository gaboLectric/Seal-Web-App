import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  uploader: string;
  upload_date: string;
  view_count: number;
  thumbnail: string;
  webpage_url: string;
  extractor: string;
}

interface QualityPreset {
  value: string;
  label: string;
  description: string;
}

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

const PRESET_LABELS: Record<string, string> = {
  best: 'Automática',
  worst: 'La más baja',
};

// "Automática" primero, luego de mayor a menor calidad, "La más baja" al final.
// Los formatos con nombre (MP3, M4A…) conservan el orden del servidor.
const sortPresets = (presets: QualityPreset[]) => {
  const rank = (v: string) => {
    if (v === 'best') return -2;
    if (v === 'worst') return 2;
    const n = parseFloat(v);
    return Number.isFinite(n) ? -n / 100000 : 0;
  };
  return [...presets].sort((a, b) => rank(a.value) - rank(b.value));
};

const DownloadForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [audioOnly, setAudioOnly] = useState(false);
  const [format, setFormat] = useState('best');
  const [quality, setQuality] = useState('best');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qualityPresets, setQualityPresets] = useState<{
    video: QualityPreset[];
    audio: QualityPreset[];
  }>({ video: [], audio: [] });
  const infoSeq = useRef(0);

  const fetchQualityPresets = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/formats/quality-presets`);
      setQualityPresets(response.data);
    } catch (error) {
      // Sin backend los campos quedan vacíos; la descarga mostrará el error.
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
    setInfoLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/info`, { params: { url: targetUrl } });
      if (seq === infoSeq.current) setVideoInfo(response.data);
    } catch (error) {
      if (seq === infoSeq.current) setVideoInfo(null);
    } finally {
      if (seq === infoSeq.current) setInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchVideoInfo(url), 700);
    return () => clearTimeout(timer);
  }, [url, fetchVideoInfo]);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Pega un enlace para empezar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${apiUrl}/download`, {
        url,
        format: audioOnly ? format : undefined,
        quality: !audioOnly ? quality : undefined,
        audioOnly,
      });

      if (response.data.success) {
        setSuccess('Descarga iniciada.');
        setUrl('');
        setVideoInfo(null);
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setError('No hay conexión con el servidor. Inicia la app con "npm run dev".');
      } else {
        setError(error.response?.data?.error || 'No se pudo iniciar la descarga.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (!views) return null;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace('.0', '')} M de visualizaciones`;
    if (views >= 1_000) return `${Math.round(views / 1000)} mil visualizaciones`;
    return `${views} visualizaciones`;
  };

  const presets = sortPresets(audioOnly ? qualityPresets.audio : qualityPresets.video);
  const selectedValue = audioOnly ? format : quality;

  return (
    <Card className="section-enter" sx={{ mb: { xs: 4, sm: 5 } }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 }, '&:last-child': { pb: { xs: 2.5, sm: 3.5 } } }}>
        <TextField
          fullWidth
          placeholder="Pega un enlace de YouTube, TikTok, Vimeo…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
            setSuccess('');
          }}
          variant="outlined"
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ pl: 1.5 }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                  <path
                    d="M6.2 8.8 8.8 6.2M5.4 4.5 3.9 6a2.7 2.7 0 0 0 3.8 3.8l1.5-1.5M9.6 10.5l1.5-1.5a2.7 2.7 0 0 0-3.8-3.8L5.8 6.7"
                    stroke="#86868B"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </InputAdornment>
            ),
            endAdornment: url ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Borrar enlace"
                  onClick={() => {
                    setUrl('');
                    setVideoInfo(null);
                    setError('');
                  }}
                  sx={{ color: '#86868B', mr: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 2.5 }}>
          <div className="segmented" role="tablist" aria-label="Tipo de descarga">
            <div
              className="segmented-thumb"
              style={{ transform: audioOnly ? 'translateX(100%)' : 'translateX(0)' }}
              aria-hidden
            />
            <button
              type="button"
              role="tab"
              aria-selected={!audioOnly}
              className={`segmented-option ${audioOnly ? 'unselected' : ''}`}
              onClick={() => setAudioOnly(false)}
            >
              Video
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audioOnly}
              className={`segmented-option ${audioOnly ? '' : 'unselected'}`}
              onClick={() => setAudioOnly(true)}
            >
              Audio
            </button>
          </div>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {presets.map((preset) => {
              const value = preset.value;
              const label = PRESET_LABELS[value] ?? preset.label;
              return (
                <button
                  key={value}
                  type="button"
                  className={`quality-pill ${selectedValue === value ? 'selected' : ''}`}
                  onClick={() => (audioOnly ? setFormat(value) : setQuality(value))}
                >
                  {label}
                </button>
              );
            })}
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleDownload}
            disabled={loading || !url.trim()}
            sx={{ minWidth: 148, height: 44, ml: 'auto' }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Descargar'}
          </Button>
        </Box>

        {error && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'var(--red)' }} role="alert">
            {error}
          </Typography>
        )}

        {success && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'var(--green)' }} role="status">
            {success}
          </Typography>
        )}

        {(videoInfo || infoLoading) && (
          <Box
            className="section-enter"
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 12,
              bgcolor: 'var(--fill)',
              display: 'flex',
              gap: 2,
              alignItems: 'center',
            }}
          >
            {videoInfo?.thumbnail && (
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Box
                  component="img"
                  src={videoInfo.thumbnail}
                  alt=""
                  sx={{ width: 112, height: 63, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                />
                {videoInfo.duration > 0 && (
                  <Typography
                    variant="overline"
                    sx={{
                      position: 'absolute',
                      right: 4,
                      bottom: 4,
                      px: 0.75,
                      py: '1px',
                      borderRadius: '4px',
                      bgcolor: 'rgba(0, 0, 0, 0.65)',
                      color: '#FFFFFF',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDuration(videoInfo.duration)}
                  </Typography>
                )}
              </Box>
            )}
            {infoLoading && !videoInfo && (
              <Box sx={{ width: 112, height: 63, borderRadius: 8, bgcolor: 'var(--fill-strong)', flexShrink: 0 }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              {videoInfo ? (
                <>
                  <Typography variant="subtitle1" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {videoInfo.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {videoInfo.uploader}
                    {formatViews(videoInfo.view_count) ? ` — ${formatViews(videoInfo.view_count)}` : ''}
                  </Typography>
                </>
              ) : (
                <>
                  <Box sx={{ height: 14, width: '70%', borderRadius: 4, bgcolor: 'var(--fill-strong)' }} />
                  <Box sx={{ height: 11, width: '45%', borderRadius: 4, bgcolor: 'var(--fill)', mt: 1 }} />
                </>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadForm;
