# Saaluvesa Enterprises - Production Repository

Comprehensive codebase for **Saaluvesa Enterprises Private Limited** export platform.

## Repository Structure

```
├── Frontend/              # Public-facing storefront (Vite + React SPA)
│   ├── src/               # React components, pages, hooks, data
│   ├── public/            # Static assets
│   ├── index.html         # Application root HTML
│   └── package.json       # Frontend dependencies & scripts
│
├── admin/                 # Admin Dashboard (Vite + React SPA)
│   ├── src/               # Admin management components, labels, banner controls
│   ├── public/            # Admin assets
│   ├── index.html         # Admin root HTML
│   └── package.json       # Admin dependencies & scripts
│
├── Backend/               # REST API Server (Node.js + Express + Sequelize + MySQL)
│   ├── src/               # Routes, models, middleware, controllers, services
│   ├── uploads/           # Media storage, logos, product images
│   ├── server.js          # Main server entrypoint
│   ├── app.js             # Express app runner
│   ├── .env.example       # Backend environment variables template
│   └── package.json       # Backend dependencies & scripts
│
├── database_schema.sql    # MySQL database schema & initial table structures
├── .gitignore             # Root git ignore rules
└── README.md              # Project documentation
```

## Quick Start Guide

### 1. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env     # Configure database credentials & JWT keys
npm start               # Runs node server.js on configured PORT
```

### 2. Frontend Storefront Setup
```bash
cd Frontend
npm install
npm run dev             # Starts local development server
npm run build           # Builds production bundles to dist/
```

### 3. Admin Dashboard Setup
```bash
cd admin
npm install
npm run dev             # Starts admin development server
npm run build           # Builds admin production bundles to dist/
```

---

## Production Deployment URLs
- **Storefront**: [https://saaluvesa.com](https://saaluvesa.com)
- **Admin Dashboard**: [https://saaluvesadashboard.saaluvesa.com](https://saaluvesadashboard.saaluvesa.com)
- **API Server**: [https://saaluvesaapi.saaluvesa.com](https://saaluvesaapi.saaluvesa.com)
