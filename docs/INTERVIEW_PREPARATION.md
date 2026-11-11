# StockFlow Technical Interview Preparation Guide

This document contains 30+ comprehensive, project-specific questions and answers covering the architecture, design choices, concurrency controls, security implementation, and frontend decisions of the StockFlow system.

---

## Section 1: Architecture & System Design

### Q1: What architectural pattern does StockFlow follow and why was it chosen over microservices?
**Answer:** StockFlow is built as a **Layered Monolith** following the Controller-Service-Repository pattern. It was chosen over microservices because the domain boundaries (products, inventory movements, sales orders) are tightly coupled by transactional consistency requirements. In an inventory management system, order creation and stock deduction must execute with strict ACID guarantees. A monolithic architecture allows database-level transactions with pessimistic row locking and zero distributed transaction overhead (such as the Saga pattern or 2-Phase Commit). It also simplifies deployment, eliminates network latency between internal services, and provides a clean separation of concerns without operational complexity.

### Q2: How does the application maintain separation of concerns between layers?
**Answer:**
1. **Controller Layer**: Strictly handles HTTP request deserialization, path/query parameter binding, Jakarta Bean Validation (`@Valid`), and HTTP status mapping. It contains zero business logic.
2. **Service Layer**: Owns domain rules, transactional boundaries (`@Transactional`), security authorization, and orchestration across multiple repositories.
3. **Repository Layer**: Extends Spring Data JPA interfaces (`JpaRepository`, `JpaSpecificationExecutor`) to encapsulate database queries, native SQL, and row-level locking.
4. **Data Transfer Objects (DTOs)**: Java `record`s are used for all API inputs and outputs. JPA entities are never exposed in REST controllers to prevent accidental exposure of password hashes, avoid circular serialization loops, and decouple the public API contract from internal database schema evolution.

### Q3: How is global exception handling implemented, and why is it preferred over try-catch blocks in controllers?
**Answer:** Centralized exception handling is achieved via `@RestControllerAdvice` in `GlobalExceptionHandler`. Instead of polluting controllers with boilerplate `try-catch` blocks, exceptions bubble up to the advice handler. Specific domain exceptions (`ResourceNotFoundException`, `InsufficientStockException`, `DuplicateResourceException`, `BusinessException`) and framework exceptions (`MethodArgumentNotValidException`, `AccessDeniedException`) are caught by dedicated `@ExceptionHandler` methods that map them to a standardized `ErrorResponse` record with appropriate HTTP status codes (404, 400, 409, 403, 401). This guarantees uniform API error formats across the entire application.

### Q4: Why are DTOs implemented as Java Records instead of standard POJOs or Lombok classes?
**Answer:** Java Records (introduced in Java 14, finalized in Java 16) provide transparent, immutable data carriers. Because DTOs represent immutable request and response contracts, Records automatically generate getters, `equals()`, `hashCode()`, and `toString()` at compile time without relying on third-party annotation processors like Lombok. They enforce immutability, thread-safety, and concise syntax while maintaining full compatibility with Jakarta Bean Validation and Jackson serialization.

### Q5: How does the system handle soft deletes and why are they necessary in an ERP/inventory system?
**Answer:** Soft deletes are implemented using an `active` boolean column on products, categories, suppliers, and customers. In enterprise resource planning, hard-deleting a product or customer would cause foreign key constraint violations or corrupt historical order records, financial balance sheets, and audit movement logs. By setting `active = false`, the entity is excluded from future sales orders and catalog pickers while preserving complete referential integrity and historical reporting accuracy.

---

## Section 2: Spring Boot & Framework Internals

### Q6: How does Spring Boot auto-configuration work under the hood?
**Answer:** Spring Boot utilizes `@EnableAutoConfiguration` (included inside `@SpringBootApplication`). On startup, Spring factories loader scans `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. Each candidate configuration class uses conditional annotations like `@ConditionalOnClass`, `@ConditionalOnMissingBean`, and `@ConditionalOnProperty` to evaluate whether required libraries (such as HikariCP, Hibernate, or Tomcat) are present on the classpath. If matched, it registers sensible default beans unless the developer explicitly provides custom bean definitions.

### Q7: What is the purpose of `@Transactional` and how does Spring implement it?
**Answer:** `@Transactional` defines declarative database transaction boundaries. Spring implements this using Spring AOP (Aspect-Oriented Programming). When a `@Transactional` bean is injected, Spring wraps it in a dynamic CGLIB or JDK proxy. When a transactional method is invoked:
1. The `TransactionInterceptor` begins a transaction on the configured `PlatformTransactionManager`.
2. The target business method executes.
3. If the method completes normally, the transaction is committed.
4. If an unchecked exception (`RuntimeException` or `Error`) is thrown, the transaction is automatically rolled back. Checked exceptions do not trigger a rollback unless explicitly configured via `@Transactional(rollbackFor = Exception.class)`.

### Q8: What is the difference between `readOnly = true` and default `@Transactional`?
**Answer:** When `@Transactional(readOnly = true)` is specified on query methods (such as `getAllProducts()` or `getOrderById()`):
1. **Hibernate Optimization**: Hibernate sets the FlushMode to `MANUAL`, disabling dirty-checking on retrieved entities. This saves memory and CPU cycles because Hibernate does not need to store snapshot copies of loaded entities.
2. **JDBC Driver Optimization**: Some database drivers (including PostgreSQL) route read-only transactions to read replicas or optimize transaction lock acquisition.

### Q9: Why is `spring.jpa.open-in-view` set to `false` in StockFlow?
**Answer:** `open-in-view` (OSIV) keeps the database connection and Hibernate Session open throughout the entire HTTP request lifecycle, including during view rendering and JSON serialization. While this hides `LazyInitializationException`, it creates severe connection pool starvation under load because database connections remain open while the server writes bytes over slow network sockets. Setting `open-in-view: false` forces all database interactions to complete within the Service layer, releasing connections back to HikariCP immediately.

### Q10: How does Spring Boot manage HikariCP connection pooling?
**Answer:** HikariCP is Spring Boot's default high-performance JDBC connection pool. StockFlow configures HikariCP in `application.yml`:
- `maximum-pool-size: 10`: Limits concurrent open connections to match database capacity.
- `minimum-idle: 2`: Retains warm connections ready for traffic spikes.
- `idle-timeout: 30000`: Closes idle connections after 30 seconds.
- `connection-timeout: 20000`: Rejects requests waiting longer than 20 seconds for a connection with an exception.

---

## Section 3: Spring Security 7 & JWT Authentication

### Q11: Explain the JWT authentication flow implemented in StockFlow using Spring Security 7 and OAuth2 Resource Server.
**Answer:**
1. **Authentication**: The user posts credentials to `/api/auth/login`. `AuthService` validates the credentials against `UserRepository` using `BCryptPasswordEncoder`.
2. **Token Generation**: `JwtTokenService` generates an HMAC-SHA256 signed JWT using Nimbus JOSE with claims: `sub` (email), `userId`, `fullName`, and `role`.
3. **Authorization**: Incoming requests supply `Authorization: Bearer <token>`.
4. **Validation**: Spring Security's `oauth2ResourceServer().jwt()` intercepts the request. The configured `NimbusJwtDecoder` validates the cryptographic signature against the secret key and verifies token expiration.
5. **Authority Mapping**: A custom `JwtAuthenticationConverter` maps the `role` claim to a `SimpleGrantedAuthority` prefixed with `ROLE_` (e.g. `ROLE_ADMIN`), populating the `SecurityContextHolder`.

### Q12: Why is Nimbus JOSE + JWT via Spring Security OAuth2 Resource Server preferred over the JJWT library?
**Answer:** Spring Security provides first-class, standard support for OAuth2 Resource Server and Nimbus JWT. By using `spring-boot-starter-oauth2-resource-server`:
- There is no need to write, test, and maintain custom `OncePerRequestFilter` classes to parse bearer tokens or catch expired token exceptions manually.
- Spring Security automatically handles token extraction from HTTP headers, expired token rejection, signature verification, and standard 401/403 HTTP status emission.
- Nimbus JOSE is a comprehensive, actively maintained Java library implementing standard RFC 7519 JSON Web Tokens.

### Q13: How does StockFlow prevent role escalation during user registration?
**Answer:** In `AuthService.register()`, the public registration method does not accept a role in `RegisterRequest`. Regardless of what parameters an external client sends, `AuthService` explicitly hardcodes `user.setRole(Role.EMPLOYEE)`. Role modifications to `MANAGER` or `ADMIN` can only be performed by an existing Administrator through the secured endpoint `PATCH /api/users/{id}/role` protected by `@PreAuthorize("hasRole('ADMIN')")`.

### Q14: How are passwords hashed and why is BCrypt resistant to brute-force attacks?
**Answer:** Passwords are encrypted using `BCryptPasswordEncoder`. BCrypt uses the Blowfish cipher with a configurable work factor (log rounds). Its core security strengths include:
1. **Embedded Salt**: A random 128-bit salt is generated for each password and stored directly in the resulting hash string, preventing rainbow table attacks.
2. **Adaptive Cost Factor**: As hardware speed increases, the iteration count can be incremented without breaking existing password hashes, forcing attackers to spend exponentially more CPU/GPU time per guess.

### Q15: How does the application prevent the last active administrator from being disabled or demoted?
**Answer:** In `UserService`, before updating a user's role or active status, the service checks if the targeted user is an `ADMIN`. If the update would demote or disable them, the service queries the database for the total count of active administrators. If `activeAdminCount <= 1`, the operation is aborted with a `BusinessException("At least one active Administrator must exist")`, preventing system lockout.

---

## Section 4: JPA, Hibernate & Concurrency Control

### Q16: How does StockFlow solve the race condition of concurrent orders purchasing the same remaining stock?
**Answer:** StockFlow uses **Pessimistic Row-Level Write Locking** (`LockModeType.PESSIMISTIC_WRITE`).
In `OrderService.createOrder()`:
1. The requested product IDs are sorted in ascending order.
2. Spring Data JPA executes `SELECT p FROM Product p WHERE p.id IN :ids ORDER BY p.id ASC` with `LockModeType.PESSIMISTIC_WRITE`.
3. In PostgreSQL, this generates `SELECT ... FOR UPDATE`.
4. The database places exclusive row locks on those product records. Concurrent transactions attempting to inspect or modify those rows must wait until the current transaction commits or rolls back.
5. The service validates `currentStock >= requestedQuantity`. If valid, stock is decremented and committed atomically. If insufficient, a rollback occurs and the lock is released.

### Q17: Why is deterministic lock ordering (`ORDER BY p.id ASC`) critical in multi-product orders?
**Answer:** When two concurrent transactions acquire locks on multiple resources in different orders, a **deadlock** occurs.
- Scenario: Transaction 1 locks Product 1, then attempts to lock Product 2. Concurrently, Transaction 2 locks Product 2, then attempts to lock Product 1. Both transactions block each other indefinitely, forcing the database engine to abort one transaction with a deadlock detection error.
- **Solution**: By sorting all requested product IDs in ascending numerical order (`1, 2, ...`) before acquiring locks, all transactions acquire locks in the exact same sequence, mathematically eliminating cyclic wait conditions and deadlock risks.

### Q18: What is the N+1 select problem and how is it prevented in StockFlow?
**Answer:** The N+1 select problem occurs when querying parent entities (e.g. Sales Orders) where child relationships (e.g. Customer, Order Items) are lazily loaded. Fetching N orders results in 1 query for the orders followed by N additional queries to load each order's customer.
StockFlow mitigates this by:
1. Using DTO projections and join queries for dashboard aggregations.
2. Setting all entity relationships to `fetch = FetchType.LAZY` by default to avoid accidental eager outer joins on large tables.
3. Fetching targeted entity graphs or batch loading when parent-child relationships are traversed.

### Q19: Why does `ProductUpdateRequest` deliberately exclude the `currentStock` field?
**Answer:** In an inventory management system, directly updating stock quantities through a general product catalog editing screen bypasses the audit trail and causes silent stock overwrites. If an administrator edits a product's price while a sales order is deducting stock, a naive entity update with an outdated stock value would overwrite the new stock balance. StockFlow enforces that all stock balance mutations must occur through either `OrderService` (order checkout/cancellation) or `InventoryService` (stock-in/out/adjustment with mandatory reason notes).

### Q20: How are price snapshots captured and why are they necessary?
**Answer:** In `OrderItem`, the entity has a `unitPrice` column separate from `Product.unitPrice`. When an order is created, the service copies `product.getUnitPrice()` into `orderItem.setUnitPrice()`. If product prices change in the catalog next month, historical sales orders, customer receipts, and financial revenue reports remain permanently accurate and untampered.

---

## Section 5: Database Design & Flyway Migrations

### Q21: Why use `BigDecimal` and `NUMERIC(12, 2)` instead of `Double` or `Float` for currency?
**Answer:** IEEE-754 floating-point numbers (`float`, `double`) represent numbers in binary scientific notation, which cannot represent base-10 fractions like `0.1` or `0.01` precisely. Arithmetic operations on doubles cause rounding artifacts (e.g. `0.1 + 0.2 = 0.30000000000000004`), which accumulate in financial ledgers and cause balancing discrepancies. Java's `BigDecimal` and PostgreSQL's `NUMERIC(12, 2)` use arbitrary-precision decimal representation, guaranteeing exact arithmetic.

### Q22: Why use Flyway instead of Hibernate's `ddl-auto: update` in production?
**Answer:**
1. **Determinism**: Hibernate's `ddl-auto: update` attempts to infer schema changes automatically, but it cannot rename columns, safely migrate data, split tables, or manage complex check constraints without data loss risks.
2. **Version Control**: Flyway applies explicitly reviewed, numbered SQL scripts (`V1`, `V2`, etc.) tracked in a `flyway_schema_history` metadata table. Every environment (local, testing, staging, production) executes the exact same migration sequence in order.
3. **Zero Runtime Schema Surprises**: Hibernate is configured with `ddl-auto: validate` in production, which verifies that the JPA entity mappings match the Flyway-migrated schema on startup without modifying any tables.

### Q23: Explain the dual-entity model: `Product.currentStock` vs `StockMovement`.
**Answer:**
- `Product.currentStock` serves as the **Current Balance** (state snapshot). It enables high-speed `O(1)` availability queries, instant low-stock checks, and efficient indexed filtering.
- `StockMovement` serves as the **Immutable Transaction Ledger** (event log). It records every change (`quantityChange`, `movementType`, `referenceType`, `performedBy`, `timestamp`, `notes`).
- This design combines the query speed of a snapshot model with the complete auditability of an event-sourced ledger. Both tables are updated atomically within the same database transaction.

### Q24: What database indexes were added and how do they benefit query performance?
**Answer:**
- `products(sku)`: Unique B-tree index for instantaneous SKU lookups.
- `products(category_id)` & `products(supplier_id)`: Foreign key indexes preventing full table scans when filtering catalog views or joining categories/suppliers.
- `sales_orders(order_number)`: Unique index for order tracking lookups.
- `sales_orders(status)` & `sales_orders(created_at)`: Optimizes dashboard queries aggregating confirmed revenue and monthly revenue trends.
- `stock_movements(product_id)` & `stock_movements(created_at)`: Ensures fast pagination of movement history for individual items.

---

## Section 6: React Frontend & State Management

### Q25: Why is Vite chosen over Create React App (CRA)?
**Answer:** Create React App is officially deprecated and relies on Webpack, which bundles the entire application before starting the development server, resulting in slow startup and sluggish Hot Module Replacement (HMR) in medium-to-large projects. Vite uses native browser ES modules (ESM) and pre-bundles dependencies with `esbuild` (written in Go), providing near-instant development server startup and sub-second HMR regardless of project size. Its production builds use Rollup for highly optimized, tree-shaken chunks.

### Q26: How does the centralized Axios instance handle authentication and session expiration?
**Answer:** In `src/services/api.js`:
1. **Request Interceptor**: Intercepts every outgoing HTTP request, reads the token from `sessionStorage.getItem('stockflow_token')`, and injects `Authorization: Bearer <token>`.
2. **Response Interceptor**: Listens for responses. If the backend returns `401 Unauthorized` (e.g. token expired or invalid), the interceptor removes the token and user profile from `sessionStorage` and automatically redirects the browser to `/login`.

### Q27: What is the trade-off of storing JWTs in `sessionStorage` vs `localStorage` vs HttpOnly cookies?
**Answer:**
- `sessionStorage`: Isolated to the current browser tab and purged immediately when the tab closes. It prevents token persistence across untrusted shared machines, but is accessible via JavaScript (vulnerable to XSS).
- `localStorage`: Persists indefinitely across tabs and restarts, making it vulnerable to XSS and token lingering.
- `HttpOnly Cookies`: Inaccessible to JavaScript, providing strong protection against XSS. However, it requires CSRF defense mechanisms (SameSite cookies, CSRF tokens) and CORS configuration with credentials across different domains/ports.
- **Decision**: For this single-page dashboard architecture, `sessionStorage` provides a balanced, understandable model with automatic session expiration upon tab closure.

### Q28: How does `PrivateRoute` protect client-side routes in React Router?
**Answer:** `PrivateRoute` is a higher-order wrapper component around protected routes. It reads `user`, `loading`, and `isAuthenticated` from `AuthContext`.
1. While `loading` is true (validating session on app load), it renders a loading spinner.
2. If `isAuthenticated` is false, it uses `<Navigate to="/login" state={{ from: location }} replace />` to redirect the user to login while preserving the attempted URL.
3. If a specific role is required (e.g. `ADMIN` for `/users`), it checks `user.role === requiredRole`. If unauthorized, it renders an "Access Denied" view rather than executing the route.

### Q29: How does the order creation page validate stock before submission while ensuring server authority?
**Answer:** On the frontend, `CreateOrder.jsx` performs optimistic client-side validation:
- It tracks `currentStock` for each selected product line and displays live warning badges if the entered quantity exceeds available units.
- It dynamically calculates estimated line subtotals and grand totals to provide immediate user feedback.
- However, **the backend never trusts frontend calculations**. The submitted payload contains only product IDs and quantities. The Spring Boot backend re-fetches current stock with pessimistic locks, verifies balances, and recalculates all monetary subtotals on the server.

### Q30: How are charts implemented in the dashboard and how do they receive data?
**Answer:** Charts are implemented using `recharts` (`ResponsiveContainer`, `BarChart`, `PieChart`). When `Dashboard.jsx` mounts, it invokes `dashboardService.getRevenue()` and `dashboardService.getCategoryDistribution()`. The backend executes aggregation queries using JPQL and PostgreSQL `TO_CHAR(createdAt, 'YYYY-MM')` group-by queries, returning real mathematical summaries that the frontend transforms directly into chart series.
