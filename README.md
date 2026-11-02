# Woodland International Store

Spare parts catalogue with a cart and WhatsApp ordering, plus a staff dashboard. Next.js 16, TypeScript, Tailwind 4, SQLite (Node's built-in `node:sqlite`), zod, Vitest.

## What works
- Storefront: home, shop with search/filters/sort, categories, product pages, vehicle finder, cart, checkout, order confirmation, About, Contact, FAQ, Privacy, Terms, sitemap, robots.
- Orders are saved first (with a snapshot of each line), then WhatsApp opens at `https://wa.me/255771889889?text=...`. Prices and stock always come from the database. A repeated click returns the same order. Opening WhatsApp never confirms an order or reduces stock; WhatsApp handoff status is separate from order status.
- Staff dashboard at `/admin`: products (images, prices, stock log, compatibility), categories, vehicles, orders (status, notes, confirmed prices, delivery fee, final total, print, CSV export), enquiries, CSV import with preview and CSV export, staff users and roles, settings (hours, map).
- Roles (enforced on the server in every page and action): Super Admin (everything), Sales Staff (orders, enquiries), Inventory Staff (products, stock, categories, vehicles, import; not prices).

## Not done / honest limits
- No logo or product photos were supplied. The header uses a text wordmark and products show "Photo coming soon" until photos are uploaded in the admin.
- No invented prices, stock, hours, map location or certifications. Demo products (admin > Products > Add DEMO products) are labelled DEMO and removable.
- Excel (.xlsx) import/export is not built; use CSV (save from Excel as CSV UTF-8, format part-number cells as Text).
- Not yet tested in a browser (the build was kept off the local machine to save disk space). Unit tests cover search, order creation, stock rules, the WhatsApp message and encoding, CSV and import.
- Rate limiting is in memory per server process.

## Run / deploy
Needs **Node 24+** and a **persistent disk** (the database is a file; serverless hosts such as Vercel will lose it).

```bash
npm install
npm run build
npm start
```

Environment variables (see `.env.example`):
- `DATABASE_FILE` path of the database file (default `data/woodland.db`). Back it up.
- `UPLOAD_DIR` where product images are stored (default `data/uploads`). Keep on the same persistent disk.
- `SETUP_TOKEN` required in production to create the first admin at `/admin/setup`.
- `NEXT_PUBLIC_SITE_URL` the public address, for sitemap and links.

First run: open `/admin/setup` once to create the owner account (the page disappears after that).

## Tests
```bash
npm test
npm run typecheck
```
