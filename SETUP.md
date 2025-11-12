# Complete Setup Guide

## Prerequisites
- Node.js 18+
- MySQL 8.0+

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE bi_dashboard;

# Exit
exit
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/bi_dashboard"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-32-character-secret-key-here"
```

### 4. Run Database Setup
```bash
# All-in-one command
npm run db:setup

# Or step by step:
npm run db:migrate    # Run Prisma migrations
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed initial data
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Default Login Credentials

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Regional Manager:**
- Email: `manager@example.com`
- Password: `password123`

## Quick Test Workflow

1. Visit http://localhost:3000
2. Click "Sign In"
3. Login: admin@example.com / admin123
4. Navigate to "Data Sources"
5. Upload sample CSV file
6. Go to "Metrics" → Create metric: `SUM(Amount)`
7. Go to "Dashboards" → Add KPI Card with your metric
8. Click "View Dashboards" to see results

## Troubleshooting

**Database Connection Error:**
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL in .env
- Ensure database exists: `SHOW DATABASES;`

**Prisma Migration Error:**
```bash
npx prisma migrate reset
npm run db:setup
```

**Port Already in Use:**
```bash
# Use different port
PORT=3001 npm run dev
```

**Cannot Access Pages:**
- Make sure you're logged in
- All routes except "/" and "/login" require authentication

## Project Structure

```
bi-dashboard/
├── app/
│   ├── admin/               # Admin panel pages
│   ├── api/                 # API routes
│   └── page.tsx            # Landing page
├── components/
│   ├── charts/             # Chart components
│   ├── dashboards/         # Dashboard builder
│   ├── data-sources/       # Upload UI
│   ├── metrics/            # Metric builder
│   ├── users/              # User management
│   └── ui/                 # Base components
├── lib/
│   ├── services/           # Business logic
│   ├── auth.ts            # Authentication
│   ├── authorization.ts   # Access control
│   └── prisma.ts          # Database client
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed.ts            # Seed script
```

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npm run db:setup     # Complete DB setup
```

## Next Steps

1. Change default passwords
2. Configure your data sources
3. Create metrics for your KPIs
4. Build your first dashboard
5. Set up user roles and permissions
