/* ═══════════════════════════════════════════════════════════════
   NAVBAR UNIVERSAL — Luz Divina Portal
   JS partilhado: menu mobile + tema claro/escuro
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Tema claro / escuro ── */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');

  function applyTheme(t) {
    if (t === 'claro') {
      root.classList.add('light-mode');
      if (themeBtn) themeBtn.textContent = '☀️';
    } else {
      root.classList.remove('light-mode');
      if (themeBtn) themeBtn.textContent = '☾';
    }
  }

  applyTheme(localStorage.getItem('tema') || 'escuro');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var isLight = root.classList.contains('light-mode');
      var next = isLight ? 'escuro' : 'claro';
      applyTheme(next);
      localStorage.setItem('tema', next);
    });
  }

  /* ── Menu mobile ── */
  var mobileNav = document.getElementById('mobileNav');
  var overlay   = document.getElementById('navOverlay');
  var toggleBtn = document.querySelector('.menu-toggle');

  function openMenu() {
    if (!mobileNav) return;
    mobileNav.classList.add('open');
    if (overlay) overlay.classList.add('open');
    if (toggleBtn) toggleBtn.textContent = '✕';
  }

  function closeMenu() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (toggleBtn) toggleBtn.textContent = '☰';
  }

  function toggleMenu() {
    mobileNav && mobileNav.classList.contains('open') ? closeMenu() : openMenu();
  }

  /* Expõe globalmente para os onclick inline do HTML */
  window.toggleMenu = toggleMenu;
  window.closeMenu  = closeMenu;

  /* Fecha ao clicar no overlay */
  if (overlay) overlay.addEventListener('click', closeMenu);

  /* Fecha ao redimensionar para desktop */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeMenu();
  });

  /* Marca o link activo na navbar com base no URL actual */
  var current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

})();
