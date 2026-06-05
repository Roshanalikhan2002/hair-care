(function () {
  var MOBILE_QUERY = window.matchMedia('(max-width: 1024px)');

  function getShopHref(navbar) {
    var shop = navbar.querySelector('.navbar__shop');
    if (shop && shop.href) return shop.href;
    var navShop = navbar.querySelector('.desktop-nav a');
    if (navShop && navShop.href) return navShop.href;
    return '/collections/all';
  }

  function createDrawer(shopHref, navbar) {
    var drawer = document.createElement('div');
    drawer.className = 'navbar-drawer';
    drawer.setAttribute('data-navbar-drawer', '');
    drawer.hidden = true;
    drawer.innerHTML =
      '<div class="navbar-drawer__overlay" data-navbar-drawer-close></div>' +
      '<div class="navbar-drawer__panel" role="dialog" aria-modal="true" aria-label="Navigation">' +
      '<button type="button" class="navbar-drawer__close" aria-label="Close menu" data-navbar-drawer-close>&times;</button>' +
      '<a class="navbar-drawer__link" href="' + shopHref + '">Shop</a>' +
      '</div>';
    navbar.insertAdjacentElement('afterend', drawer);
    return drawer;
  }

  function findDrawer(navbar) {
    var sibling = navbar.nextElementSibling;
    if (sibling && sibling.hasAttribute('data-navbar-drawer')) return sibling;
    return document.querySelector('[data-navbar-drawer]');
  }

  function bindDrawer(menuBtn, drawer) {
    if (menuBtn.dataset.drawerBound === 'true') return;
    menuBtn.dataset.drawerBound = 'true';
    menuBtn.setAttribute('aria-expanded', 'false');

    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.hidden = true;
      document.body.style.overflow = '';
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    function openDrawer() {
      drawer.hidden = false;
      requestAnimationFrame(function () {
        drawer.classList.add('is-open');
      });
      document.body.style.overflow = 'hidden';
      menuBtn.setAttribute('aria-expanded', 'true');
    }

    menuBtn.addEventListener('click', function (event) {
      if (!MOBILE_QUERY.matches) return;
      event.preventDefault();
      event.stopPropagation();
      if (drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });

    drawer.querySelectorAll('[data-navbar-drawer-close]').forEach(function (button) {
      button.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  function initNavbarDrawers() {
    document.querySelectorAll('.navbar .menu-btn').forEach(function (menuBtn) {
      var navbar = menuBtn.closest('.navbar');
      if (!navbar) return;

      var drawer = findDrawer(navbar);
      if (!drawer) drawer = createDrawer(getShopHref(navbar), navbar);
      bindDrawer(menuBtn, drawer);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarDrawers);
  } else {
    initNavbarDrawers();
  }
})();
