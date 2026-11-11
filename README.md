# StockFlow — Full Stack Inventory & Order Management System

StockFlow is a production-grade, full-stack Inventory and Order Management System designed for small-to-medium businesses. It replaces error-prone spreadsheets with an auditable relational data store, real-time inventory ledger tracking, multi-item sales order workflows, role-based access control, and an executive performance dashboard.

---

## 1. Technology Stack

### Backend
- **Language**: Java 21 (Temurin OpenJDK)
- **Framework**: Spring Boot 4.1.2
- **Build Tool**: Apache Maven 3.9+
- **Database**: PostgreSQL 18 (with Flyway versioned migrations)
- **ORM**: Hibernate 6 / Spring Data JPA
- **Security**: Spring Security 7 with OAuth2 Resource Server & Nimbus JOSE + JWT
- **Password Hashing**: BCrypt
- **API Documentation**: SpringDoc OpenAPI 2.8.5 with Swagger UI
- **Testing**: JUnit 5, Mockito, AssertJ

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Language**: Modern JavaScript (ES Modules)
- **Routing**: React Router v6
- **HTTP Client**: Axios (with centralized request/response interceptors)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Modern, responsive CSS design system (Light SaaS theme)

---

## 2. System Architecture & Port Allocation

| Component | Port | Host | URL |
|---|---|---|---|
| **Spring Boot Backend** | `8090` | `localhost` | `http://localhost:8090` |
| **Swagger UI** | `8090` | `localhost` | `http://localhost:8090/swagger-ui.html` |
| **OpenAPI Docs** | `8090` | `localhost` | `http://localhost:8090/api-docs` |
| **React Frontend (Vite)** | `5173` | `localhost` | `http://localhost:5173` |
| **PostgreSQL Database** | `5432` | `localhost` | `jdbc:postgresql://localhost:5432/stockflow` |

---

## 3. Project Directory Structure

```text
d:\HCLTech-project-1\
├── .env.example                               # Environment variable template
├── .env                                       # Local configuration & secrets
├── .gitattributes                             # LF line endings for container scripts
├── compose.yaml                               # Three-tier Docker Compose specification
├── README.md                                  # Project overview and setup guide
├── docker/
│   └── postgres/
│       └── init/
│           └── 01-create-stockflow-db.sh      # Container DB initialization script
├── docs/
│   ├── ARCHITECTURE.md                        # Component architecture & security flows
│   ├── DATABASE_DESIGN.md                     # Schema, ER diagram, and constraints
│   ├── API_DOCUMENTATION.md                   # RESTful API specifications
│   ├── INTERVIEW_PREPARATION.md               # 30+ technical interview questions & answers
│   ├── IMPLEMENTATION_NOTES.md                # Concurrency, locking & trade-offs
│   └── DOCKER.md                              # Comprehensive Docker orchestration guide
├── postman/
│   └── StockFlow.postman_collection.json      # Postman API test collection
└── stockflow/
    ├── backend/                               # Spring Boot 4.1.2 application
    │   ├── Dockerfile                         # Multi-stage Maven + Temurin JRE build
    │   └── src/main/resources/
    │       └── application-docker.yml         # Container profile
    └── frontend/                              # React 18 + Vite SPA
        ├── Dockerfile                         # Multi-stage Node.js + Nginx build
        └── nginx.conf                         # Nginx reverse proxy & SPA router
    │   ├── pom.xml                            # Maven dependencies & plugins
    │   ├── src/main/java/com/stockflow/
    │   │   ├── StockFlowApplication.java      # Application entry point
    │   │   ├── config/                        # OpenAPI & CORS configuration
    │   │   ├── security/                      # SecurityConfig, JwtTokenService, AdminBootstrap
    │   │   ├── auth/                          # Authentication controller, service & DTOs
    │   │   ├── user/                          # User entity, repository, service & controller
    │   │   ├── category/                      # Category CRUD & validation
    │   │   ├── supplier/                      # Supplier management module
    │   │   ├── product/                       # Product catalog with pessimistic locking
    │   │   ├── customer/                      # Customer management module
    │   │   ├── inventory/                     # Stock adjustments & movement ledger
    │   │   ├── order/                         # Multi-item sales orders & cancellation
    │   │   ├── dashboard/                     # Real-time analytics & KPIs
    │   │   └── exception/                     # Global exception handler & custom exceptions
    │   ├── src/main/resources/
    │   │   ├── application.yml                # Main configuration (Port 8090)
    │   │   ├── application-dev.yml            # Development logging & SQL formatting
    │   │   └── db/migration/                  # Flyway SQL migrations (V1 to V8)
    │   └── src/test/java/com/stockflow/       # 17 comprehensive unit tests
    └── frontend/                              # React 18 + Vite SPA
        ├── package.json                       # Dependencies & build scripts
        ├── vite.config.js                     # Port 5173 & /api proxy to 8090
        ├── index.html                         # SPA HTML entry point
        └── src/
            ├── index.css                      # Global design system
            ├── main.jsx                       # React entry point
            ├── App.jsx                        # React Router & routes
            ├── context/                       # AuthContext & useAuth hook
            ├── components/                    # Reusable UI components
            ├── layouts/                       # AppLayout & Sidebar
            ├── pages/                         # Dashboard, Products, Orders, etc.
            └── services/                      # Axios API clients
```

---

## 4. Getting Started & Setup

### 4.1. Prerequisites
- **Java 21** installed and configured (`java -version`).
- **Apache Maven 3.9+** installed (`mvn -version`).
- **Node.js 20+** and **npm 10+** installed (`node -v`, `npm -v`).
- **PostgreSQL 15+** running locally on port `5432`.

### 4.2. Database Setup
Create the `stockflow` database and application user in PostgreSQL:

```sql
CREATE DATABASE stockflow;
CREATE USER stockflow_app WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE stockflow TO stockflow_app;
-- In PostgreSQL 15+, grant schema permissions:
\c stockflow
GRANT ALL ON SCHEMA public TO stockflow_app;
```

### 4.3. Run Backend (Spring Boot)
1. Navigate to the backend directory:
   ```powershell
   cd d:\HCLTech-project-1\stockflow\backend
   ```
2. Set your database password environment variable:
   ```powershell
   $env:DB_PASSWORD="your_secure_password_here"
   ```
3. Run the application:
   ```powershell
   mvn spring-boot:run
   ```
   *The backend will start at `http://localhost:8090`.*
   *Flyway will automatically execute migrations V1 through V8 on first boot.*
   *The initial Administrator account (`admin@stockflow.com`) will be bootstrapped automatically.*

### 4.4. Run Frontend (React + Vite)
1. In a separate terminal, navigate to the frontend directory:
   ```powershell
   cd d:\HCLTech-project-1\stockflow\frontend
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The frontend will start at `http://localhost:5173`.*

---

## 5. Default Credentials & Initial Login

On initial application startup, `AdminBootstrap` provisions the default administrator account if no administrator is present in the database:

- **Email**: `admin@stockflow.com`
- **Password**: `<ADMIN_PASSWORD>`
- **Role**: `ADMIN`

Additional employee accounts can be registered through the public `/register` page (which always assigns `EMPLOYEE` privileges).

---

## 6. Verification & Automated Testing

### 6.1. Backend Unit Tests
Execute the 17 backend unit tests covering CRUD operations, duplicate SKU rejection, insufficient inventory prevention, atomic order checkout, and order cancellation rollback:
```powershell
cd d:\HCLTech-project-1\stockflow\backend
mvn test
```
*Expected Result: `Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, BUILD SUCCESS`*

### 6.2. Frontend Production Build
Verify that all React components, services, and CSS bundle with zero compiler errors:
```powershell
cd d:\HCLTech-project-1\stockflow\frontend
npm run build
```
*Expected Result: `✓ built in ~8s` into `dist/`.*

---

## 7. Interactive API Documentation
With the backend running, open your browser to inspect and execute API requests interactively via Swagger UI:
- **Swagger UI**: [http://localhost:8090/swagger-ui.html](http://localhost:8090/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8090/api-docs](http://localhost:8090/api-docs)

To test secured endpoints in Swagger UI:
1. Call `POST /api/auth/login` with the admin credentials.
2. Copy the returned `token`.
3. Click the **Authorize** button at the top right of the Swagger UI.
4. Enter the token and click **Authorize**.

---

## 8. Postman Collection
Import the collection located at:
`d:\HCLTech-project-1\postman\StockFlow.postman_collection.json`

---

## 9. Docker Deployment (Three-Tier Container Stack)

StockFlow can be run as a containerized stack using Docker Compose:

```powershell
# 1. Prepare environment variables
Copy-Item .env.example .env

# 2. Start the entire container stack
docker compose up -d

# 3. Inspect container status & health
docker compose ps

# 4. View real-time logs
docker compose logs -f

# 5. Stop the stack (preserving database data)
docker compose down
```

For full architecture details, persistence guarantees, and troubleshooting, see the [Docker Guide](file:///d:/HCLTech-project-1/docs/DOCKER.md).
