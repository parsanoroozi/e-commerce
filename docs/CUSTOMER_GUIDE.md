# ShopVerse — Customer & User Guide

Welcome to **ShopVerse**, a modern online store for browsing products, managing your cart, checking out securely, and tracking orders.

---

## 1. Getting started

### Create an account
1. Open the site and click **Register**.
2. Enter your name, email, and password (minimum 8 characters).
3. You are logged in automatically after registration.

### Log in
- Use **Login** with your email and password.
- Demo admin account (for testing only): `admin@shop.com` / `admin12345`

### Forgot password
1. Click **Forgot password?** on the login page.
2. Enter your email and submit.
3. Check your inbox for the ShopVerse email.
4. Open the reset link and set a new password.

---

## 2. Shopping

### Browse the catalog
- Use **Shop** (home) to see all products.
- **Search** by name or description.
- Filter by **category** and sort by name, price, or newest items.

### Product details
- View images, price, stock, and reviews.
- **Add to cart** (requires login).
- **Add to wishlist** to save items for later.
- Read and write **customer reviews** (one review per product when logged in).

### Wishlist
- Open **Wishlist** from the navigation bar.
- Remove items you no longer want.

---

## 3. Cart & checkout

### Cart
- View items, change quantities, or remove products.
- See subtotal before checkout.

### Checkout steps

**Step 1 — Shipping**
- Choose a **saved address** or enter a new one (saved automatically).
- Select **shipping method**:
  - **Standard** — economy delivery
  - **Express** — faster delivery
- Optional: enter a **coupon code** (e.g. `SAVE10`, `WELCOME5`) and click **Apply**.

**Step 2 — Payment**
- **Stripe mode** (production/test keys configured): pay with card via secure Stripe form.
- **Demo mode** (no Stripe keys): use **Complete demo payment** to test the full flow locally.

After successful payment you are redirected to your **order confirmation** page and receive a **confirmation email**.

---

## 4. Orders

### My orders
- Open **Orders** from the navigation bar.
- See status, date, and total for each order.

### Order details
- View shipping address, items, and **payment breakdown** (subtotal, discount, shipping, tax, total).
- Track progress on the **order timeline**.
- **Cancel** an order when status is Pending or Confirmed (before shipping).

### Order statuses
| Status | Meaning |
|--------|---------|
| AWAITING_PAYMENT | Checkout started, payment not completed |
| PENDING / CONFIRMED | Paid and being processed |
| SHIPPED | On the way |
| DELIVERED | Completed |
| CANCELLED | Cancelled by you or admin |
| REFUNDED | Refunded |

---

## 5. Account settings

### Profile
- Update **first name** and **last name**.
- **Change password** from the profile page.

### Saved addresses
- Manage addresses under **Addresses** (also linked from checkout).
- Mark one address as **default** for faster checkout.

### Notifications
- Click the **bell icon** in the header for order updates.
- Mark notifications as read.

### Theme
- Toggle **light / dark mode** with the sun/moon icon in the navigation bar.
- Your preference is saved in the browser.

---

## 6. Coupons (demo)

| Code | Discount | Minimum order |
|------|----------|---------------|
| SAVE10 | 10% off | $50 |
| WELCOME5 | $5 off | $25 |

Enter the code at checkout before continuing to payment.

---

## 7. Admin panel (store owners)

Access **Admin** after logging in with an admin account.

| Section | Purpose |
|---------|---------|
| **Dashboard** | Sales stats, low-stock alerts, recent orders |
| **Products** | Add, edit, deactivate products; upload images |
| **Categories** | Organize the catalog |
| **Orders** | View all orders; update status (e.g. Shipped) |
| **Coupons** | Create promotional codes |

### Low stock threshold
On the **Dashboard**, set the **Low stock threshold** (default: 10 units). Products at or below this level appear in the low-stock list and count.

---

## 8. Email notifications

You may receive emails for:
- **Order confirmation** after payment
- **Order shipped** when admin marks order as shipped
- **Password reset** when you request a reset

**Local development:** use your configured SMTP provider for real delivery, or switch to a local SMTP capture service when you do not want to send real messages.

---

## 9. Security & privacy

- Passwords are encrypted; never stored in plain text.
- Checkout uses **JWT authentication** for API access.
- Card payments are processed by **Stripe**; card numbers are not stored on ShopVerse servers.
- Use HTTPS in production.

---

## 10. Support

- API documentation (developers): `http://localhost:8080/swagger-ui/index.html`
- For issues, contact your store administrator.

---

*ShopVerse — quality products, seamless checkout.*
