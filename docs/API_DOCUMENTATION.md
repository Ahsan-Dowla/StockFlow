# StockFlow REST API Documentation

Base URL: `http://localhost:8090/api`
Swagger UI Interactive Documentation: `http://localhost:8090/swagger-ui.html`
OpenAPI JSON Specification: `http://localhost:8090/api-docs`

---

## 1. Authentication & Security Overview

All secured endpoints require an `Authorization` header containing a valid JSON Web Token:
```http
Authorization: Bearer <your_jwt_token>
```

### Standard Error Response Format
All 4xx and 5xx responses conform to a unified error payload:
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Input validation failed for one or more fields",
  "path": "/api/products",
  "timestamp": "2026-11-11T10:15:30.123",
  "details": [
    "Product name is required",
    "Unit price cannot be negative"
  ]
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1. Register Employee
- **Method / Path**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Registers a new user. Always creates account with `ROLE_EMPLOYEE`.
- **Request Body**:
```json
{
  "fullName": "Alex Mercer",
  "email": "alex.mercer@stockflow.com",
  "password": "Password@123"
}
```
- **Response**: `201 Created`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 2,
    "fullName": "Alex Mercer",
    "email": "alex.mercer@stockflow.com",
    "role": "EMPLOYEE",
    "enabled": true,
    "createdAt": "2026-11-11T10:00:00",
    "updatedAt": "2026-11-11T10:00:00"
  }
}
```

### 2.2. Login
- **Method / Path**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials and issues a signed JWT token.
- **Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "your_secure_password"
}
```
- **Response**: `200 OK` (AuthResponse with token and user profile)

### 2.3. Get Current User Profile
- **Method / Path**: `GET /api/auth/me`
- **Access**: Authenticated (`ADMIN`, `MANAGER`, `EMPLOYEE`)
- **Response**: `200 OK` (UserResponse record)

### 2.4. Logout
- **Method / Path**: `POST /api/auth/logout`
- **Access**: Authenticated
- **Response**: `200 OK`

---

## 3. Categories Endpoints (`/api/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | All Authenticated | Get all categories (`?activeOnly=true`) |
| `GET` | `/api/categories/{id}` | All Authenticated | Get category by ID |
| `POST` | `/api/categories` | `ADMIN`, `MANAGER` | Create new category |
| `PUT` | `/api/categories/{id}` | `ADMIN`, `MANAGER` | Update existing category |
| `DELETE` | `/api/categories/{id}` | `ADMIN`, `MANAGER` | Deactivate category |

**Create Category Request Body**:
```json
{
  "name": "Electronics & Sensors",
  "description": "Electronic sensors and control units"
}
```

---

## 4. Suppliers Endpoints (`/api/suppliers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/suppliers` | All Authenticated | Get all suppliers (`?activeOnly=true`) |
| `GET` | `/api/suppliers/{id}` | All Authenticated | Get supplier by ID |
| `POST` | `/api/suppliers` | `ADMIN`, `MANAGER` | Create new supplier |
| `PUT` | `/api/suppliers/{id}` | `ADMIN`, `MANAGER` | Update supplier details |
| `DELETE` | `/api/suppliers/{id}` | `ADMIN`, `MANAGER` | Deactivate supplier |

**Create Supplier Request Body**:
```json
{
  "name": "Global Component Supply Ltd",
  "email": "sales@globalcomponents.com",
  "phone": "+1 555-0188",
  "address": "780 Industrial Parkway, Chicago, IL"
}
```

---

## 5. Products Endpoints (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | All Authenticated | Paginated, filtered, and sorted products |
| `GET` | `/api/products/{id}` | All Authenticated | Get product by ID |
| `GET` | `/api/products/low-stock` | All Authenticated | Low stock alerts (`currentStock <= reorderLevel`) |
| `POST` | `/api/products` | `ADMIN`, `MANAGER` | Create product & record initial stock movement |
| `PUT` | `/api/products/{id}` | `ADMIN`, `MANAGER` | Update product info (stock quantity unchanged) |
| `DELETE` | `/api/products/{id}` | `ADMIN`, `MANAGER` | Deactivate product |

**Query Parameters for `GET /api/products`**:
- `page`: zero-based page index (default: `0`)
- `size`: page size (default: `10`)
- `search`: search keyword matching product name or SKU
- `categoryId`: filter by category ID
- `supplierId`: filter by supplier ID
- `active`: boolean (`true`/`false`)
- `sort`: sort field and direction (e.g. `createdAt,desc`, `currentStock,asc`, `unitPrice,desc`)

**Create Product Request Body**:
```json
{
  "name": "Industrial Pressure Transducer",
  "sku": "SKU-PT-400",
  "description": "0-400 bar 4-20mA pressure sensor",
  "unitPrice": 85.50,
  "currentStock": 75,
  "reorderLevel": 15,
  "categoryId": 1,
  "supplierId": 1
}
```

---

## 6. Customers Endpoints (`/api/customers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | All Authenticated | Paginated customers or active list (`?allActive=true`) |
| `GET` | `/api/customers/{id}` | All Authenticated | Get customer details by ID |
| `GET` | `/api/customers/search` | All Authenticated | Search by name, email, or phone |
| `POST` | `/api/customers` | All Authenticated | Create customer account |
| `PUT` | `/api/customers/{id}` | All Authenticated | Update customer account |
| `DELETE` | `/api/customers/{id}` | All Authenticated | Deactivate customer |

---

## 7. Inventory Endpoints (`/api/inventory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/inventory/summary` | All Authenticated | Inventory KPIs and category stock distribution |
| `GET` | `/api/inventory/movements`| All Authenticated | Paginated stock movement audit ledger |
| `POST`| `/api/inventory/adjustments`| `ADMIN`, `MANAGER` | Perform manual stock in, stock out, or adjustment |

**Stock Adjustment Request Body**:
```json
{
  "productId": 1,
  "movementType": "STOCK_IN",
  "quantity": 25,
  "notes": "Received emergency replacement shipment PO-901"
}
```

---

## 8. Orders Endpoints (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/orders` | All Authenticated | Paginated orders (`?orderNumber=&status=&customerId=`) |
| `GET` | `/api/orders/{id}` | All Authenticated | View complete order details and line items |
| `POST` | `/api/orders` | All Authenticated | Create sales order with atomic stock deduction |
| `PATCH`| `/api/orders/{id}/cancel` | All Authenticated | Cancel order & atomically restore inventory |

**Create Order Request Body**:
```json
{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 5
    },
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

---

## 9. Dashboard Endpoints (`/api/dashboard`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | All Authenticated | Counts, stock totals, confirmed revenue |
| `GET` | `/api/dashboard/top-products`| All Authenticated | Top 5 selling products by quantity & revenue |
| `GET` | `/api/dashboard/revenue` | All Authenticated | Monthly confirmed revenue aggregation |
| `GET` | `/api/dashboard/category-distribution`| All Authenticated | Inventory units grouped by category |
| `GET` | `/api/dashboard/recent-orders` | All Authenticated | 5 most recent sales orders |

---

## 10. Users Endpoints (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | `ADMIN` only | List all system users |
| `GET` | `/api/users/{id}` | `ADMIN` only | Get user details by ID |
| `PATCH`| `/api/users/{id}/role` | `ADMIN` only | Change user role (`ADMIN`, `MANAGER`, `EMPLOYEE`) |
| `PATCH`| `/api/users/{id}/status`| `ADMIN` only | Enable or disable user account |
