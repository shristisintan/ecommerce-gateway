# NOVA Ecommerce Backend

NOVA Backend is a multi-tenant ecommerce REST API built with Express, TypeScript, MongoDB, and Mongoose.

It provides authentication, role-based access control, product management, carts, orders, tenant isolation, and secure eSewa payment processing.

---

## Main Features

### Authentication

- Buyer registration
- Merchant registration
- Admin seed account
- Login
- JWT access tokens
- Refresh tokens
- Refresh-token rotation
- Refresh-token reuse detection
- Logout
- bcrypt password hashing

### Role-Based Access Control

Supported roles:

```text
ADMIN
MERCHANT
BUYER