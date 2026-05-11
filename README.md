# Bank Compliance Portal

A full-stack web application for bank licensing and compliance workflows. This backend handles authentication, application processing, workflow transitions, document uploads, and audit tracking. The frontend provides a modern dashboard with secure role-based access.

## Setup Instructions

### Prerequisites
- Node.js 18 or newer
- PostgreSQL 14 or newer
- npm or yarn

### Install Dependencies

```bash
git clone https://github.com/freddykaberuka/bank-compliance-portal.git
cd bank-compliance-portal
npm install
cd portal-frontend && npm install && cd ..
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bank_compliance"
JWT_SECRET="your-secure-secret"
JWT_EXPIRY="7d"
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

Create frontend environment in `portal-frontend/.env.local`:

```env
VITE_API_URL="http://localhost:3000"
```

## Database Commands

```bash
# Apply database migrations
npm run db:migrate

# Seed database with initial test data
npm run db:seed

# Reset database and re-seed
npm run db:reset
```

## Full Setup and Startup

Follow these commands to get the app running from a clean checkout:

```bash
# Clone and install backend
git clone https://github.com/freddykaberuka/bank-compliance-portal.git
cd bank-compliance-portal
npm install

# Install frontend dependencies
cd portal-frontend
npm install
cd ..

# Configure environment variables
cp .env.example .env 
cp portal-frontend/.env.example portal-frontend/.env.local

# Prepare the database
npm run db:migrate
npm run db:seed

# Start backend server
npm run dev
```

Open a second terminal and start the frontend:

```bash
cd portal-frontend
npm run dev
```

Then open the app in your browser at `http://localhost:5173`.

## Test Commands

```bash
npm test
npm run test:coverage
```

## Test Commands

```bash
npm test
npm run test:coverage
```

## API Documentation Access

Swagger UI is available after starting the backend at:

- `http://localhost:3000/api-docs`
- `http://localhost:3000/api/openapi.json`

The interactive documentation includes authentication, application management, workflow transitions, document upload endpoints, request and response schemas, JWT auth, and error responses.
