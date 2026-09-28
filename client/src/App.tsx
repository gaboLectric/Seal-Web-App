import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import DownloadForm from './components/DownloadForm';
import DownloadHistory from './components/DownloadHistory';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

export type ThemePref = 'light' | 'dark' | 'system';

function readStoredPref(): ThemePref {
  try {
    const v = localStorage.getItem('seal-theme');
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function App() {
  const [pref, setPref] = useState<ThemePref>(readStoredPref);

  useEffect(() => {
    try {
      localStorage.setItem('seal-theme', pref);
    } catch {
      /* navegación privada */
    }
  }, [pref]);

  // Resuelve la preferencia (system sigue la apariencia del sistema en vivo)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (systemDark: boolean) => {
      const dark = pref === 'system' ? systemDark : pref === 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((m) => m.setAttribute('content', dark ? '#0c0e11' : '#faf9f5'));
    };
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      if (pref === 'system') apply(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return (
    <ToastProvider>
      <SocketProvider>
        <div className="App">
          <div className="bg-grid" aria-hidden />
          <Header pref={pref} onPrefChange={setPref} />
          <main className="site-main">
            <div className="hero">
              <p className="kicker">## audio &amp; video pipeline</p>
              <h1>
                Descarga video y audio<span className="dot">.</span>
              </h1>
              <p>
                Pega una URL de YouTube, TikTok, Instagram o Vimeo. Extracción de metadatos
                nativa, telemetría en vivo y biblioteca local.
              </p>
            </div>
            <DownloadForm />
            <DownloadHistory />
            <footer className="site-footer">
              <div>
                <span className="amber">~/seal-pipeline</span> · backend yt-dlp + ffmpeg
              </div>
              <div>
                <a
                  href="https://github.com/gaboLectric/Seal-Web-App"
                  target="_blank"
                  rel="noreferrer"
                >
                  repositorio
                </a>
                <span> · zero tracking</span>
              </div>
            </footer>
          </main>
        </div>
      </SocketProvider>
    </ToastProvider>
  );
}

export default App;
