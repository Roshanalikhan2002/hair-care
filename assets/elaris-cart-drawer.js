(function () {
  'use strict';

  var moneyFormat =
    (window.__ELARIS && window.__ELARIS.moneyFormat) ||
    '{{amount}}';

  function formatMoney(cents) {
    if (typeof cents !== 'number') cents = parseInt(cents, 10) || 0;
    var amount = (Math.round(cents) / 100).toFixed(2);
    if (!moneyFormat) return amount;
    return String(moneyFormat).replace(/\{\{\s*amount\s*\}\}/gi, amount);
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var drawer = qs('#ElarisCartDrawer');
  if (!drawer) return;

  var linesEl = qs('[data-elaris-cart-lines]', drawer);
  var emptyEl = qs('[data-elaris-cart-empty]', drawer);
  var footEl = qs('[data-elaris-cart-foot]', drawer);
  var subtotalEl = qs('[data-elaris-cart-subtotal]', drawer);
  var countEls = qsa('[data-elaris-cart-count]');

  var openers = qsa('.elaris-cart-trigger');
  var lastFocus = null;

  function setCounts(n) {
    countEls.forEach(function (el) {
      el.textContent = n > 0 ? String(n) : '';
    });
  }

  function renderCart(cart) {
    if (!linesEl || !emptyEl || !footEl || !subtotalEl) return;

    var items = (cart && cart.items) || [];
    setCounts(cart && typeof cart.item_count === 'number' ? cart.item_count : items.length);

    if (items.length === 0) {
      emptyEl.hidden = false;
      footEl.hidden = true;
      linesEl.innerHTML = '';
      return;
    }

    emptyEl.hidden = true;
    footEl.hidden = false;
    subtotalEl.textContent = formatMoney(cart.total_price);

    linesEl.innerHTML = items
      .map(function (item) {
        var title = escapeHtml(item.product_title || item.title || '');
        var variant =
          item.variant_title && item.variant_title !== 'Default Title'
            ? '<div class="elaris-cart-drawer__line-variant">' +
              escapeHtml(item.variant_title) +
              '</div>'
            : '';
        var img = item.image
          ? '<img src="' +
            escapeAttr(item.image) +
            '" alt="" width="90" height="90" loading="lazy">'
          : '<span class="elaris-cart-drawer__thumb-fallback"></span>';
        var url = item.url ? escapeAttr(item.url) : '#';
        return (
          '<li class="elaris-cart-drawer__line" data-line-key="' +
          escapeAttr(item.key) +
          '">' +
          '<a href="' +
          url +
          '" class="elaris-cart-drawer__thumb" tabindex="-1">' +
          img +
          '</a>' +
          '<div class="elaris-cart-drawer__line-body">' +
          '<a href="' +
          url +
          '" class="elaris-cart-drawer__line-title">' +
          title +
          '</a>' +
          variant +
          '<div class="elaris-cart-drawer__line-meta">' +
          '<div class="elaris-cart-drawer__qty">' +
          '<button type="button" data-line-key="' +
          escapeAttr(item.key) +
          '" data-qty-change="-1" aria-label="Decrease quantity">−</button>' +
          '<span data-line-qty>' +
          item.quantity +
          '</span>' +
          '<button type="button" data-line-key="' +
          escapeAttr(item.key) +
          '" data-qty-change="1" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button type="button" class="elaris-cart-drawer__remove" data-line-key="' +
          escapeAttr(item.key) +
          '" data-remove-line aria-label="Remove">Remove</button>' +
          '</div></div>' +
          '<div class="elaris-cart-drawer__line-price">' +
          formatMoney(item.final_line_price) +
          '</div></li>'
        );
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function fetchCart() {
    return fetch('/cart.js', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    }).then(function (r) {
      if (!r.ok) throw new Error('cart');
      return r.json();
    });
  }

  function refresh() {
    return fetchCart()
      .then(renderCart)
      .catch(function () {});
  }

  function open() {
    if (drawer.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('elaris-cart-drawer-open');
    refresh();
    var closeBtn = qs('[data-elaris-cart-close].elaris-cart-drawer__close', drawer);
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('elaris-cart-drawer-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function toggle(e) {
    if (e) e.preventDefault();
    if (drawer.classList.contains('is-open')) close();
    else open();
  }

  openers.forEach(function (a) {
    a.addEventListener('click', toggle);
  });

  drawer.addEventListener('click', function (e) {
    if (e.target.closest('[data-elaris-cart-close]')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  drawer.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    var rm = t.closest('[data-remove-line]');
    if (rm) {
      e.preventDefault();
      var keyRm = rm.getAttribute('data-line-key');
      if (!keyRm) return;
      changeLine(keyRm, 0);
      return;
    }

    var ch = t.closest('[data-qty-change]');
    if (ch) {
      e.preventDefault();
      var key = ch.getAttribute('data-line-key');
      var delta = parseInt(ch.getAttribute('data-qty-change'), 10);
      if (!key || !delta) return;
      var li = ch.closest('.elaris-cart-drawer__line');
      var span = li ? li.querySelector('[data-line-qty]') : null;
      var cur = span ? parseInt(span.textContent, 10) || 1 : 1;
      changeLine(key, Math.max(0, cur + delta));
    }
  });

  function changeLine(key, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ id: key, quantity: quantity }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        if (cart && cart.message && !cart.items) throw new Error(cart.message);
        renderCart(cart);
        document.dispatchEvent(new CustomEvent('elaris:cart:updated', { detail: cart }));
      })
      .catch(function () {
        refresh();
      });
  }

  function addFromForm(form) {
    var u = new URL(form.action || '/cart/add', window.location.origin);
    u.pathname = u.pathname.replace(/\/cart\/add\/?$/, '/cart/add.js');
    var postUrl = u.pathname + u.search;
    return fetch(postUrl, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          var msg = (data && (data.description || data.message)) || 'Could not add to cart';
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    var action = form.getAttribute('action') || '';
    if (action.indexOf('/cart/add') === -1 && action.indexOf('cart/add') === -1) return;
    if (!form.closest('.elaris-product-page')) return;

    e.preventDefault();
    addFromForm(form)
      .then(function () {
        return refresh();
      })
      .then(function () {
        open();
        document.dispatchEvent(new CustomEvent('elaris:cart:added'));
      })
      .catch(function (err) {
        window.alert(err.message || 'Could not add to cart');
      });
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !a.href) return;
    if (a.classList.contains('elaris-cart-trigger')) return;
    var u;
    try {
      u = new URL(a.href, window.location.origin);
    } catch (err) {
      return;
    }
    if (u.pathname !== '/cart/add' && !u.pathname.endsWith('/cart/add')) return;
    if (u.searchParams.get('id') == null || u.searchParams.get('id') === '') return;

    e.preventDefault();
    var id = parseInt(u.searchParams.get('id'), 10);
    var qty = parseInt(u.searchParams.get('quantity'), 10) || 1;
    if (!id) return;

    fetch('/cart/add.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ items: [{ id: id, quantity: qty }] }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) {
            var msg = (data && (data.description || data.message)) || 'Could not add';
            throw new Error(msg);
          }
          return data;
        });
      })
      .then(function () {
        return refresh();
      })
      .then(function () {
        open();
        document.dispatchEvent(new CustomEvent('elaris:cart:added'));
      })
      .catch(function (err) {
        window.location.href = a.getAttribute('href');
      });
  });

  window.ElarisCartDrawer = { open: open, close: close, refresh: refresh };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      refresh();
    });
  } else {
    refresh();
  }
})();
