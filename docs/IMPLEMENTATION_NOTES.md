# StockFlow Implementation Notes & Engineering Decisions

## 1. Network & Port Configurations

| Component | Port | Host | Protocol | URL / Connection |
|---|---|---|---|---|
| **Spring Boot Backend** | `8090` | `localhost` | HTTP | `http://localhost:8090` |
| **Swagger UI** | `8090` | `localhost` | HTTP | `http://localhost:8090/swagger-ui.html` |
| **OpenAPI Docs** | `8090` | `localhost` | HTTP | `http://localhost:8090/api-docs` |
| **React Frontend (Vite)** | `5173` | `localhost` | HTTP | `http://localhost:5173` |
| **PostgreSQL Database** | `5432` | `localhost` | TCP/JDBC | `jdbc:postgresql://localhost:5432/stockflow` |

---

## 2. Environment Variables & Security Isolation

In accordance with strict production-grade security standards, zero credentials, database passwords, or JWT secrets are hardcoded in source control.

Configuration is driven through environment variables with sensible local defaults:
- `DB_URL`: Defaults to `jdbc:postgresql://localhost:5432/stockflow`
- `DB_USERNAME`: Defaults to `stockflow_app`
- `DB_PASSWORD`: Read exclusively from `${DB_PASSWORD}`
- `SERVER_PORT`: Configured to `8090`
- `JWT_SECRET`: 256-bit HMAC key
- `JWT_EXPIRATION_MS`: 24-hour token lifetime (`86400000` ms)
- `ADMIN_EMAIL`: Configured via environment variable (`ADMIN_EMAIL`)
- `ADMIN_PASSWORD`: Configured via environment variable (`ADMIN_PASSWORD`), never hardcoded
- `ADMIN_NAME`: Initial display name (defaults to `System Administrator`)
- `CORS_ALLOWED_ORIGINS`: Allowed browser origin (`http://localhost:5173`)

---

## 3. Concurrency & Deadlock Prevention Details

### The Problem
During peak operations, multiple warehouse clerks and sales employees create orders simultaneously. If Order A orders Product 1 and Product 2, while Order B orders Product 2 and Product 1:
- Order A acquires lock on Product 1.
- Order B acquires lock on Product 2.
- Order A requests lock on Product 2 (blocked by Order B).
- Order B requests lock on Product 1 (blocked by Order A).
- **Result**: PostgreSQL detects a deadlock and kills one of the transactions.

### The Solution in `OrderService.java`
```java
// 1. Group repeated product lines in the submitted order
Map<Long, Integer> productQuantities = request.items().stream()
        .collect(Collectors.groupingBy(
                OrderItemRequest::productId,
                Collectors.summingInt(OrderItemRequest::quantity)
        ));

// 2. Sort product IDs in ascending numerical order
List<Long> sortedProductIds = productQuantities.keySet().stream().sorted().toList();

// 3. Acquire pessimistic write locks in strict ascending sequence
List<Product> lockedProducts = productRepository.findAllByIdInWithLock(sortedProductIds);
```
Because all concurrent transactions lock rows in the exact same order (`1 -> 2 -> 3`), cyclic wait states cannot form, eliminating database deadlocks.

---

## 4. Frontend-Backend Communication & Proxying

During local development, Vite proxies all `/api` requests directly to `http://localhost:8090`:
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```
This configuration delivers two major benefits:
1. Eliminates browser CORS preflight (`OPTIONS`) request overhead during development.
2. Allows React services to use clean, relative URLs (`/api/products`, `/api/orders`), making the build artifact portable to any production domain or reverse proxy without code modifications.

---

## 5. Potential Future Extensions (Out of Scope for Initial Release)
- **Multi-Warehouse Support**: Expanding `products` and `inventory` to track stock across distinct physical warehouse locations.
- **Batch / Barcode Scanning**: Adding barcode and QR code lookup endpoints to accelerate physical receiving and pick-and-pack workflows.
- **Export to CSV/Excel**: Adding server-side streaming endpoints for downloading financial tax receipts and inventory audits.
