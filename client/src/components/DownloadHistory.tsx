import React, { useState, useEffect, useCallback } from 'react';
import { Play, FolderDown, Trash2, RefreshCw, Video, Music, File as FileIcon } from 'lucide-react';
import axios from 'axios';
import MediaModal, { isPlayable, fileKind, type MediaItem } from './MediaModal';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

interface DownloadedFile extends MediaItem {
  modifiedAt: string;
}

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0)
    return `hoy ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() || '—';

const DownloadHistory: React.FC = () => {
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<DownloadedFile | null>(null);
  const { downloads } = useSocket();
  const { showToast } = useToast();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/download/list`);
      setFiles(response.data);
    } catch {
      setError('No se pudo leer la biblioteca.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Refresca la lista cuando termina una descarga de esta sesión
  useEffect(() => {
    if (downloads.some((d) => d.status === 'completed')) {
      const t = setTimeout(fetchFiles, 800);
      return () => clearTimeout(t);
    }
  }, [downloads, fetchFiles]);

  const deleteFile = async (filename: string) => {
    try {
      await axios.delete(`${apiUrl}/download/${encodeURIComponent(filename)}`);
      setFiles((prev) => prev.filter((f) => f.name !== filename));
      showToast('Elemento eliminado de la biblioteca');
    } catch {
      showToast('No se pudo eliminar el archivo');
    }
  };

  const tileIcon = (kind: 'video' | 'audio' | 'other') =>
    kind === 'video' ? <Video size={18} /> : kind === 'audio' ? <Music size={18} /> : <FileIcon size={18} />;

  return (
    <section>
      <div className="section-head">
        <div className="section-title">
          <p className="kicker" style={{ margin: 0 }}>## historial</p>
          <h2>Biblioteca local</h2>
          <span className="count-chip">{files.length}</span>
        </div>
        <button
          type="button"
          className="bordered-btn"
          onClick={fetchFiles}
          disabled={loading}
          aria-label="Actualizar biblioteca"
          title="Actualizar biblioteca"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && <p className="inline-msg error" role="alert">{error}</p>}

      {files.length === 0 ? (
        <div className="history-list">
          <div className="empty-state">
            <img src="/favicon.svg" alt="" />
            <p className="code">
              <span className="amber">#</span> la foca aún no ha traído nada_
            </p>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {files.map((file) => {
            const kind = fileKind(file.name);
            return (
              <div key={file.name} className="history-row">
                <div className="history-main">
                  <div className="history-tile">{tileIcon(kind)}</div>
                  <div className="history-text">
                    <p className="history-name">{file.name}</p>
                    <div className="history-meta">
                      <span className="format-chip">{extOf(file.name)}</span>
                      <span className="dim">{formatFileSize(file.size)}</span>
                      <span className="sep">·</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="history-actions">
                  {isPlayable(file.name) && (
                    <button
                      type="button"
                      className="bordered-btn"
                      onClick={() => setPlaying(file)}
                      aria-label={`Reproducir ${file.name}`}
                      title="Reproducir"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  <a
                    href={`${apiUrl}/download/file/${encodeURIComponent(file.name)}`}
                    download={file.name}
                    title="Guardar en este dispositivo"
                    aria-label={`Guardar ${file.name} en este dispositivo`}
                    style={{ display: 'flex' }}
                  >
                    <button type="button" className="bordered-btn" tabIndex={-1}>
                      <FolderDown size={14} />
                    </button>
                  </a>
                  <button
                    type="button"
                    className="bordered-btn danger"
                    onClick={() => deleteFile(file.name)}
                    aria-label={`Eliminar ${file.name}`}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playing && <MediaModal item={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
};

export default DownloadHistory;
