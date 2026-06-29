# Stock Management API — Fetching Guide

Base URL (local dev): `http://127.0.0.1:8000`
Interactive docs: `http://127.0.0.1:8000/docs` (Swagger) or `/redoc`

All request/response bodies are JSON. All endpoints except `POST /auth/login` and `GET /health` require authentication.

---

## 1. Authentication

### Login

```
POST /auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "secret" }
```

Response:
```json
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

### Using the token

Every other request must include:
```
Authorization: Bearer <access_token>
```

The token encodes the user's `id` and `role`. There is no refresh-token endpoint — tokens are valid for `ACCESS_TOKEN_EXPIRE_MINUTES` (default 24h); re-login when expired (`401 Invalid or expired token`).

A deactivated account (`is_active=false`) gets `401` both at login and on every subsequent request, even with a previously-valid token.

### Roles

| Role | Value sent/returned |
|---|---|
| Admin | `admin` |
| Manager | `manager` |
| Stock Keeper | `stock_keeper` |
| Cashier | `cashier` |

Permission hierarchy: **Admin always passes every check.** Beyond that, each endpoint lists which roles it accepts (see tables below). A `403` means your role isn't on that list; a `401` means your token is missing/invalid/expired.

---

## 2. Conventions

- **IDs are integers.** Always send the numeric `id` from a prior `GET`, never a name/label, for fields like `category_id`, `unit_id`, `shop_id`, `stock_id`, `product_id`.
- **Money fields** (`selling_price`, `buying_price`, totals, etc.) are decimal strings or numbers — send as JSON numbers, the API returns them as strings (e.g. `"19.99"`).
- **Pagination**: list endpoints that support it take `?skip=0&limit=50` query params.
- **Soft delete**: `Shop` and `Product` deletes are soft (row kept, `is_deleted=true`); deleted rows are excluded from list/get results.
- **Error shape**: `{ "detail": "human-readable message" }`, with the HTTP status carrying the meaning:
  - `400` — request is logically invalid (e.g. insufficient cash for a sale)
  - `401` — not authenticated / bad or expired token
  - `403` — authenticated but not allowed to do this
  - `404` — referenced id/sku doesn't exist
  - `409` — conflicts with current state (duplicate name, insufficient stock, FK still referenced, etc.)

---

## 3. The business flow, in fetch order

This is the order a frontend typically needs to call things in, since each step depends on data created by the previous one.

1. **Admin logs in** → `POST /auth/login`
2. **Admin creates a shop** → `POST /shops`
3. **Admin creates a manager** → `POST /users` (`role: "manager"`, optional `shop_id` to assign immediately) — or assign later via `PATCH /shops/{id}/manager`
4. **Manager logs in**, creates stock keepers/cashiers → `POST /users` (`role: "stock_keeper"` or `"cashier"`)
5. **Manager creates a stock** under their shop → `POST /stocks`
6. **Admin seeds (or stock keeper reads) units/categories** → `GET /units`, `GET /categories`
7. **Stock keeper registers products** → `POST /products/register`
8. **Stock keeper records stock in** → `POST /purchase-orders`
9. **Stock keeper/cashier records stock out** → `POST /receipts`
10. **Anyone** views dashboard numbers → `GET /dashboard`

---

## 4. Endpoint reference

### Users — `/users` (admin/manager only)

| Method | Path | Who | Body / Query |
|---|---|---|---|
| POST | `/users` | admin, manager* | `{ email, password, full_name?, role, shop_id? }` |
| GET | `/users` | admin, manager | `?shop_id=` (optional filter) |
| GET | `/users/{id}` | admin, manager | — |
| PATCH | `/users/{id}` | admin, manager* | `{ email?, full_name?, role? }` |
| DELETE | `/users/{id}` | admin, manager* | soft-deactivates (`is_active=false`) |

\* A manager can only create/update/deactivate `stock_keeper`/`cashier` accounts, never other managers or admins. `shop_id` on create only applies when `role: "manager"`. You cannot deactivate your own account.

Response (`UserRead`):
```json
{ "id": 1, "username": "jdoe", "email": "j@x.com", "full_name": "Jane Doe", "role": "manager", "is_active": true, "created_at": "...", "shop_id": 3 }
```

---

### Shops — `/shops` (admin only to write, admin/manager to read)

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/shops` | admin only | `{ "shopName": "...", "address": "...", "phone": "...", "email"? }` |
| GET | `/shops` | admin, manager | — |
| GET | `/shops/{id}` | admin, manager | — |
| PATCH | `/shops/{id}` | admin only | any subset of the create fields |
| PATCH | `/shops/{id}/manager` | admin only | `{ "manager_id": 5 }` (or `null` to unassign) |
| DELETE | `/shops/{id}` | admin only | soft delete |

Note the field aliases: send `shopName` not `name` (response also returns `shopName`).

---

### Stocks — `/stocks` (admin/manager)

A "Stock" is a shop's stock/department record — distinct from product quantity.

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/stocks` | admin, manager* | `{ name, shop_id, stock_keeper_id, cashier_id? }` |
| GET | `/stocks` | admin, manager | `?shop_id=` (optional filter) |
| GET | `/stocks/{id}` | admin, manager | — |
| PATCH | `/stocks/{id}` | admin, manager* | `{ name?, stock_keeper_id?, cashier_id? }` |
| DELETE | `/stocks/{id}` | admin, manager* | blocked (409) if products still reference it |

\* A manager can only create/update/delete stocks for the shop they manage (`shop.manager_id == current_user.id`); admins bypass this. `stock_keeper_id` must be a user with role `stock_keeper`; `cashier_id` (optional) must have role `cashier`. Assigning either auto-syncs that user's `shop_id`.

---

### Units & Categories — dropdown sources for product registration

| Method | Path | Who | Body |
|---|---|---|---|
| GET | `/units` | any authenticated user | — |
| POST | `/units` | admin, manager | `{ "unitName": "pcs" }` |
| GET | `/categories` | any authenticated user | — |
| POST | `/categories` | admin only | `{ "categoryName": "Beverages" }` |

Fetch these two lists to populate the Unit and Category dropdowns before registering a product. Both are seeded with defaults already (`pcs`, `kg`, `g`, `litre`, `ml`, `box`, `pack`, `carton`, `dozen` / `Beverages`, `Groceries`, `Dairy`, `Bakery`, `Household`, `Personal Care`, `Electronics`, `Stationery`).

---

### Products — `/products` (stock keeper registers, anyone reads)

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/products/register` | stock_keeper, manager | see below |
| GET | `/products` | any authenticated user | `?search=&category_id=&stock_id=&status=&stock_status=&skip=&limit=` |
| GET | `/products/sku?sku=` | any authenticated user | — (barcode/SKU lookup) |
| GET | `/products/{id}` | any authenticated user | — |
| PATCH | `/products/{id}` | stock_keeper, manager | any subset of create fields |
| DELETE | `/products/{id}` | stock_keeper, manager | soft delete |

**`POST /products/register` body** (note the camelCase aliases — these are required by the schema):
```json
{
  "productName": "Mineral Water 500ml",
  "quantityUnit": 3,
  "sellingPrice": 500,
  "minimumQuantity": 5,
  "productPrice": 300,
  "category_id": 2,
  "initialQuantity": 0,
  "additionalProperties": { "Color": "Blue" },
  "expiry_date": "2026-12-31",
  "status": "active"
}
```
- `quantityUnit` and `category_id` are **integers** — the `id` from `GET /units` / `GET /categories`, not text labels.
- `category_id` and `quantityUnit` are both required by the backend regardless of how optional they look on a form.
- `sku` is auto-generated if omitted. `stock_id` is auto-resolved to the calling stock keeper's stock if omitted.

Response includes computed fields: `stock_status` (`in_stock`/`out_of_stock`), `profit_per_unit`, `profit_margin_percent` — no need to compute these on the frontend.

---

### Purchase Orders — `/purchase-orders` — **Stock In**

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/purchase-orders` | stock_keeper, manager | `{ purchase_type, scanned_code, product_id, quantity }` |
| GET | `/purchase-orders` | any authenticated user | `?product_id=&skip=&limit=` |
| GET | `/purchase-orders/{id}` | any authenticated user | — |
| DELETE | `/purchase-orders/{id}` | stock_keeper, manager | reverses the stock it added, then deletes |

`purchase_type` is `"package"` (purchased by box) or `"detail"` (scanned per individual unit). Either way `quantity` is the number of base units to add — no box→pcs conversion happens server-side. `unit_price` and `quantity_unit` in the response are auto-filled from the product's `buying_price`/`unit.name` — don't send them. `scanned_code` accepts any barcode format, unrestricted.

For a **detail** purchase: fire this endpoint once per physical scan with `quantity: 1`.
For a **package** purchase: fire it once with the total quantity received.

---

### Receipts — `/receipts` — **Stock Out**

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/receipts` | stock_keeper, manager | `{ client_name, client_phone, items: [{ sku or product_id, quantity }] }` |
| GET | `/receipts` | any authenticated user | `?skip=&limit=` |
| GET | `/receipts/{id}` | any authenticated user | — |

Scan the product's barcode into `items[].sku`. The backend looks it up, checks stock availability (`409` if insufficient), decrements `quantity_in_stock`, and returns everything needed to print:
```json
{
  "receipt_number": "RCT-20260629-AB12CD34",
  "client_name": "John",
  "client_phone": "+250...",
  "total_amount": "1500.00",
  "items": [
    { "product": { "name": "Mineral Water 500ml", "sku": "SKU-XXXX" }, "quantity": 3, "unit_price": "500.00", "subtotal": "1500.00" }
  ]
}
```
There's no separate "out of stock" flag to update — `stock_status` on the product is always computed live from `quantity_in_stock`.

---

### Sales — `/sales` (cashier checkout, separate from Receipts)

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/sales` | cashier, manager | `{ items: [{ product_id or sku, quantity }], discount_amount?, tax_amount?, payment_method, cash_received? }` |
| GET | `/sales` | cashier, manager | `?skip=&limit=` |
| GET | `/sales/{id}` | cashier, manager | — |
| POST | `/sales/{id}/void` | admin only | reverses stock, marks `VOIDED` |
| DELETE | `/sales/{id}` | admin only | same as void (kept for REST convention) |

`payment_method` is one of `cash`, `card`, `mobile_money`, `other`. If `cash`, `cash_received` is required and must cover the total (`400` if not) — `change_due` is computed and returned. There's no edit endpoint — to correct a completed sale, void it and ring a new one.

---

### Stock Movements — `/stock-movements` (manual stock adjustments, separate audit log)

| Method | Path | Who | Body |
|---|---|---|---|
| POST | `/stock-movements` | stock_keeper, manager | `{ sku, status, quantity }` |
| GET | `/stock-movements` | any authenticated user | `?product_id=&skip=&limit=` |
| GET | `/stock-movements/{id}` | any authenticated user | — |
| DELETE | `/stock-movements/{id}` | stock_keeper, manager | reverses the quantity change, then deletes |

`status` is `stock_in` or `stock_out`. Use this for manual corrections/adjustments outside the purchase-order/receipt flows (e.g. damage write-off, stock count correction).

---

### Dashboard — `/dashboard`

| Method | Path | Who |
|---|---|---|
| GET | `/dashboard?stock_id=` | any authenticated user |

```json
{ "total_products": 120, "low_stock_count": 4, "out_of_stock_count": 1, "today_check_ins": 8, "today_check_outs": 15, "today_checkout_total": "45000.00" }
```
`stock_id` is optional — omit for shop/system-wide numbers, pass it to scope to one stock.

---

## 5. Minimal fetch example

```js
const BASE_URL = "http://127.0.0.1:8000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail);
  const { access_token } = await res.json();
  return access_token;
}

async function authedFetch(path, token, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const { detail } = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

// usage
const token = await login("admin@example.com", "secret");
const shops = await authedFetch("/shops", token);
const units = await authedFetch("/units", token);
```
