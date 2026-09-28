import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

const statusMeta: Record<string, { label: string; color: string }> = {
  starting: { label: 'Preparando', color: 'var(--gray-dot)' },
  downloading: { label: 'Descargando', color: 'var(--azure)' },
  completed: { label: 'Completado', color: 'var(--green)' },
  error: { label: 'Error', color: 'var(--red)' },
};

const DownloadProgress: React.FC = () => {
  const { downloads } = useSocket();

  if (downloads.length === 0) {
    return null;
  }

  const ordered = [...downloads].reverse().slice(0, 6);

  return (
    <Box className="section-enter" sx={{ mb: { xs: 4, sm: 5 } }}>
      <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>
        Actividad
      </Typography>
      <div className="inset-list">
        {ordered.map((download) => {
          const meta = statusMeta[download.status] ?? statusMeta.starting;
          return (
            <Box key={download.id} className="inset-row">
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                  flexShrink: 0,
                  animation: download.status === 'downloading' ? 'pulse 1.4s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.35 },
                  },
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 590 }}>
                  {download.filename || 'Preparando descarga…'}
                </Typography>
                {download.error && (
                  <Typography variant="caption" sx={{ color: 'var(--red)', display: 'block' }}>
                    {download.error}
                  </Typography>
                )}
                {download.status === 'downloading' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${download.progress}%` }} />
                    </div>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 34, textAlign: 'right' }}
                    >
                      {Math.round(download.progress)} %
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{ color: meta.color, fontWeight: 590, flexShrink: 0, alignSelf: download.status === 'downloading' ? 'flex-start' : 'center', pt: download.status === 'downloading' ? '2px' : 0 }}
              >
                {meta.label}
              </Typography>
            </Box>
          );
        })}
      </div>
    </Box>
  );
};

export default DownloadProgress;
