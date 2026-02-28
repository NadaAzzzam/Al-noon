# Products API – cURL Examples

Base URL: `http://localhost:4000/api`

**Product detail and related use ObjectId only.** Frontend route stays with slug (`/product/ribbed-kaftan`) for SEO; FE resolves slug→id via `GET /api/products?slug=...` before calling detail.

---

## 1. List products

```bash
curl "http://localhost:4000/api/products"
```

With filters (page, limit, category, search, sort, slug, etc.):

```bash
curl "http://localhost:4000/api/products?page=1&limit=12&search=kaftan&sort=BEST_SELLING"
```

Lookup by slug (to resolve slug→id):

```bash
curl "http://localhost:4000/api/products?slug=ribbed-kaftan&limit=1"
```

---

## 2. Product detail (by id – required)

```bash
curl "http://localhost:4000/api/products/69a24d6070d0a9472b5dc2d7"
```

With color-specific images:

```bash
curl "http://localhost:4000/api/products/69a24d6070d0a9472b5dc2d7?color=black"
```

---

## 3. Related products

```bash
curl "http://localhost:4000/api/products/69a24d6070d0a9472b5dc2d7/related"
```

---

## Query params (list products)

| Param        | Example   | Description                    |
|-------------|-----------|--------------------------------|
| `page`      | `1`       | Page number                    |
| `limit`     | `12`      | Items per page                 |
| `category`  | `id`      | Category ID                    |
| `search`    | `abaya`   | Search term                    |
| `status`    | `ACTIVE`  | ACTIVE / INACTIVE              |
| `sort`      | `BEST_SELLING` | Sort key                  |
| `newArrival`| `true`    | New arrivals only              |
| `availability` | `in_stock` | Stock filter                |
| `minPrice`  | `100`     | Min price                      |
| `maxPrice`  | `500`     | Max price                      |
