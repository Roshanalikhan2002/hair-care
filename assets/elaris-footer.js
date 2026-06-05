(function () {
  function syncFooterAccordions() {
    var openDesktop = window.innerWidth > 1024;
    document.querySelectorAll('.footer-accordion').forEach(function (el) {
      if (openDesktop) {
        el.setAttribute('open', '');
      } else {
        el.removeAttribute('open');
      }
    });
  }

  syncFooterAccordions();
  window.addEventListener('resize', syncFooterAccordions);
})();
