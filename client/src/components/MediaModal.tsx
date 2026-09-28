import React from 'react';
import { X } from 'lucide-react';

export interface MediaItem {
  name: string;
  size: number;
  createdAt: string;
}

const apiUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api';

const VIDEO_EXT = ['mp4', 'webm', 'mkv', 'mov', 'avi'];
const AUDIO_EXT = ['mp3', 'm4a', 'opus', 'wav', 'flac', 'ogg', 'aac'];

const ext = (name: string) => name.split('.').pop()?.toLowerCase() || '';

export const isPlayable = (name: string) =>
  VIDEO_EXT.includes(ext(name)) || AUDIO_EXT.includes(ext(name));

export const fileKind = (name: string): 'video' | 'audio' | 'other' =>
  VIDEO_EXT.includes(ext(name)) ? 'video' : AUDIO_EXT.includes(ext(name)) ? 'audio' : 'other';

interface MediaModalProps {
  item: MediaItem;
  onClose: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ item, onClose }) => {
  const kind = fileKind(item.name);
  const src = `${apiUrl}/download/file/${encodeURIComponent(item.name)}?inline=1`;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={`Reproducir ${item.name}`}>
        <div className="modal-head">
          <span className="modal-tag">
            <span className="amber">[player]</span> <span className="dim">{ext(item.name).toUpperCase()}</span>
          </span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar reproductor">
            <X size={16} />
          </button>
        </div>

        <div className="modal-media">
          {kind === 'video' ? (
            <video src={src} controls autoPlay playsInline />
          ) : kind === 'audio' ? (
            <audio src={src} controls autoPlay />
          ) : (
            <p style={{ color: 'var(--code-dim)', fontFamily: 'var(--mono)', fontSize: 12, padding: 24, textAlign: 'center', margin: 0 }}>
              vista previa no disponible para este formato
            </p>
          )}
        </div>

        <p className="modal-title">{item.name}</p>
        <p className="modal-meta">
          {kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'archivo'} ·{' '}
          {(item.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
    </div>
  );
};

export default MediaModal;
