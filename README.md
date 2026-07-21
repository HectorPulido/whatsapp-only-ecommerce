# 🛍️ WhatsApp-Only Ecommerce (Wawapos Shop)

**A storefront with no backend and no checkout: the whole "payment flow" is a WhatsApp message.**

![Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML%2FCSS%2FJS-f7df1e?logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
![License](https://img.shields.io/github/license/HectorPulido/whatsapp-only-ecommerce?color=orange)

Single-page storefront built with vanilla HTML, CSS and JavaScript to sell through WhatsApp. Shoppers browse a curated catalog, filter products, add them to a lightweight cart, and send the order via WhatsApp with one click — perfect for small shops that already sell through chat.

## 🚀 Quick start

### With Docker (recommended)

```bash
docker compose up -d
```

Then open <http://localhost:19948> — nginx serves the app read-only.

### Without Docker

Run any static server from the `app/` folder so `fetch` can read the JSON files:

```bash
cd app
python -m http.server 8000
```

Then open <http://localhost:8000>.

## ✨ App behavior

- **Navigation:** Home, Catalog, Search, and per-product detail views handled with hash-based routing.
- **Search:** Keyword search plus quick category buttons defined in `config.json`.
- **Cart:** Add/remove items, adjust quantities, see totals, and clear cart. Checkout opens WhatsApp with the cart summary.
- **WhatsApp:** Uses `https://api.whatsapp.com/send` with the number from configuration; a floating action button and footer links reuse that number.
- **Localization:** UI copy is currently in Spanish; currency code is configurable.

## ⚙️ Data and configuration

### `app/config.json`

| Key | Purpose |
|---|---|
| `search-categories` | Array of strings used to build the quick-search buttons in the nav |
| `whatsapp-number` | Number used when generating WhatsApp links |
| `currency` | Currency code appended in price displays (default `COP`) |

### `app/products.json`

Array of product objects consumed by the app:

| Field | Purpose |
|---|---|
| `slug` | Unique identifier used in URLs and cart lines |
| `product_name` | Display name |
| `description` | Long form description (supports any language) |
| `price` | Numeric string; formatted with the configured currency |
| `image` | Image path (currently not rendered; placeholder icons are used) |
| `tags` | Keywords used for search chips and filtering |

## 📁 Project structure

```
app/
├── index.html     # markup and root layout
├── app.js         # routing, search, cart logic, WhatsApp link builder
├── styles.css     # storefront, nav, cards, cart panel and footer styles
├── config.json    # categories, WhatsApp number, currency
└── products.json  # the catalog
nginx/nginx.conf   # nginx config used by docker compose
docker-compose.yaml
```

## 🎨 Customization tips

- Add or edit catalog items in `app/products.json`; keep `slug` unique.
- Update `app/config.json` to change quick-search chips, WhatsApp target number, or currency code.
- Replace the placeholder emoji imagery by wiring the `image` field into the templates in `app.js` and serving the assets.

## License

MIT License. See `LICENSE` for details.

<div align="center">
<h3 align="center">Let's connect 😋</h3>
</div>
<p align="center">
<a href="https://www.linkedin.com/in/hector-pulido-17547369/" target="blank">
<img align="center" width="30px" alt="Hector's LinkedIn" src="https://www.vectorlogo.zone/logos/linkedin/linkedin-icon.svg"/></a> &nbsp; &nbsp;
<a href="https://twitter.com/Hector_Pulido_" target="blank">
<img align="center" width="30px" alt="Hector's Twitter" src="https://www.vectorlogo.zone/logos/twitter/twitter-official.svg"/></a> &nbsp; &nbsp;
<a href="https://www.twitch.tv/hector_pulido_" target="blank">
<img align="center" width="30px" alt="Hector's Twitch" src="https://www.vectorlogo.zone/logos/twitch/twitch-icon.svg"/></a> &nbsp; &nbsp;
<a href="https://www.youtube.com/channel/UCS_iMeH0P0nsIDPvBaJckOw" target="blank">
<img align="center" width="30px" alt="Hector's Youtube" src="https://www.vectorlogo.zone/logos/youtube/youtube-icon.svg"/></a>
</p>
