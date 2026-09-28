// Decide el tema antes del primer pintado para evitar el destello blanco
// en modo oscuro. Prioridad: preferencia guardada > ?theme= > apariencia del
// sistema. App.tsx lo mantiene sincronizado a partir de aquí.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem('seal-theme');
  } catch (e) {}
  var forced = new URLSearchParams(location.search).get('theme');
  var pref = forced || stored;
  var dark = pref
    ? pref === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
