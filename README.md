# SmartKitchen Hub - Enterprise B2B Management Platform

**SmartKitchen Hub** is a production-ready, full-stack B2B kitchen equipment management application designed for commercial dealers and kitchen service providers. It empowers administrators, sales managers, service technicians, and B2B customers to seamlessly coordinate equipment catalogs, pricing proposals, shipment purchase orders, warehouse auditing, and AMC service tickets.

---

## 🏗️ Architectural Overview

The application follows an **enterprise-grade decoupled architecture** enforcing strict Separation of Concerns (SoC) and clean-code principles:

```
                  ┌──────────────────────────────┐
                  │      ReactJS (Vite Client)   │
                  │   Redux Toolkit + Tailwind   │
                  └──────────────┬───────────────┘
                                 │ HTTP / JSON
                                 ▼
                  ┌──────────────────────────────┐
                  │    Flask App Factory (WSGI)  │
                  └──────────────┬───────────────┘
                                 │ Register
                                 ▼
                  ┌──────────────────────────────┐
                  │    REST API Blueprints       │
                  └──────────────┬───────────────┘
                                 │ Delegate
                                 ▼
                  ┌──────────────────────────────┐
                  │    Controller Services       │
                  └──────────────┬───────────────┘
                                 │ Orchestrate
                                 ▼
                  ┌──────────────────────────────┐
                  │      Service Business Layer  │
                  └──────────────┬───────────────┘
                                 │ Query
                                 ▼
                  ┌──────────────────────────────┐
                  │     Repository CRUD Layer    │
                  └──────────────┬───────────────┘
                                 │ ORM / Transaction
                                 ▼
                  ┌──────────────────────────────┐
                  │       PostgreSQL Database    │
                  └──────────────────────────────┘
```

### 1. Python Flask Backend
- **Service-Repository Pattern**: Decouples business rules (`services/`) from raw database SQL queries (`repositories/`) for clean unit-testing.
- **DTO validation**: Strict inputs validation on request bodies using Marshmallow Schemas.
- **Role-Based JWT Authorization**: Secures endpoints with claim decorators mapping roles (`Admin`, `Sales Manager`, `Technician`, `Customer`).
- **Programmatic PDF Invoices**: Generates customized commercial quotation proposals using Python's `reportlab` canvas platypus.
- **Centralized Errors Middleware**: Captures operational and constraint exceptions globally, returning structured JSON error bodies.

### 2. React Vite Frontend
- **Mobile-First Tailwind Layouts**: High-contrast, premium dark/light interfaces styled with harmonious border indices and custom scrollbars.
- **Automatic Token Interceptor**: Axios interceptor that automatically appends JWT Bearer headers and handles silent token refreshes on expiry.
- **Redux Slices State Management**: Centralized store representing active authorizations, notification toasts queue, and dashboard caching.
- **Granular Role Pruning**: Gates menus, pages, and interactive action buttons dynamically depending on logged-in credentials.
- **Contextual AI Chatbot Drawer**: Floating AI assistant widget capable of giving recommendations on kitchen ranges, refrigeration parameters, and AMC schedules.

---

## 🔐 Sandbox Demo Accounts

For instant evaluation, the platform includes a customized Database Seeder containing complete analytics metrics, historical sales orders, and active repair tickets. Use these presets:

| Role Name | Demo Username / Email | Password Credential | Operational Clearance |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartkitchen.com` | `Admin@123` | Unrestricted command dashboard |
| **Sales Manager** | `sales@smartkitchen.com` | `Sales@123` | Draft proposals, view customers, log checkouts |
| **Technician** | `tech@smartkitchen.com` | `Tech@123` | Assigned maintenance calendars and closures |
| **Customer** | `customer@smartkitchen.com` | `Customer@123` | Browse catalog, view own proposals, log repair calls |

---

## 🚀 Deployment Instructions

### Method A: Production Docker Containerization (Recommended)
This method spins up three isolated services: PostgreSQL (`smartkitchen_db`), the Python Flask Gunicorn engine (`smartkitchen_backend`), and Nginx serving compiled React assets on standard web port 80 (`smartkitchen_frontend`).

1. Ensure **Docker Desktop** is running.
2. In the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Once containers stabilize, access the platform on:
   - **Web Interface**: `http://localhost`
   - **Direct Backend API Port**: `http://localhost:5000`
4. Access the backend container shell to seed sandbox records:
   ```bash
   docker exec -it smartkitchen_backend flask seed
   ```

---

### Method B: Fast Local Development Setup

#### 1. Backend Setup (using UV)
Ensure the package resolver `uv` is installed on your host system:

```bash
cd backend
# 1. Create a modern virtual environment
uv venv

# 2. Fast install of dependencies
uv pip install -r requirements.txt

# 3. Provision a local SQLite database for fast trials
.venv\Scripts\python -m flask create-db

# 4. Seed the sandbox database
.venv\Scripts\python -m flask seed

# 5. Start the Flask debug server
.venv\Scripts\python run.py
```
*The API is now running on `http://localhost:5000`.*

#### 2. Frontend Setup
Ensure **NodeJS v20+** is installed on your host system:

```bash
cd frontend
# 1. Install production and Tailwind dev compilers
npm install

# 2. Start the Vite hot-reloading development server
npm run dev
```
*The interface is now running on `http://localhost:3000` with direct server-proxy mappings.*

---

## 📁 Repository Structure

```
SmartKitchen_Hub/
├── backend/
│   ├── app/
│   │   ├── api/             # REST blueprints mapping endpoints
│   │   ├── controllers/     # Controller parameters extraction
│   │   ├── services/        # Orchestrated business rules transactions
│   │   ├── repositories/    # Database CRUD SQLAlchemy operations
│   │   ├── models/          # Relational entities definitions
│   │   ├── schemas/         # Marshmallow DTO input validations
│   │   ├── middleware/      # Auth JWT roles checks & error catches
│   │   └── utils/           # ReportLab PDF canvas & seeder helper
│   ├── run.py               # Main WSGI start script
│   ├── requirements.txt     # Python lock list
│   └── Dockerfile           # Multi-stage Alpine container config
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with active token injects
│   │   ├── components/      # Reusable Tables, Modals, & Toasts
│   │   ├── layouts/         # Main Layout, dynamic menus, and AI chatbot drawer
│   │   ├── pages/           # Visual interactive SaaS screens
│   │   ├── redux/           # Slice credentials and notification store
│   │   └── styles/          # Customized Tailwind CSS system stylesheet
│   ├── vite.config.js       # Vite proxy server config
│   ├── nginx.conf           # SPA fallback reverse proxy
│   └── Dockerfile           # Multi-stage Nginx container config
└── docker-compose.yml       # Production environment compose orchestration
```
