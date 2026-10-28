/* =========================================================
   ROSÉ ATELIER — script.js
   Vanilla JavaScript only. No libraries.
   ========================================================= */

'use strict';

/* ---------- 0. Helpers ---------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const CART_KEY = 'rose-atelier-cart';
const BASE_CUSTOM_PRICE = 2500;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Returns a price string such as "Rs. 6,500" */
function formatPrice(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-US');
}

/* Returns today's date in local time as YYYY-MM-DD */
function getTodayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/* Shows the pink toast message for a short time */
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-show'), 2600);
}

/* Splits text into <span class="char"> pieces for the letter reveal.
   Keeps any child elements (like the shimmer span) and only splits their text. */
function splitIntoChars(element, startDelay = 0, step = 28) {
  let index = 0;

  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();
        /* Each word is wrapped so a line never breaks in the middle of a word */
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(' '));
            return;
          }
          const word = document.createElement('span');
          word.className = 'word';
          Array.from(part).forEach((letter) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.setProperty('--d', `${startDelay + index * step}ms`);
            span.textContent = letter;
            word.appendChild(span);
            index++;
          });
          fragment.appendChild(word);
        });
        child.replaceWith(fragment);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(element);
}

/* ---------- 1. Preloader and typewriter ---------- */
function runPreloader() {
  const delay = prefersReducedMotion ? 200 : 1900;

  setTimeout(() => {
    $('#preloader').classList.add('is-done');
    document.body.classList.remove('is-loading');
    $$('#heroTitle .char').forEach((char) => char.classList.add('is-in'));
    startTypewriter($('#typewriter'), [
      'Pink, petal-soft and made to order.',
      'Designed by hand, baked with love.',
      'Eggless options, always fresh.'
    ]);
  }, delay);
}

/* Types each phrase, waits, deletes it, then moves to the next phrase */
function startTypewriter(element, phrases) {
  if (prefersReducedMotion) {
    element.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const current = phrases[phraseIndex];
    charIndex += deleting ? -1 : 1;
    element.textContent = current.slice(0, charIndex);

    let wait = deleting ? 40 : 85;
    if (!deleting && charIndex === current.length) {
      deleting = true;
      wait = 1800;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      wait = 400;
    }
    setTimeout(tick, wait);
  };

  tick();
}

/* ---------- 2. Petals in the hero (small canvas animation) ---------- */
function initPetals() {
  const canvas = $('#petalCanvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  const colors = ['#F8B7CB', '#FFE4EC', '#D6577F', '#C9A24A'];
  let petals = [];

  function createPetal(startAnywhere) {
    return {
      x: Math.random() * canvas.clientWidth,
      y: startAnywhere ? Math.random() * canvas.clientHeight : -20,
      size: 4 + Math.random() * 6,
      speed: 0.4 + Math.random() * 0.8,
      drift: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    petals.forEach((petal) => {
      petal.y += petal.speed;
      petal.drift += 0.02;
      petal.x += Math.sin(petal.drift) * 0.5;
      if (petal.y > canvas.clientHeight + 20) {
        Object.assign(petal, createPetal(false));
      }
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(petal.x, petal.y, petal.size, petal.size * 0.6, petal.drift, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  petals = Array.from({ length: 26 }, () => createPetal(true));
  window.addEventListener('resize', resize);
  draw();
}

/* ---------- 3. Scroll effects (progress bar, header, back to top) ---------- */
function updateOnScroll() {
  const scrollY = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? scrollY / scrollable : 0;

  document.documentElement.style.setProperty('--progress', progress.toFixed(4));
  $('#siteHeader').classList.toggle('is-scrolled', scrollY > 30);
  $('#backToTop').classList.toggle('is-visible', scrollY > 600);
}

function setupScrollEffects() {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOnScroll();
      ticking = false;
    });
  }, { passive: true });

  $('#backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  updateOnScroll();
}

/* Highlights the nav link of the section that is on screen */
function setupActiveNav() {
  const links = $$('.main-nav .nav-link');
  const sections = links.map((link) => $(link.getAttribute('href'))).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach((section) => observer.observe(section));
}

/* ---------- 4. Scroll reveal, stagger and counters ---------- */
function setupStagger() {
  ['.steps', '.product-grid', '.masonry', '.counters'].forEach((selector) => {
    const parent = $(selector);
    if (!parent) return;
    Array.from(parent.children).forEach((child, index) => {
      child.style.setProperty('--delay', `${index * 110}ms`);
    });
  });
}

function setupReveal() {
  const targets = $$('.reveal, .line-reveal');

  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      /* Remove the stagger delay after the reveal, so hover effects react at once */
      setTimeout(() => el.style.removeProperty('--delay'), 1500);
      observer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach((el) => observer.observe(el));
}

/* Counts up from 0 to the data-target number, with easing */
function animateCounter(element) {
  const target = Number(element.dataset.target);

  if (prefersReducedMotion) {
    element.textContent = target.toLocaleString('en-US');
    return;
  }

  const duration = 1800;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.floor(target * eased).toLocaleString('en-US');
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function setupCounters() {
  const block = $('.counters');
  if (!block) return;

  const observer = new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    $$('strong[data-target]', block).forEach((el) => animateCounter(el));
    obs.disconnect();
  }, { threshold: 0.4 });

  observer.observe(block);
}

/* ---------- 5. Buttons: ripple and magnetic effect ---------- */
function setupButtons() {
  $$('.btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (prefersReducedMotion) return;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      wave.style.left = `${event.clientX - rect.left - size / 2}px`;
      wave.style.top = `${event.clientY - rect.top - size / 2}px`;
      button.appendChild(wave);
      setTimeout(() => wave.remove(), 650);
    });
  });

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.2;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.2;
        button.style.setProperty('--mx', `${x}px`);
        button.style.setProperty('--my', `${y}px`);
      });
      button.addEventListener('mouseleave', () => {
        button.style.setProperty('--mx', '0px');
        button.style.setProperty('--my', '0px');
      });
    });
  }
}

/* ---------- 6. Mobile menu ---------- */
function setMobileMenu(isOpen) {
  const hamburger = $('#hamburger');
  hamburger.classList.toggle('is-open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  $('#mobilePanel').classList.toggle('is-open', isOpen);
  $('#mobileOverlay').classList.toggle('is-open', isOpen);
}

function setupMobileMenuEvents() {
  $('#hamburger').addEventListener('click', () => {
    setMobileMenu(!$('#mobilePanel').classList.contains('is-open'));
  });
  $('#mobileOverlay').addEventListener('click', () => setMobileMenu(false));
  $$('.mobile-link').forEach((link) => {
    link.addEventListener('click', () => setMobileMenu(false));
  });
}

/* ---------- 7. Cart (saved in localStorage) ---------- */
let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    /* storage is full or blocked: the cart still works for this visit */
  }
}

function getCartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount(items) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

function makeButton(label, ariaLabel, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', onClick);
  return button;
}

function addToCart(item) {
  const existing = cart.find((entry) => entry.id === item.id);
  cart = existing
    ? cart.map((entry) => (entry.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry))
    : [...cart, { id: item.id, name: item.name, price: item.price, qty: 1 }];

  saveCart(cart);
  renderCart();
  bumpCartCount();
}

function changeQty(id, delta) {
  cart = cart
    .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
    .filter((item) => item.qty > 0);

  saveCart(cart);
  renderCart();
}

function renderCart() {
  const list = $('#cartItems');
  list.innerHTML = '';

  cart.forEach((item) => {
    const li = document.createElement('li');

    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name;

    const price = document.createElement('span');
    price.className = 'item-price';
    price.textContent = formatPrice(item.price * item.qty);

    const qty = document.createElement('div');
    qty.className = 'qty';
    const count = document.createElement('span');
    count.textContent = String(item.qty);
    qty.append(
      makeButton('−', 'Decrease quantity', () => changeQty(item.id, -1)),
      count,
      makeButton('+', 'Increase quantity', () => changeQty(item.id, 1))
    );

    const remove = makeButton('Remove', `Remove ${item.name}`, () => changeQty(item.id, -item.qty));
    remove.classList.add('item-remove');

    li.append(name, price, qty, remove);
    list.appendChild(li);
  });

  $('#cartEmpty').hidden = cart.length > 0;
  $('#cartTotal').textContent = formatPrice(getCartTotal(cart));
  $('#cartCount').textContent = String(getCartCount(cart));
}

function bumpCartCount() {
  const badge = $('#cartCount');
  badge.classList.add('is-pop');
  setTimeout(() => badge.classList.remove('is-pop'), 300);
}

function setCartOpen(isOpen) {
  $('#cartDrawer').classList.toggle('is-open', isOpen);
  $('#cartOverlay').classList.toggle('is-open', isOpen);
  $('#cartDrawer').setAttribute('aria-hidden', String(!isOpen));
}

/* Copies the cart items into the enquiry notes, if the notes are empty */
function prefillEnquiry() {
  const notes = $('#oNotes');
  if (notes.value.trim() !== '') return;

  const lines = cart.map((item) => `${item.qty} x ${item.name}`);
  notes.value = `Cart items:\n${lines.join('\n')}\nEstimated total: ${formatPrice(getCartTotal(cart))}`;
}

function setupCart() {
  $('#cartBtn').addEventListener('click', () => setCartOpen(true));
  $('#cartClose').addEventListener('click', () => setCartOpen(false));
  $('#cartOverlay').addEventListener('click', () => setCartOpen(false));

  $('#checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Add a cake first, then send your enquiry');
      return;
    }
    prefillEnquiry();
    setCartOpen(false);
    $('#order').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ---------- 8. Products: filters, hearts, quick view, add to cart ---------- */
function findProductCard(id) {
  return $(`.product-card[data-id="${id}"]`);
}

function addProductToCart(card) {
  addToCart({
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price)
  });
  showToast(`${card.dataset.name} added to your cart`);
}

function openQuickView(card) {
  $('#qvName').textContent = card.dataset.name;
  $('#qvDesc').textContent = $('p', card).textContent;
  $('#qvPrice').textContent = formatPrice(card.dataset.price);
  $('#qvAdd').dataset.id = card.dataset.id;
  $('#quickModal').hidden = false;
  $('#quickClose').focus();
}

function closeQuickView() {
  $('#quickModal').hidden = true;
}

function setupFilters() {
  const buttons = $$('.filter-btn');
  const cards = $$('.product-card');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      buttons.forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });

      cards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-filtered-out', !match);
      });
    });
  });
}

function setupProducts() {
  /* Event delegation: one listener on the grid handles every card button */
  $('#productGrid').addEventListener('click', (event) => {
    const addButton = event.target.closest('.add-cart');
    const heart = event.target.closest('.heart-btn');
    const quick = event.target.closest('.quick-view-btn');

    if (addButton) {
      addProductToCart(addButton.closest('.product-card'));
    } else if (heart) {
      const wasPressed = heart.getAttribute('aria-pressed') === 'true';
      heart.setAttribute('aria-pressed', String(!wasPressed));
      heart.textContent = wasPressed ? '♡' : '♥';
    } else if (quick) {
      openQuickView(quick.closest('.product-card'));
    }
  });

  setupFilters();

  $('#qvAdd').addEventListener('click', () => {
    addProductToCart(findProductCard($('#qvAdd').dataset.id));
    closeQuickView();
  });
  $('#quickClose').addEventListener('click', closeQuickView);
  $('#quickModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeQuickView();
  });
}

/* ---------- 9. Custom cake builder with live price ---------- */
function getBuilderTotal() {
  const sizePrice = Number($('#bSize').selectedOptions[0].dataset.price);
  const flavourPrice = Number($('#bFlavour').selectedOptions[0].dataset.price);
  const layersPrice = Number($('#bLayers').value);
  return BASE_CUSTOM_PRICE + sizePrice + flavourPrice + layersPrice;
}

function updateBuilderPreview() {
  const size = $('#bSize');
  const flavour = $('#bFlavour');
  const layers = $('#bLayers');
  const colour = $('#bColour');
  const messageInput = $('#bMessage');
  const message = messageInput.value.trim();
  const cake = $('#previewCake');

  cake.classList.toggle('is-small', size.value === '500');
  cake.classList.toggle('is-large', size.value === '1500');
  cake.classList.remove('theme-rose', 'theme-deep', 'theme-cream');
  if (colour.value !== 'blush') {
    cake.classList.add(`theme-${colour.value}`);
  }

  $('#previewText').textContent = message || 'Your message appears here';
  $('#msgCount').textContent = `${messageInput.value.length}/30`;

  const sizeLabel = size.selectedOptions[0].textContent.split(' (')[0];
  $('#previewMeta').textContent = `${sizeLabel} · ${flavour.selectedOptions[0].textContent} · ${layers.selectedOptions[0].textContent}`;
  $('#builderTotal').textContent = formatPrice(getBuilderTotal());
}

function addCustomCake() {
  const sizeLabel = $('#bSize').selectedOptions[0].textContent.split(' (')[0];
  const flavourLabel = $('#bFlavour').selectedOptions[0].textContent;
  const message = $('#bMessage').value.trim();

  addToCart({
    id: `custom-${Date.now()}`,
    name: `Custom ${sizeLabel} · ${flavourLabel}${message ? ` · "${message}"` : ''}`,
    price: getBuilderTotal()
  });
  showToast('Custom cake added to your cart');
}

function setupBuilder() {
  const form = $('#builderForm');
  form.addEventListener('input', updateBuilderPreview);
  form.addEventListener('change', updateBuilderPreview);
  form.addEventListener('submit', (event) => event.preventDefault());
  $('#builderAdd').addEventListener('click', addCustomCake);
  updateBuilderPreview();
}

/* ---------- 10. Testimonials slider ---------- */
function setupTestimonials() {
  const slides = $$('.testimonial');
  const dotsBox = $('#testimonialDots');
  if (slides.length === 0) return;

  let current = 0;
  let timer;

  const dots = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Show review ${index + 1}`);
    dot.addEventListener('click', () => {
      show(index);
      restart();
    });
    dotsBox.appendChild(dot);
    return dot;
  });

  function show(index) {
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  function restart() {
    clearInterval(timer);
    if (!prefersReducedMotion) {
      timer = setInterval(() => show((current + 1) % slides.length), 5500);
    }
  }

  show(0);
  restart();
}

/* ---------- 11. Gallery lightbox ---------- */
function openLightbox(button) {
  const img = $('#lightboxImg');
  const fallback = $('#lightboxFallback');
  const caption = button.dataset.caption || '';

  $('#lightboxCaption').textContent = caption;
  img.alt = caption;
  img.hidden = false;
  fallback.hidden = true;
  fallback.textContent = $('span', button) ? $('span', button).textContent : '🎂';
  img.onerror = () => {
    img.hidden = true;
    fallback.hidden = false;
  };
  img.src = button.dataset.src;
  $('#lightbox').hidden = false;
  $('#lightboxClose').focus();
}

function closeLightbox() {
  $('#lightbox').hidden = true;
}

function setupLightbox() {
  $$('.gal').forEach((button) => {
    button.addEventListener('click', () => openLightbox(button));
  });
  $('#lightboxClose').addEventListener('click', closeLightbox);
  $('#lightbox').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeLightbox();
  });
}

/* ---------- 12. FAQ accordion ---------- */
function setupFaq() {
  $$('.faq__item').forEach((item) => {
    const question = $('.faq__q', item);
    const answer = $('.faq__a', item);

    question.addEventListener('click', () => {
      const willOpen = question.getAttribute('aria-expanded') !== 'true';

      /* Close every other item first */
      $$('.faq__item').forEach((other) => {
        $('.faq__q', other).setAttribute('aria-expanded', 'false');
        $('.faq__a', other).style.maxHeight = '0px';
      });

      if (willOpen) {
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });
}

/* ---------- 13. Order enquiry form ---------- */
function setFieldError(inputId, message) {
  const input = $(`#${inputId}`);
  $(`#${inputId}Err`).textContent = message;
  input.closest('.field').classList.toggle('is-invalid', message !== '');
  return message === '';
}

/* Returns true only when every field is valid */
function validateOrder() {
  const name = $('#oName').value.trim();
  const phone = $('#oPhone').value.trim();
  const email = $('#oEmail').value.trim();
  const date = $('#oDate').value;
  const phoneDigits = phone.replace(/\D/g, '');

  const results = [
    setFieldError('oName', name.length < 2 ? 'Please enter your name' : ''),
    setFieldError('oPhone', phoneDigits.length < 10 ? 'Enter a valid phone number' : ''),
    setFieldError('oEmail', email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email' : ''),
    setFieldError('oDate', date === '' ? 'Choose the date you need it' : date < getTodayISO() ? 'Date cannot be in the past' : '')
  ];

  return results.every(Boolean);
}

function setupOrderForm() {
  const form = $('#orderForm');
  $('#oDate').min = getTodayISO();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateOrder()) {
      showToast('Please fix the highlighted fields');
      return;
    }

    form.hidden = true;
    $('#orderSuccess').hidden = false;

    /* Clear the cart after a successful enquiry */
    cart = [];
    saveCart(cart);
    renderCart();
  });

  $$('input', form).forEach((input) => {
    input.addEventListener('input', () => {
      const err = $(`#${input.id}Err`);
      if (err) setFieldError(input.id, '');
    });
  });

  $('#orderAgain').addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    $('#orderSuccess').hidden = true;
  });
}

/* ---------- 14. Keyboard: Escape closes whatever is open ---------- */
function setupKeyboard() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeQuickView();
    closeLightbox();
    setCartOpen(false);
    setMobileMenu(false);
  });
}

/* ---------- 15. Start everything ---------- */
document.addEventListener('DOMContentLoaded', () => {
  splitIntoChars($('#heroTitle'), 200, 32);

  setupStagger();
  setupScrollEffects();
  setupActiveNav();
  setupReveal();
  setupCounters();
  setupButtons();
  setupMobileMenuEvents();
  setupCart();
  setupProducts();
  setupBuilder();
  setupTestimonials();
  setupLightbox();
  setupFaq();
  setupOrderForm();
  setupKeyboard();
  initPetals();
  renderCart();
  runPreloader();
});
