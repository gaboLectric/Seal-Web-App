import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

// La foca: mascota de Seal, misma arte que el ícono de la app.
const SealLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 64 64"
    aria-hidden
    style={{ borderRadius: 7, boxShadow: '0 1px 3px rgba(10, 103, 232, 0.35)', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="sealOcean" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor="#3EC1FF" />
        <stop offset="1" stopColor="#0A67E8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14.5" fill="url(#sealOcean)" />
    <path d="M0 52c5.3-4 10.7-4 16 0s10.7 4 16 0 10.7-4 16 0 10.7 4 16 0v12H0Z" fill="#FFFFFF" opacity="0.16" />
    <ellipse cx="32" cy="33.5" rx="15" ry="14" fill="#FFF3E2" />
    <circle cx="27" cy="23.6" r="1" fill="#F3D9B8" />
    <circle cx="33" cy="22.6" r="0.9" fill="#F3D9B8" />
    <circle cx="37.8" cy="23.9" r="0.8" fill="#F3D9B8" />
    <ellipse cx="26" cy="31.5" rx="2" ry="2.7" fill="#25313E" />
    <ellipse cx="38" cy="31.5" rx="2" ry="2.7" fill="#25313E" />
    <circle cx="26.7" cy="30.5" r="0.8" fill="#FFFFFF" />
    <circle cx="38.7" cy="30.5" r="0.8" fill="#FFFFFF" />
    <ellipse cx="21.8" cy="38.3" rx="2.6" ry="1.5" fill="#FFAB91" opacity="0.55" />
    <ellipse cx="42.2" cy="38.3" rx="2.6" ry="1.5" fill="#FFAB91" opacity="0.55" />
    <ellipse cx="32" cy="38" rx="2" ry="1.5" fill="#25313E" />
    <path d="M32 39.7v1.3c0 1.3-1 2.2-2.4 2.2M32 41c0 1.3 1 2.2 2.4 2.2" fill="none" stroke="#25313E" strokeWidth="1.15" strokeLinecap="round" />
    <path d="M23.5 38.6 19 37.6M23.5 40.7 18.8 40.7M23.5 42.8 19.3 43.9M40.5 38.6 45 37.6M40.5 40.7 45.2 40.7M40.5 42.8 44.7 43.9" stroke="#25313E" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M20.6 14.2A8.6 8.6 0 0 1 9.8 3.4a8.6 8.6 0 1 0 10.8 10.8Z" fill="currentColor" />
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="4.4" fill="currentColor" stroke="none" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
  </svg>
);

interface HeaderProps {
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, onToggleTheme }) => {
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

  const nextMode = mode === 'dark' ? 'claro' : 'oscuro';

  return (
    <header className="frosted-bar">
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2.5, sm: 3 }, height: 56, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SealLogo />
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
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Cambiar a modo ${nextMode}`}
          title={`Cambiar a modo ${nextMode}`}
        >
          <span key={mode} className="icon-pop">
            {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </span>
        </button>
      </Box>
    </header>
  );
};

export default Header;
