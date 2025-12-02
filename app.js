const state = {
  products: [],
  filteredProducts: [],
  cart: [],
  currentView: "home",
  currentProduct: null,
  searchQuery: "",
  searchCategories: [],
  whatsappNumber: "",
  currency: "COP",
};

const viewContainer = document.getElementById("viewContainer");
const navInner = document.querySelector(".nav-inner");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const cartCountEl = document.getElementById("cartCount");
const yearEl = document.getElementById("year");
const HASH_PREFIX = "#/";
const DEFAULT_WHATSAPP_NUMBER = "573008368595";
const bodyEl = document.body;
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsList = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCheckoutBtn = document.getElementById("cartCheckout");
const cartCloseBtn = document.getElementById("cartClose");
const cartEmptyState = document.getElementById("cartEmpty");
const cartButton = document.getElementById("cartButton");
const DEFAULT_CURRENCY = "COP";

function normalizeText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesKeywords(product, terms) {
  if (!terms.length) return true;

  const haystack = [
    product.product_name,
    product.description,
    product.tags.join(" "),
    product.slug,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");

  return terms.every((term) => haystack.includes(term));
}

function applySearch(query = "") {
  state.searchQuery = query;
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);

  state.filteredProducts = state.products.filter((p) =>
    matchesKeywords(p, terms),
  );

  return terms;
}

function parseSegments(segments) {
  if (!segments.length) return { view: "home" };

  const [first, second] = segments;
  if (first === "catalog") return { view: "catalog" };
  if (first === "search")
    return { view: "search", query: second ? decodeURIComponent(second) : "" };
  if (first === "detail" && second) return { view: "detail", slug: second };
  return { view: "home" };
}

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, "");
  const hashSegments = hash.split("/").filter(Boolean);
  if (hashSegments.length) return parseSegments(hashSegments);

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  return parseSegments(pathSegments);
}

function updateRoute(view, slug = null, replace = false) {
  let next = "/";
  if (view === "catalog") next = "catalog";
  if (view === "detail" && slug) next = `detail/${slug}`;
  if (view === "search") {
    const encoded = slug ? encodeURIComponent(slug) : "";
    next = encoded ? `search/${encoded}` : "search";
  }

  const targetHash = `${HASH_PREFIX}${next}`;
  if (replace) {
    const newUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
    window.history.replaceState({ view, slug }, "", newUrl);
  } else {
    window.location.hash = targetHash;
  }
}

// Inicializar año footer
yearEl.textContent = new Date().getFullYear();

const productsUrl = new URL(
  "products.json",
  document.currentScript?.src || window.location.href,
);
const configUrl = new URL(
  "config.json",
  document.currentScript?.src || window.location.href,
);

// Fetch productos y config
Promise.all([fetch(productsUrl), fetch(configUrl)])
  .then(async ([productsRes, configRes]) => {
    const [productsData, configData] = await Promise.all([
      productsRes.json(),
      configRes.ok
        ? configRes.json()
        : { "search-categories": [], "whatsapp-number": DEFAULT_WHATSAPP_NUMBER },
    ]);
    state.products = productsData;
    state.filteredProducts = productsData;
    state.searchCategories = configData["search-categories"] || [];
    state.whatsappNumber =
      configData["whatsapp-number"] || DEFAULT_WHATSAPP_NUMBER;
    state.currency = (configData["currency"] || DEFAULT_CURRENCY).toUpperCase();
    renderSearchCategoryButtons();
    updateCartBadge();
    updateWhatsappUI();

    const route = parseRoute();
    changeView(route.view, route.slug || route.query, true, true);
  })
  .catch((err) => {
    console.error("Error cargando configuración inicial", err);
    viewContainer.innerHTML = "<p>No se pudieron cargar los productos 😿</p>";
  });

// Navegación (delegada)
if (navInner) {
  navInner.addEventListener("click", (event) => {
    const btn = event.target.closest(".nav-link");
    if (!btn) return;
    const view = btn.dataset.view;
    if (!view) return;
    const slug = view === "search" ? btn.dataset.query || "" : null;
    changeView(view, slug);
  });
}

window.addEventListener("hashchange", () => {
  const route = parseRoute();
  changeView(route.view, route.slug || route.query, true, true);
});

if (cartButton) {
  cartButton.addEventListener("click", () => toggleCart(true));
}

if (cartOverlay) {
  cartOverlay.addEventListener("click", () => toggleCart(false));
}

if (cartCloseBtn) {
  cartCloseBtn.addEventListener("click", () => toggleCart(false));
}

if (cartCheckoutBtn) {
  cartCheckoutBtn.addEventListener("click", () => {
    if (!state.cart.length) {
      alert("Tu carrito está vacío.");
      return;
    }
    const message = buildCartCheckoutMessage();
    const url = buildWhatsappLink(message);
    const whatsappWindow = window.open(url, "_blank");
    if (whatsappWindow) {
      whatsappWindow.opener = null;
    }
  });
}

const cartClearBtn = document.getElementById("cartClear");
if (cartClearBtn) {
  cartClearBtn.addEventListener("click", () => {
    state.cart = [];
    updateCartBadge();
    renderCartPanel();
  });
}

// Envío de búsqueda (enter o botón)
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const rawQuery = searchInput.value.trim();
  changeView("search", rawQuery);
});

// Manejo básico de carrito
function addToCart(product) {
  if (!product) return;
  const existing = state.cart.find((item) => item.slug === product.slug);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ slug: product.slug, quantity: 1 });
  }
  updateCartBadge();
  renderCartPanel();
  toggleCart(true);
}

function buyNow(product) {
  if (!product) return;
  const url = buildWhatsappLink(
    `Hola quiero comprar ${product.product_name}`,
  );
  const whatsappWindow = window.open(url, "_blank");
  if (whatsappWindow) {
    whatsappWindow.opener = null;
  }
}

// Helpers de vista
function changeView(
  view,
  productSlug = null,
  skipRouteUpdate = false,
  replaceRoute = false,
) {
  state.currentView = view;
  state.currentProduct = null;

  if (view === "search") {
    const query = productSlug || state.searchQuery || "";
    applySearch(query);
  } else {
    state.searchQuery = "";
    state.filteredProducts = [...state.products];
  }

  updateNavActive(view);

  searchInput.value = state.searchQuery || "";

  if (!skipRouteUpdate) {
    updateRoute(view, productSlug, replaceRoute);
  }

  if (view === "home") {
    renderHome();
  } else if (view === "catalog") {
    renderCatalog();
  } else if (view === "search") {
    renderSearch();
  } else if (view === "detail" && productSlug) {
    const product = state.products.find((p) => p.slug === productSlug);
    state.currentProduct = product || null;
    renderDetail();
  }
}

function renderView() {
  if (state.currentView === "home") {
    renderHome();
  } else if (state.currentView === "catalog") {
    renderCatalog();
  } else if (state.currentView === "search") {
    renderSearch();
  } else if (state.currentView === "detail") {
    renderDetail();
  }
}

/* RENDER HOME */

function renderHome() {
  const featured = state.products.slice(0, 3);

  viewContainer.innerHTML = `
    <section class="hero">
      <div>
        <h1 class="hero-main-title">Todo para tus mejores amigos peludos</h1>
        <p class="hero-subtitle">
          Fórmulas super premium para perros y gatos: cachorros, senior, sensibles
          y con alta actividad. Encuentra el alimento ideal en Wawapos shop.
        </p>

        <div class="hero-badges">
          <span class="hero-badge">Perros 🐶</span>
          <span class="hero-badge">Gatos 🐱</span>
          <span class="hero-badge">Cachorros</span>
          <span class="hero-badge">Senior</span>
        </div>

        <div class="hero-highlight">
          ⭐ Desde 100.000$ llevate tu bolsa de croquetas.
        </div>

        <div class="hero-buttons">
          <button class="btn-primary" id="homeGoCatalog">Ver catálogo</button>
        </div>
      </div>
      <div class="hero-illustration">
        🐾
      </div>
    </section>

    <section>
      <h2 class="section-title">Recomendados para empezar</h2>
      <div class="product-grid">
        ${featured.map((p) => productCardTemplate(p)).join("")}
      </div>
    </section>
  `;

  // Botón "Ver catálogo" en home
  const homeGoCatalog = document.getElementById("homeGoCatalog");
  if (homeGoCatalog) {
    homeGoCatalog.addEventListener("click", () => changeView("catalog"));
  }

  attachCardButtonListeners();
}

/* RENDER CATÁLOGO */

function renderCatalog() {
  const catalogProducts = state.products;
  viewContainer.innerHTML = `
    <section>
      <h2 class="section-title">Catálogo de productos</h2>
      <p style="margin-bottom: 8px; font-size: 0.9rem; color: #555;">
        Resultados: ${catalogProducts.length} producto(s)
      </p>
      <div class="product-grid">
        ${catalogProducts.map((p) => productCardTemplate(p)).join("")}
      </div>
    </section>
  `;
  attachCardButtonListeners();
}

/* RENDER SEARCH */

function renderSearch() {
  const queryDisplay = state.searchQuery || "todas las coincidencias";
  viewContainer.innerHTML = `
    <section>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div>
          <h2 class="section-title" style="margin-bottom:4px;">Búsqueda</h2>
          <p style="margin-bottom: 4px; font-size: 0.95rem; color: #444;">
            Estás buscando: <strong>${queryDisplay}</strong>
          </p>
          <p style="font-size: 0.9rem; color: #666;">${state.filteredProducts.length} resultado(s)</p>
        </div>
      </div>
      <div class="product-grid" style="margin-top:12px;">
        ${
          state.filteredProducts.length
            ? state.filteredProducts.map((p) => productCardTemplate(p)).join("")
            : `<p style="grid-column: 1 / -1; color: #555;">No encontramos coincidencias. Intenta con otras palabras.</p>`
        }
      </div>
    </section>
  `;

  const backBtn = document.getElementById("searchBackToCatalog");
  if (backBtn) backBtn.addEventListener("click", () => changeView("catalog"));
  attachCardButtonListeners();
}

/* RENDER DETALLE */

function renderDetail() {
  const product = state.currentProduct;
  if (!product) {
    viewContainer.innerHTML = `
      <p>Producto no encontrado 🙀</p>
      <button class="btn-secondary btn-small" id="backToCatalog">Volver al catálogo</button>
    `;
    const backBtn = document.getElementById("backToCatalog");
    if (backBtn) backBtn.addEventListener("click", () => changeView("catalog"));
    return;
  }

  viewContainer.innerHTML = `
    <button class="btn-secondary btn-small" id="backToCatalog">← Volver al catálogo</button>
    <section class="detail">
      <div class="detail-image">
        🐾
      </div>
      <div class="detail-info">
        <h1>${product.product_name}</h1>
        <p class="detail-description">${product.description}</p>

        <div class="card-tags detail-tags">
          ${product.tags
            .map((t) => `<span class="tag-pill">${t}</span>`)
            .join("")}
        </div>

        <div class="detail-meta">
          <span class="detail-price">${formatCurrency(product.price)}</span>
          <div class="detail-secure">
            <span class="secure-icon">🔒</span>
            <span>Pago contra entrega, seguro, el mismo dia</span>
          </div>
        </div>

        <div class="card-actions detail-actions">
          <button class="btn-primary" id="detailAddToCart">Añadir al carrito</button>
          <button class="btn-secondary" id="detailBuyNow">Comprar ahora</button>
        </div>
      </div>
    </section>
  `;

  const backBtn = document.getElementById("backToCatalog");
  const addBtn = document.getElementById("detailAddToCart");
  const buyBtn = document.getElementById("detailBuyNow");

  if (backBtn) backBtn.addEventListener("click", () => changeView("catalog"));
  if (addBtn) addBtn.addEventListener("click", () => addToCart(product));
  if (buyBtn) buyBtn.addEventListener("click", () => buyNow(product));
}

/* TEMPLATES & EVENTOS */

function productCardTemplate(product) {
  return `
    <article class="card" data-slug="${product.slug}">
      <div class="card-header">
        <div class="card-image">
          🦴
        </div>
        <div>
          <h3 class="card-title">${product.product_name}</h3>
          <div class="card-tags">
            ${product.tags
              .slice(0, 3)
              .map((t) => `<span class="tag-pill">${t}</span>`)
              .join("")}
          </div>
        </div>
      </div>
      <div class="card-price">${formatCurrency(product.price)}</div>
      <div class="card-actions">
        <button class="btn-primary" data-action="add" data-slug="${product.slug}">
          Añadir al carrito
        </button>
        <button class="btn-secondary btn-small" style="margin-top:4px;" data-action="buy" data-slug="${product.slug}">
          Comprar ahora
        </button>
      </div>

    </article>
  `;
}

function attachCardButtonListeners() {
  const buttons = viewContainer.querySelectorAll("[data-action]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = btn.dataset.action;
      const slug = btn.dataset.slug;
      const product = state.products.find((p) => p.slug === slug);
      if (!product) return;

      if (action === "add") {
        addToCart(product);
      } else if (action === "buy") {
        buyNow(product);
      }
    });
  });

  const cards = viewContainer.querySelectorAll(".card[data-slug]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const { slug } = card.dataset;
      if (!slug) return;
      changeView("detail", slug);
    });
  });
}

/* UTIL */

function formatPrice(value) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return value;
  return n.toLocaleString("es-CO");
}

function formatCurrency(value) {
  return `$${formatPrice(value)} ${(state.currency || DEFAULT_CURRENCY).toUpperCase()}`;
}

function getCartTotalItems() {
  return state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function getCartTotalAmount() {
  return state.cart.reduce((sum, item) => {
    const product = state.products.find((p) => p.slug === item.slug);
    if (!product) return sum;
    const price = parseInt(product.price, 10) || 0;
    return sum + price * item.quantity;
  }, 0);
}

function updateCartBadge() {
  if (!cartCountEl) return;
  cartCountEl.textContent = getCartTotalItems();
}

function changeCartQuantity(slug, delta) {
  const item = state.cart.find((i) => i.slug === slug);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((i) => i.slug !== slug);
  }
  updateCartBadge();
  renderCartPanel();
}

function removeFromCart(slug) {
  state.cart = state.cart.filter((i) => i.slug !== slug);
  updateCartBadge();
  renderCartPanel();
}

function toggleCart(forceState) {
  if (!cartPanel || !cartOverlay) return;
  const shouldOpen =
    typeof forceState === "boolean"
      ? forceState
      : !cartPanel.classList.contains("open");
  cartPanel.classList.toggle("open", shouldOpen);
  cartOverlay.classList.toggle("visible", shouldOpen);
  if (bodyEl) bodyEl.classList.toggle("cart-open", shouldOpen);
  if (shouldOpen) renderCartPanel();
}

function renderCartPanel() {
  if (!cartPanel || !cartItemsList || !cartTotalEl) return;
  const hasItems = state.cart.length > 0;
  if (cartEmptyState) cartEmptyState.style.display = hasItems ? "none" : "flex";
  cartItemsList.innerHTML = hasItems
    ? state.cart
        .map((item) => {
          const product = state.products.find((p) => p.slug === item.slug);
          if (!product) return "";
          const price = parseInt(product.price, 10) || 0;
          const lineTotal = price * item.quantity;
          return `
            <li class="cart-item">
              <div class="cart-item-info">
                <p class="cart-item-name">${product.product_name}</p>
                <p class="cart-item-meta">${formatCurrency(price)} · x${item.quantity}</p>
              </div>
              <div class="cart-item-actions">
                <button type="button" class="qty-btn" data-cart-action="dec" data-slug="${item.slug}">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button type="button" class="qty-btn" data-cart-action="inc" data-slug="${item.slug}">+</button>
                <span class="cart-item-line">${formatCurrency(lineTotal)}</span>
                <button type="button" class="remove-btn" data-cart-action="remove" data-slug="${item.slug}">✕</button>
              </div>
            </li>
          `;
        })
        .join("")
    : "";

  const totalAmount = getCartTotalAmount();
  cartTotalEl.textContent = formatCurrency(totalAmount);
  if (cartCheckoutBtn) cartCheckoutBtn.disabled = !hasItems;
  attachCartItemHandlers();
}

function normalizeWhatsappNumber(raw) {
  return (raw || "").replace(/\D/g, "") || DEFAULT_WHATSAPP_NUMBER;
}

function buildWhatsappLink(messageText) {
  const params = new URLSearchParams({
    phone: normalizeWhatsappNumber(state.whatsappNumber),
    text: messageText,
    type: "phone_number",
    app_absent: "0",
  });
  return `https://api.whatsapp.com/send/?${params.toString()}`;
}

function renderSearchCategoryButtons() {
  if (!navInner) return;
  const fragment = document.createDocumentFragment();
  state.searchCategories.forEach((cat) => {
    const label = cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "";
    const btn = document.createElement("button");
    btn.className = "nav-link";
    btn.dataset.view = "search";
    btn.dataset.query = cat;
    btn.textContent = label;
    fragment.appendChild(btn);
  });
  navInner.appendChild(fragment);
}

function updateNavActive(view) {
  if (!navInner) return;
  const buttons = navInner.querySelectorAll(".nav-link");
  buttons.forEach((btn) => {
    const isSearch = btn.dataset.view === "search";
    const matches =
      isSearch && view === "search"
        ? normalizeText(state.searchQuery) ===
          normalizeText(btn.dataset.query || "")
        : btn.dataset.view === view;
    btn.classList.toggle("active", matches);
  });
}

function updateWhatsappUI() {
  const displayNumber = state.whatsappNumber || DEFAULT_WHATSAPP_NUMBER;
  const footerNumber = document.getElementById("whatsappNumber");
  const footerLink = document.getElementById("whatsappFooterLink");
  const fab = document.getElementById("whatsappFab");

  if (footerNumber) footerNumber.textContent = displayNumber;
  if (footerLink)
    footerLink.href = buildWhatsappLink(
      "Hola, necesito ayuda con mi compra",
    );
  if (fab)
    fab.href = buildWhatsappLink(
      "Hola, quiero asesoría para mi mascota",
    );
}

function buildCartCheckoutMessage() {
  const list = state.cart
    .map((item) => {
      const product = state.products.find((p) => p.slug === item.slug);
      if (!product) return null;
      return `${product.product_name} x${item.quantity}`;
    })
    .filter(Boolean)
    .join(", ");
  return `Me gustaria comprar los siguientes productos: ${list}`;
}

function attachCartItemHandlers() {
  if (!cartItemsList) return;
  const buttons = cartItemsList.querySelectorAll("[data-cart-action]");
  buttons.forEach((btn) => {
    btn.onclick = (event) => {
      event.preventDefault();
      const action = btn.dataset.cartAction;
      const slug = btn.dataset.slug;
      if (!slug) return;
      if (action === "inc") changeCartQuantity(slug, 1);
      if (action === "dec") changeCartQuantity(slug, -1);
      if (action === "remove") removeFromCart(slug);
    };
  });
}
