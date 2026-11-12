(function () {
  'use strict';

  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var button = nav.querySelector('.menu-icon');
  var mobile = window.matchMedia('(max-width: 600px)');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  }

  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      button.focus();
    }
  });
  mobile.addEventListener('change', function () { setOpen(false); });
  button.hidden = false;
  nav.classList.add('is-enhanced');
}());
