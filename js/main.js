(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  if (!button) return;

  function update() {
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && system.matches);
    button.textContent = dark ? '浅色' : '暗色';
    button.setAttribute('aria-label', dark ? '切换为浅色模式' : '切换为暗色模式');
  }

  button.addEventListener('click', function () {
    var theme = button.textContent === '暗色' ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (error) { /* Storage is optional. */ }
    update();
  });
  system.addEventListener('change', update);
  update();
  button.hidden = false;
}());
