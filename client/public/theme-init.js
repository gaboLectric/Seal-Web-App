// Decide el tema antes del primer pintado para evitar el destello blanco
// en modo oscuro. App.tsx lo mantiene sincronizado a partir de aquí.
(function () {
  var forced = new URLSearchParams(location.search).get('theme');
  var dark = forced
    ? forced === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
