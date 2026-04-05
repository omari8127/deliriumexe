// ================================================================
//  ABARROTES EL ROSAL - Lógica General
// ================================================================

let cart = JSON.parse(localStorage.getItem('cart')) || {};
let qtys = {};
let currentCat = 'all';

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  if (typeof allProducts !== 'undefined') {
    allProducts.forEach(p => { if(!qtys[p.id]) qtys[p.id] = 1; });
    initDropdown();
    updateCartUI();
    
    // Identificar en qué página estamos
    if (document.querySelector('.page-home')) initHome();
    if (document.querySelector('.page-productos')) initProductos();
    if (document.querySelector('.page-detalle')) initDetalle();
    if (document.querySelector('.page-promociones')) initPromociones();
  }
});

// --- DROPDOWN LOGIC ---
function initDropdown() {
  const trigger = document.getElementById('dept-trigger');
  const menu = document.getElementById('dept-menu');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('active');
    }
  });
}

// --- HOME PAGE LOGIC ---
function initHome() {
  buildCatStrip('cat-strip-home');
  renderFeatured(8);
}

// --- PRODUCTOS PAGE LOGIC ---
function initProductos() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  const q = params.get('q');

  if (document.getElementById('cat-strip')) buildCatStrip('cat-strip');
  
  if (cat) {
    showCat(cat);
  } else if (q) {
    document.getElementById('search-input').value = q;
    searchProducts(q);
  } else {
    buildMain();
  }
}

// --- PROMOCIONES PAGE LOGIC ---
let promoFilters = { cat: 'all', price: 500 };

function initPromociones() {
  const filterCatContainer = document.getElementById('filter-categories');
  if (!filterCatContainer) return;

  // Build category filters
  let h = `<div class="filter-item active" onclick="setPromoCat('all', this)">Todas</div>`;
  h += categories.map(c => `<div class="filter-item" onclick="setPromoCat('${c.id}', this)">${c.label}</div>`).join('');
  filterCatContainer.innerHTML = h;

  renderPromociones();
}

function setPromoCat(id, el) {
  promoFilters.cat = id;
  document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  renderPromociones();
}

function updatePriceFilter(val) {
  promoFilters.price = val;
  document.getElementById('price-max-label').textContent = val >= 500 ? '$500+' : '$' + val;
  renderPromociones();
}

function renderPromociones() {
  const grid = document.getElementById('promo-grid');
  const noRes = document.getElementById('no-results');
  if (!grid) return;

  const discounted = allProducts.filter(p => {
    const isPromo = p.oldPrice !== null;
    const matchesCat = promoFilters.cat === 'all' || p.cat === promoFilters.cat;
    const matchesPrice = p.price <= promoFilters.price;
    return isPromo && matchesCat && matchesPrice;
  });

  if (discounted.length === 0) {
    grid.innerHTML = '';
    noRes.style.display = 'block';
  } else {
    grid.innerHTML = discounted.map(p => cardHTML(p)).join('');
    noRes.style.display = 'none';
  }
}

// --- CATALOG RENDERING ---
function buildCatStrip(containerId) {
  const s = document.getElementById(containerId);
  if (!s) return;
  let h = `<div class="cat-chip active" id="chip-all" style="background:#333" onclick="showCat('all',this)"><span class="ico">🏪</span><span class="lbl">Todos</span></div>`;
  h += categories.map(c => `<div class="cat-chip" id="chip-${c.id}" style="background:${c.color}" onclick="showCat('${c.id}',this)"><span class="ico">${c.emoji}</span><span class="lbl">${c.label}</span></div>`).join('');
  s.innerHTML = h;
}

function showCat(id, el) {
  currentCat = id;
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  const target = el || document.getElementById('chip-' + id);
  if (target) target.classList.add('active');
  
  if (document.getElementById('search-input')) document.getElementById('search-input').value = '';
  if (document.getElementById('search-results')) document.getElementById('search-results').style.display = 'none';
  if (document.getElementById('main-content')) document.getElementById('main-content').style.display = '';
  
  buildMain();
}

function buildMain() {
  const container = document.getElementById('main-content');
  if (!container) return;

  const cats = currentCat === 'all' ? categories : categories.filter(c => c.id === currentCat);
  container.innerHTML = cats.map(cat => {
    const prods = allProducts.filter(p => p.cat === cat.id);
    return `
      <div class="section-wrap">
        <div class="section-title-bar">
          <div class="section-title-line"></div>
          <div class="section-title-badge" style="background:${cat.color}">${cat.emoji} ${cat.label}</div>
          <div class="section-title-line"></div>
        </div>
        <div class="products-grid">${prods.map(p => cardHTML(p)).join('')}</div>
      </div>`;
  }).join('');
}

function renderFeatured(limit) {
  const container = document.getElementById('featured-products');
  if (!container) return;
  const filtered = allProducts.filter(p => p.badge).slice(0, limit);
  container.innerHTML = filtered.map(p => cardHTML(p)).join('');
}

function cardHTML(p) {
  const badge = p.badge ? `<div class="prod-badge" style="background:${/^-\d/.test(p.badge) ? '#CC1F1F' : p.badge === 'Fresco' ? '#1a7a2e' : '#1A4FA0'}">${p.badge}</div>` : '';
  const imgPart = p.img
    ? `<img src="${p.img}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="prod-emoji" style="display:none">${p.emoji}</span>`
    : `<span class="prod-emoji">${p.emoji}</span>`;
    
  return `
    <div class="prod-card">
      ${badge}
      <a href="producto-detalle.html?id=${p.id}" class="prod-img-wrap">${imgPart}</a>
      <a href="producto-detalle.html?id=${p.id}" class="prod-name">${p.name}</a>
      <div class="prod-unit">${p.unit}</div>
      ${p.oldPrice ? `<div class="prod-price-old">$${p.oldPrice.toFixed(2)}</div>` : ''}
      <div class="prod-price">$${p.price.toFixed(2)}</div>
      <div class="prod-qty">
        <button onclick="changeQty(${p.id},-1)">-</button>
        <span id="qty-${p.id}">${qtys[p.id] || 1}</span>
        <button onclick="changeQty(${p.id},1)">+</button>
      </div>
      <button class="add-btn${cart[p.id] ? ' added' : ''}" id="abtn-${p.id}" onclick="addToCart(${p.id})">${cart[p.id] ? '✓ Agregado' : 'AGREGAR'}</button>
    </div>`;
}

// --- PRODUCT DETAIL LOGIC ---
function renderDetalle(id) {
  const p = allProducts.find(x => x.id === id);
  const container = document.getElementById('detalle-content');
  if (!p || !container) return;

  const catRaw = categories.find(c => c.id === p.cat);
  
  container.innerHTML = `
    <div class="breadcrumbs">
      <a href="index.html">Inicio</a> > <a href="productos.html?cat=${p.cat}">${catRaw ? catRaw.label : 'Productos'}</a> > <span>${p.name}</span>
    </div>
    <div class="detalle-img-wrap">
      ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span class="prod-emoji">${p.emoji}</span>`}
    </div>
    <div class="detalle-info">
      <span class="ref">Referencia: #${1000 + p.id}</span>
      <h1>${p.name}</h1>
      <div class="price">$${p.price.toFixed(2)}</div>
      <div class="detalle-buy">
        <div class="qty-selector">
          <button onclick="changeQty(${p.id},-1,true)">-</button>
          <span id="det-qty-${p.id}">${qtys[p.id] || 1}</span>
          <button onclick="changeQty(${p.id},1,true)">+</button>
        </div>
        <button class="btn-add-main" onclick="addToCart(${p.id})">AGREGAR AL CARRITO</button>
      </div>
    </div>
    <div class="detalle-desc">
      <h2>Descripción del producto</h2>
      <p>${p.desc || 'Este producto cumple con los más altos estándares de calidad de Abarrotes El Rosal. Ideal para el consumo diario en tu hogar.'}</p>
    </div>
  `;

  // Related products
  const related = allProducts.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 6);
  document.getElementById('related-grid').innerHTML = related.map(x => cardHTML(x)).join('');
}

// --- CART LOGIC ---
function changeQty(id, delta, isDetalle = false) {
  qtys[id] = (qtys[id] || 1) + delta;
  if (qtys[id] < 1) qtys[id] = 1;
  
  if (isDetalle) {
    const elDet = document.getElementById('det-qty-' + id);
    if (elDet) elDet.textContent = qtys[id];
  } else {
    const el = document.getElementById('qty-' + id);
    if (el) el.textContent = qtys[id];
  }
}

function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  const qty = qtys[id] || 1;
  
  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { ...p, qty };
  }
  
  saveCart();
  updateCartUI();
  
  const btn = document.getElementById('abtn-' + id);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = '✓ Agregado';
  }
}

function updateCartUI() {
  const items = Object.values(cart);
  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);

  const ids = ['hdr-count', 'float-count'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  });

  const ht = document.getElementById('hdr-total');
  if (ht) ht.textContent = total.toFixed(2);

  const cb = document.getElementById('cart-body');
  const cf = document.getElementById('cart-footer');
  const dt = document.getElementById('drawer-total');

  if (!cb) return;

  if (!items.length) {
    cb.innerHTML = '<div class="cart-empty">Tu carrito está vacío 🛒</div>';
    if (cf) cf.style.display = 'none';
    return;
  }

  cb.innerHTML = items.map(i => `
    <div class="cart-row">
      <div class="cart-row-name">${i.name}</div>
      <div class="cart-row-qty">
        <button onclick="cartQty(${i.id},-1)">-</button>
        <span>${i.qty}</span>
        <button onclick="cartQty(${i.id},1)">+</button>
      </div>
      <div class="cart-row-price">$${(i.price * i.qty).toFixed(2)}</div>
    </div>
  `).join('');

  if (cf) cf.style.display = 'block';
  if (dt) dt.textContent = '$' + total.toFixed(2);
}

function cartQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function toggleCart() {
  document.getElementById('cart-overlay').classList.toggle('open');
}

function outsideClose(e) {
  if (e.target === document.getElementById('cart-overlay')) toggleCart();
}

function sendWA() {
  const items = Object.values(cart);
  if (!items.length) return;
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  let msg = 'Hola! Quiero hacer un pedido en *Abarrotes El Rosal*:\n\n';
  items.forEach(i => {
    msg += `• ${i.name} x${i.qty} = $${(i.price * i.qty).toFixed(2)}\n`;
  });
  msg += `\n*TOTAL: $${total.toFixed(2)}*\n\nPor favor confirmar disponibilidad. Gracias!`;
  window.open('https://wa.me/526643944760?text=' + encodeURIComponent(msg), '_blank');
}

function searchProducts(q) {
  const main = document.getElementById('main-content');
  const sr = document.getElementById('search-results');
  const sg = document.getElementById('search-grid');
  
  if (!q.trim()) {
    if (sr) sr.style.display = 'none';
    if (main) main.style.display = '';
    return;
  }

  if (main) main.style.display = 'none';
  if (sr) sr.style.display = 'block';
  
  const res = allProducts.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  if (sg) {
    sg.innerHTML = res.length 
      ? res.map(p => cardHTML(p)).join('') 
      : '<p style="color:#666;padding:1rem;grid-column:1/-1">No se encontraron productos.</p>';
  }
}
