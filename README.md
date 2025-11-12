# BI Dashboard Builder

Full-featured Business Intelligence platform with no-code dashboard builder, role-based access control, and time intelligence.

## Features

- **Data Management**: Upload CSV/Excel/JSON with auto schema detection
- **Metrics Engine**: SUM, AVG, YTD, MOM, YOY, rolling averages
- **Drag-and-Drop Builder**: Create dashboards with interactive charts
- **Access Control**: Role-based permissions with data-level filtering
- **Charts**: Line, Bar, Area, Pie, KPI Cards, Tables (ECharts)
- **Query Caching**: 5-minute cache for performance

## Quick Start

```bash
# Install
npm install

# Setup database
mysql -u root -p
CREATE DATABASE bi_dashboard;
exit

cp .env.example .env
# Edit .env with your DATABASE_URL

# Migrate
npx prisma migrate dev
npx prisma generate

# Run
npm run dev
```

Visit http://localhost:3000

## Environment Variables

```env
DATABASE_URL="mysql://root:password@localhost:3306/bi_dashboard"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-32-char-string"
```

## Usage

1. Visit landing page and click "Sign In"
2. Login with: admin@example.com / admin123
3. **Upload Data**: Admin → Data Sources → Upload CSV/Excel
4. **Create Metrics**: Admin → Metrics → Define calculations
5. **Build Dashboard**: Admin → Dashboards → Drag-and-drop widgets
6. **View Dashboards**: Click "View Dashboards" to see your BI reports

## Authentication

- All routes require authentication except landing page
- Users must login to access any functionality
- Session-based authentication with NextAuth.js

## Metric Examples

```javascript
// Simple
SUM(Amount)

// Calculated
(SUM(Revenue) - SUM(Cost)) / SUM(Revenue) * 100

// Time Intelligence
YOY(SUM(Sales))
RollingAverage(SUM(Revenue), 3)
```

## Tech Stack

Next.js 15, React, TypeScript, Tailwind, MySQL, Prisma, ECharts, NextAuth

## Production

```bash
npm run build
npm start
```

Deploy to Vercel, AWS, or GCP with MySQL database.
