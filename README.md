# ShopVerse E-Commerce

Full-stack e-commerce application with Spring Boot backend and React (Vite) frontend.

## Stack

- **Backend:** Spring Boot 4, Spring Security (JWT), JPA, PostgreSQL, Stripe, JavaMail
- **Frontend:** React 19, React Router, Vite, Stripe Elements

## Features

- User registration & login (JWT)
- Product catalog with search & category filters
- Shopping cart
- **Stripe checkout** (Payment Element)
- **Order confirmation emails**
- **Product image upload** (local storage, served at `/uploads/`)
- Admin panel: products, categories, order management

## Prerequisites

- Java 17+
- Node.js 18+
- Docker (PostgreSQL; optional local SMTP capture service)
- [Stripe test account](https://dashboard.stripe.com/register)

## Quick start

### 1. Infrastructure

```bash
docker compose up -d
```

Starts **PostgreSQL** (`5432`). The compose file also includes an optional local SMTP capture service for development.

### 2. Configure Stripe & mail

Copy `.env.example` and set your Stripe test keys, or export env vars before starting the backend:

```bash
# PowerShell
$env:STRIPE_SECRET_KEY="sk_test_..."
$env:STRIPE_PUBLISHABLE_KEY="pk_test_..."
$env:MAIL_ENABLED="true"
```

### 3. Run backend

```bash
.\mvnw.cmd spring-boot:run
```

API: `http://localhost:8080`

**Seeded admin:** `admin@shop.com` / `admin12345`

### 4. Run frontend

```bash
cd frontend/e-commerce-frontend
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api` and `/uploads` to the backend.

## Documentation

- **Customer / user guide:** [docs/CUSTOMER_GUIDE.md](docs/CUSTOMER_GUIDE.md)
- **Project valuation & cost estimate:** [docs/VALUATION.md](docs/VALUATION.md)
- **API (Swagger):** http://localhost:8080/swagger-ui/index.html

## Email

| Card                  | Result   |
| --------------------- | -------- |
| `4242 4242 4242 4242` | Success  |
| `4000 0000 0000 0002` | Declined |

Use any future expiry, any CVC, any ZIP.

## Checkout flow

1. Customer fills **shipping address** → `POST /api/orders/checkout/initiate`
2. Backend creates order (`AWAITING_PAYMENT`) + Stripe PaymentIntent
3. Customer pays via **Stripe Payment Element**
4. Frontend calls `POST /api/orders/{id}/confirm-payment`
5. Stock deducted, cart cleared, order `CONFIRMED`, **email sent**

Optional: configure Stripe webhook → `POST /api/webhooks/stripe` for `payment_intent.succeeded`.

```bash
stripe listen --forward-to localhost:8080/api/webhooks/stripe
```

Set `STRIPE_WEBHOOK_SECRET` from the CLI output.

## Image uploads

- Admin → Products → choose image file (max 5 MB, JPEG/PNG/WebP/GIF)
- Files stored in `uploads/` (gitignored), URL e.g. `/uploads/uuid.jpg`
- Or paste an external image URL

## Email

With `MAIL_ENABLED=true`, configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, SMTP auth, and TLS for your mail provider.

With `MAIL_ENABLED=false` (default), email content is logged to the backend console.

## API overview

| Method | Endpoint                           | Auth             |
| ------ | ---------------------------------- | ---------------- |
| POST   | `/api/orders/checkout/initiate`    | User             |
| POST   | `/api/orders/{id}/confirm-payment` | User             |
| POST   | `/api/webhooks/stripe`             | Stripe signature |
| POST   | `/api/admin/images`                | Admin            |
| GET    | `/uploads/**`                      | Public           |

## Configuration

See `application.properties` and `.env.example` for:

- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`
- `app.storage.upload-dir`
