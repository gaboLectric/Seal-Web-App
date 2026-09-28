import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import DownloadForm from './components/DownloadForm';
import DownloadProgress from './components/DownloadProgress';
import DownloadHistory from './components/DownloadHistory';
import { SocketProvider } from './contexts/SocketContext';
import { lightTheme, darkTheme } from './theme';
import './App.css';

// El tema inicial ya lo decidió index.html antes del primer pintado (data-theme
// en <html>); ?theme=dark|light en la URL fija el tema a mano.
type Mode = 'light' | 'dark';
const forced = new URLSearchParams(window.location.search).get('theme');
const initialMode: Mode =
  forced === 'dark' || forced === 'light'
    ? forced
    : document.documentElement.dataset.theme === 'dark'
      ? 'dark'
      : 'light';

function App() {
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    if (forced) return; // el override manual no sigue al sistema
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      <SocketProvider>
        <div className="App">
          <Header />
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
