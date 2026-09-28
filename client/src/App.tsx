import React, { useCallback, useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import DownloadForm from './components/DownloadForm';
import DownloadProgress from './components/DownloadProgress';
import DownloadHistory from './components/DownloadHistory';
import { SocketProvider } from './contexts/SocketContext';
import { lightTheme, darkTheme } from './theme';
import './App.css';

// El tema inicial lo decidió theme-init.js antes del primer pintado;
// localStorage guarda la preferencia manual del usuario (seal-theme).
type Mode = 'light' | 'dark';

function App() {
  const [mode, setMode] = useState<Mode>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  // Sin preferencia guardada, la app sigue la apariencia del sistema.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('seal-theme')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', mode === 'dark' ? '#000000' : '#F5F5F7'));
  }, [mode]);

  const toggleTheme = useCallback(() => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      localStorage.setItem('seal-theme', next);
    } catch {
      /* navegación privada */
    }
  }, [mode]);

  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      <SocketProvider>
        <div className="App">
          <Header mode={mode} onToggleTheme={toggleTheme} />
          <Container maxWidth={false} sx={{ maxWidth: 720, px: { xs: 2.5, sm: 3 } }}>
            <Box component="main" sx={{ pt: { xs: 5, sm: 7 }, pb: 8 }}>
              <Box sx={{ mb: { xs: 4, sm: 5 } }}>
                <Typography variant="h1" component="h1">
                  Descarga video y audio
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: '52ch' }}>
                  Pega un enlace de YouTube, TikTok, Instagram, Vimeo y cientos de sitios más.
                </Typography>
              </Box>
              <DownloadForm />
              <DownloadProgress />
              <DownloadHistory />
            </Box>
          </Container>
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
