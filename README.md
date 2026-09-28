# Seal Web App

Descargador de video y audio basado en [yt-dlp](https://github.com/yt-dlp/yt-dlp) con una interfaz web de estética Apple: vidrio esmerilado, control segmentado de iOS, listas agrupadas y modo oscuro automático.

Inspirado en la [app Seal para Android](https://github.com/JunkFood02/Seal) de JunkFood02 y basado en el proyecto original de [sh13y/Seal-Web-App](https://github.com/sh13y/Seal-Web-App).

## Requisitos

- Node.js 16+
- yt-dlp y ffmpeg:
  ```bash
  brew install yt-dlp ffmpeg
  ```

## Instalación

```bash
npm run install:all
```

## Uso en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:4000 (configurable en `client/.env`)
- API: http://localhost:5001

## Uso en producción

```bash
npm run build
npm start
```

Un solo proceso sirve todo (interfaz + API) en http://localhost:5001.

## Servidor siempre activo (Mac)

El servicio `com.gabolectric.seal` (LaunchAgent) arranca la app sola al encender la Mac y la reinicia si falla:

```bash
launchctl kickstart -k gui/501/com.gabolectric.seal   # reiniciar
launchctl bootout gui/501/com.gabolectric.seal         # detener
tail -f ~/Library/Logs/seal.log                        # ver registros
```

## Usar desde el iPhone

Con la Mac y el iPhone en la misma red WiFi:

1. Ejecuta `npm run build && npm start`.
2. Averigua la IP de tu Mac: *Ajustes → Wi-Fi → Detalles* (o `ipconfig getifaddr en0`).
3. En Safari del iPhone abre `http://<IP-de-la-Mac>:5001`.
4. Los archivos que descargues quedan en la Mac; tócalos en el **Historial** con el botón de descarga para guardarlos en tu iPhone (app Archivos).
5. Menú compartir → **Agregar a pantalla de inicio** para usarlo como una app.

Para acceso fuera de tu red, la opción más simple y privada es [Tailscale](https://tailscale.com) (gratis para uso personal): instala la app en la Mac y el iPhone y accede con la IP 100.x.x.x de la Mac desde cualquier lugar.

> No publiques esta app en un hosting público (Netlify, Vercel…): el backend necesita yt-dlp y un disco real, y quedaría expuesta para que cualquiera la use.

## Notas

- El tema (claro/oscuro) sigue la apariencia del sistema; puedes forzarlo con `?theme=dark` o `?theme=light` en la URL.
- Las descargas se guardan en `downloads/`.
- **Vimeo** actualmente exige iniciar sesión para yt-dlp; para descargar de ahí haría falta pasar cookies (`--cookies-from-browser`). YouTube y la mayoría de sitios funcionan sin credenciales.

## Licencia

[WTFPL](LICENSE)
