import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon, Download as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

interface DownloadedFile {
  name: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
}

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

const DownloadHistory: React.FC = () => {
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${apiUrl}/download/list`);
      setFiles(response.data);
    } catch (error: any) {
      setError('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const deleteFile = async (filename: string) => {
    try {
      await axios.delete(`${apiUrl}/download/${encodeURIComponent(filename)}`);
      setFiles(files.filter(file => file.name !== filename));
    } catch (error: any) {
      setError('No se pudo eliminar el archivo.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 bytes';

    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return `hoy a las ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFileType = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'video';
    }
    if (['mp3', 'm4a', 'wav', 'flac', 'ogg', 'aac'].includes(extension || '')) {
      return 'audio';
    }
    return 'other';
  };

  return (
    <Box className="section-enter">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
        <Typography variant="h3" component="h2">
          Historial
        </Typography>
        <Tooltip title="Actualizar">
          <span>
            <IconButton
              size="small"
              onClick={fetchFiles}
              disabled={loading}
              aria-label="Actualizar historial"
              sx={{ color: 'var(--azure)', alignSelf: 'center' }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#FF3B30' }} role="alert">
          {error}
        </Typography>
      )}

      {files.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 5,
            borderRadius: '16px',
            border: '1.5px dashed var(--hairline-strong)',
          }}
        >
          <Box
            component="img"
            src="/favicon.svg"
            alt=""
            className="seal-float"
            sx={{
              width: 64,
              height: 64,
              borderRadius: '15px',
              boxShadow: '0 8px 20px rgba(10, 103, 232, 0.3)',
              mb: 1.5,
              display: 'inline-block',
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 590 }}>
            Aún no hay descargas
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Pega un enlace arriba y la foca irá por él.
          </Typography>
        </Box>
      ) : (
        <div className="inset-list">
          {files.map((file) => {
            const type = getFileType(file.name);
            return (
              <Box key={file.name} className="inset-row">
                <Box className={`file-tile ${type === 'audio' ? 'audio' : type === 'video' ? 'video' : ''}`} aria-hidden>
                  {type === 'audio' ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M11.5 2.2v7.1a2.1 2.1 0 1 1-1.4-2V4.5L6 5.4v5.4a2.1 2.1 0 1 1-1.4-2V4.1l6.9-1.9Z"
                        fill="#FFFFFF"
                      />
                    </svg>
                  ) : type === 'video' ? (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M3.5 2.1v8.8L11 6.5 3.5 2.1Z" fill="#FFFFFF" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 8.5V5.5h8v3H3Z" fill="#FFFFFF" />
                    </svg>
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 590 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}, descargado {formatDate(file.createdAt)}
                  </Typography>
                </Box>
                <Box className="row-action" sx={{ display: 'flex', flexShrink: 0 }}>
                  {/* En iOS Safari, este enlace guarda el archivo en la app Archivos */}
                  <Tooltip title="Guardar en este dispositivo">
                    <a
                      href={`${apiUrl}/download/file/${encodeURIComponent(file.name)}`}
                      download={file.name}
                      style={{ display: 'flex' }}
                      aria-label={`Guardar ${file.name} en este dispositivo`}
                    >
                      <IconButton size="small" sx={{ color: 'var(--fog)', '&:hover': { color: 'var(--azure)' } }}>
                        <SaveIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </a>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      onClick={() => deleteFile(file.name)}
                      aria-label={`Eliminar ${file.name}`}
                      sx={{ color: 'var(--fog)', '&:hover': { color: 'var(--red)', bgcolor: 'rgba(255, 59, 48, 0.1)' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </div>
      )}
    </Box>
  );
};

export default DownloadHistory;
