# WhatsApp-Only Ecommerce (Wawapos Shop)

Single-page storefront built with vanilla HTML, CSS, and JavaScript to sell through WhatsApp. Shoppers can browse a curated catalog, filter products, add them to a lightweight cart, and send the order via WhatsApp with one click.

## Quick start
- Run any static server from the project root so `fetch` can read the JSON files. Example with Python: `python -m http.server 8000`
- Open `http://localhost:8000` in the browser.
- Browse products, open product detail pages, build a cart, and finish by tapping “Order securely” to open WhatsApp with a prefilled message.

## App behavior
- Navigation: Home, Catalog, Search, and per-product detail views handled with hash-based routing.
- Search: Keyword search plus quick category buttons defined in `config.json`.
- Cart: Add/remove items, adjust quantities, see totals, and clear cart. Checkout opens WhatsApp with the cart summary.
- WhatsApp: Uses `https://api.whatsapp.com/send` with the number from configuration; a floating action button and footer links reuse that number.
- Localization: UI copy is currently in Spanish; currency code is configurable.

## Data and configuration
### `config.json`
- `search-categories`: Array of strings used to build the quick-search buttons in the nav.
- `whatsapp-number`: Number used when generating WhatsApp links.
- `currency`: Currency code appended in price displays (default `COP`).

### `products.json`
Array of product objects consumed by the app:
- `slug`: Unique identifier used in URLs and cart lines.
- `product_name`: Display name.
- `description`: Long form description (supports any language).
- `price`: Numeric string; formatted with the configured currency.
- `image`: Image path (currently not rendered; placeholder icons are used).
- `tags`: Keywords used for search chips and filtering.

## Project structure
- `index.html` — markup and root layout.
- `app.js` — routing, search, cart logic, WhatsApp link builder, and rendering helpers.
- `styles.css` — visual design for the storefront, nav, cards, cart panel, and footer.
- `config.json` / `products.json` — editable data sources for categories, WhatsApp number, currency, and catalog items.
- `LICENSE` — MIT License.

## Customization tips
- Add or edit catalog items in `products.json`; keep `slug` unique.
- Update `config.json` to change quick-search chips, WhatsApp target number, or currency code.
- Replace the placeholder emoji imagery by wiring the `image` field into the templates in `app.js` and serving the assets.

## License
MIT License. See `LICENSE` for details.
