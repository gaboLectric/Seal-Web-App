const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const router = express.Router();

// Procesos de descarga activos, para poder cancelarlos por id
const running = new Map();

// POST /api/download
router.post('/', async (req, res) => {
  try {
    const { url, format, quality, audioOnly, embedCover, embedSubs } = req.body;
    const io = req.app.get('socketio');

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic URL validation - let yt-dlp handle specific format validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.' });
    }

    const downloadsDir = path.join(__dirname, '../../downloads');
    await fs.ensureDir(downloadsDir);

    // Build yt-dlp command with better YouTube handling
    const args = [];

    // Add user agent and headers to bypass some restrictions
    args.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    args.push('--add-header', 'Accept-Language:en-US,en;q=0.9');

    // Cookies exportadas de Chrome (seal-cookies.txt): evitan el bloqueo de
    // YouTube "Sign in to confirm you're not a bot". Se regeneran con:
    //   yt-dlp --cookies-from-browser chrome --cookies seal-cookies.txt -e <url>
    if (fs.existsSync(path.join(__dirname, '../../seal-cookies.txt'))) {
      args.push('--cookies', path.join(__dirname, '../../seal-cookies.txt'));
    }

    if (audioOnly) {
      args.push('-f', 'bestaudio/best');
      args.push('--extract-audio');
      args.push('--audio-format', format || 'mp3');
      if (embedCover) {
        args.push('--embed-thumbnail');
      }
    } else {
      if (quality && quality !== 'best') {
        args.push('-f', `best[height<=${quality}]/best`);
      } else {
        // Use 'b' instead of 'best' to suppress warning
        args.push('-f', 'b');
      }
      if (embedSubs) {
        args.push('--write-subs', '--embed-subs', '--sub-langs', 'es.*,en.*');
      }
    }

    args.push('-o', path.join(downloadsDir, '%(title)s.%(ext)s'));
    args.push('--no-playlist');
    args.push('--progress');
    args.push('--newline');
    args.push(url);

    const downloadId = Date.now().toString();

    // Spawn yt-dlp process
    const ytdlp = spawn('yt-dlp', args);

    let downloadInfo = {
      id: downloadId,
      url,
      status: 'starting',
      progress: 0,
      filename: '',
      totalSize: '',
      speed: '',
      eta: '',
      logLine: '',
      error: null
    };

    let partialFile = null;

    running.set(downloadId, { proc: ytdlp, partialFile: () => partialFile });
    io.emit('download-start', downloadInfo);

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp stdout:', output);

      for (const rawLine of output.split('\n')) {
        const line = rawLine.trim();
        if (!line) continue;

        // Línea de progreso: %, tamaño total, velocidad y ETA
        const p = line.match(
          /\[download\]\s+([\d.]+)%(?:\s+of\s+~?\s*([\d.]+\w+))?(?:.*?at\s+([\d.]+\w+\/s))?(?:.*?ETA\s+([\d:]+))?/
        );
        if (p) {
          downloadInfo.progress = parseFloat(p[1]);
          downloadInfo.totalSize = p[2] || downloadInfo.totalSize;
          downloadInfo.speed = p[3] || downloadInfo.speed;
          downloadInfo.eta = p[4] || downloadInfo.eta;
          downloadInfo.status = 'downloading';
        }

        // Nombre de archivo destino (descarga, extracción de audio o fusión)
        const dest = line.match(/\[download\] Destination: (.+)/) ||
          line.match(/\[ExtractAudio\] Destination: (.+)/);
        if (dest) {
          downloadInfo.filename = path.basename(dest[1].trim());
          partialFile = dest[1].trim() + '.part';
        }
        const merged = line.match(/\[Merger\] Merging formats into "(.+)"/);
        if (merged) {
          downloadInfo.filename = path.basename(merged[1].trim());
          partialFile = null;
        }

        if (line.startsWith('[') || p) {
          downloadInfo.logLine = line;
        }
      }

      io.emit('download-progress', downloadInfo);
    });

    ytdlp.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('yt-dlp stderr:', error);
      // yt-dlp escribe avisos no fatales en stderr; solo es error si muere el proceso
      if (downloadInfo.status !== 'cancelled') {
        downloadInfo.logLine = error.split('\n')[0].trim();
      }
    });

    ytdlp.on('close', (code) => {
      running.delete(downloadId);

      if (downloadInfo.status === 'cancelled') return; // ya se emitió al cancelar

      if (code === 0) {
        downloadInfo.status = 'completed';
        downloadInfo.progress = 100;
        downloadInfo.eta = '';
        io.emit('download-complete', downloadInfo);
      } else {
        downloadInfo.status = 'error';
        downloadInfo.error =
          downloadInfo.logLine ||
          `Process exited with code ${code}`;
        io.emit('download-error', downloadInfo);
      }
    });

    res.json({
      success: true,
      downloadId,
      message: 'Download started'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      details: error.message
    });
  }
});

// POST /api/download/cancel/:id - Cancel a running download
router.post('/cancel/:id', async (req, res) => {
  const { id } = req.params;
  const entry = running.get(id);
  const io = req.app.get('socketio');

  if (!entry) {
    return res.status(404).json({ error: 'Download not found' });
  }

  entry.proc.kill('SIGTERM');
  running.delete(id);

  // Limpia el fragmento .part que quedó a medias
  try {
    const partial = entry.partialFile();
    if (partial && (await fs.pathExists(partial))) {
      await fs.remove(partial);
    }
  } catch (e) {
    console.warn('No se pudo limpiar el fragmento parcial:', e.message);
  }

  io.emit('download-error', {
    id,
    status: 'cancelled',
    progress: 0,
    filename: '',
    error: null
  });

  res.json({ success: true, message: 'Download cancelled' });
});

// GET /api/download/list - List downloaded files
router.get('/list', async (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, '../../downloads');
    // Omite archivos ocultos y fragmentos .part de descargas en curso
    const files = (await fs.readdir(downloadsDir)).filter(
      (f) => !f.startsWith('.') && !f.endsWith('.part')
    );

    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(downloadsDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    res.json(fileList);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET /api/download/file/:filename - Serve a downloaded file so other devices
// (e.g., a phone on the same network) can save it. ?inline=1 lo sirve
// reproducible en el navegador en vez de forzar la descarga.
router.get('/file/:filename', async (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, '../../downloads');
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(downloadsDir, safeName);

    // Security check - ensure file is inside the downloads directory
    if (!filePath.startsWith(downloadsDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (req.query.inline) {
      return res.sendFile(filePath);
    }
    res.download(filePath, safeName);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// DELETE /api/download/:filename - Delete a downloaded file
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../downloads', filename);

    // Security check - ensure file is in downloads directory
    if (!filePath.startsWith(path.join(__dirname, '../../downloads'))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    await fs.remove(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
