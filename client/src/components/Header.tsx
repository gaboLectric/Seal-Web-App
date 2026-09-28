import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import axios from 'axios';
import type { ThemePref } from '../App';

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

interface HeaderProps {
  pref: ThemePref;
  onPrefChange: (p: ThemePref) => void;
}

const themeOptions: { value: ThemePref; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'light', label: 'Modo claro', Icon: (p) => <Sun {...p} size={14} /> },
  { value: 'system', label: 'Tema del sistema', Icon: (p) => <Laptop {...p} size={14} /> },
  { value: 'dark', label: 'Modo oscuro', Icon: (p) => <Moon {...p} size={14} /> },
];

const Header: React.FC<HeaderProps> = ({ pref, onPrefChange }) => {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        // 304 (caché condicional) también significa que el daemon responde
        await axios.get(`${apiUrl}/formats/quality-presets`, {
          validateStatus: (s) => s >= 200 && s < 400,
        });
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-tile">
            <img src="/favicon.svg" alt="" />
          </div>
          <div className="brand-word">
            <span className="path">~/</span>seal<span className="cursor">_</span>
          </div>
          <span className="brand-chip">yt-dlp runtime</span>
        </div>

        <div className="header-actions">
          <div className={`daemon-pill ${online ? 'online' : ''}`} title={online ? 'Backend conectado' : 'Sin conexión con el servidor'}>
            <span className="daemon-dot" aria-hidden />
            <span className="daemon-label">{online === null ? 'conectando…' : online ? 'daemon activo' : 'sin conexión'}</span>
          </div>

          <div className="theme-tri" role="radiogroup" aria-label="Tema de color">
            {themeOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={pref === value}
                aria-label={label}
                title={label}
                className={pref === value ? 'active' : ''}
                onClick={() => onPrefChange(value)}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
