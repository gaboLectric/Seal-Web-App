import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

// Ícono de app estilo iOS: cuadrado continuo con degradado azul y flecha de descarga.
const AppIcon = () => (
  <Box
    aria-hidden
    sx={{
      width: 28,
      height: 28,
      borderRadius: '7px',
      background: 'linear-gradient(180deg, #3B9BFF 0%, #0071E3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 1px 2px rgba(0, 113, 227, 0.35)',
    }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.5v7M3.8 5.7 7 8.9l3.2-3.2M2 12.5h10"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${apiUrl}/formats/quality-presets`);
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel =
    backendStatus === 'connected' ? 'Conectado' : backendStatus === 'disconnected' ? 'Sin conexión' : 'Conectando…';
  const statusColor =
    backendStatus === 'connected'
      ? 'var(--green)'
      : backendStatus === 'disconnected'
        ? 'var(--red)'
        : 'var(--gray-dot)';

  return (
    <header className="frosted-bar">
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2.5, sm: 3 }, height: 56, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AppIcon />
        <Typography variant="h4" component="div" sx={{ flexGrow: 1, fontSize: '1.0625rem' }}>
          Seal
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, title: statusLabel }}>
          <Box
            aria-hidden
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: backendStatus === 'connected' ? '0 0 0 3px rgba(52, 199, 89, 0.18)' : 'none',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {statusLabel}
          </Typography>
        </Box>
      </Box>
    </header>
  );
};

export default Header;
