// Decide el tema antes del primer pintado para evitar el destello.
// Prioridad: preferencia guardada (light|dark|system) > apariencia del sistema.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem('seal-theme');
  } catch (e) {}
  var pref = stored === 'light' || stored === 'dark' ? stored : 'system';
  var dark =
    pref === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : pref === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
