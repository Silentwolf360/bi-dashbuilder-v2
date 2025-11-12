# Authentication Flow

## Overview

The BI Dashboard now has complete authentication protection. No user can access any functionality without logging in.

## Flow

```
1. User visits http://localhost:3000
   ↓
2. Sees landing page with "Sign In" button
   ↓
3. Clicks "Sign In" → redirected to /login
   ↓
4. Enters credentials:
   - admin@example.com / admin123
   - manager@example.com / password123
   ↓
5. On success → redirected to /admin/dashboards
   ↓
6. Can now access:
   - Admin panel (data sources, metrics, dashboards)
   - View dashboards (/dashboards)
   ↓
7. Click "Sign Out" → session cleared → redirect to landing page
```

## Protected Routes

**All routes require authentication EXCEPT:**
- `/` (landing page)
- `/login` (login page)
- `/api/auth/*` (NextAuth endpoints)

**Protected routes:**
- `/admin/*` - Admin panel
- `/dashboards` - Dashboard viewer
- `/dashboards/[id]` - Individual dashboard
- All API routes (except auth)

## Implementation

### Middleware (`middleware.ts`)
- Checks authentication on every request
- Redirects unauthenticated users to `/login`
- Allows public access to landing and login pages

### Session Management
- NextAuth.js with JWT strategy
- Session stored in HTTP-only cookies
- Automatic session refresh

### Page-level Protection
- All protected pages use `useSession()` hook
- Show loading state during auth check
- Redirect to login if unauthenticated

## User Roles

Seeded with:
1. **Administrator** - Full access
2. **Analyst** - Can create dashboards
3. **Viewer** - Read-only access

## Testing

1. Visit `/admin/dashboards` without logging in
   → Redirected to `/login`

2. Login with correct credentials
   → Access granted to admin panel

3. Try to access `/dashboards` without login
   → Redirected to `/login`

4. Sign out
   → Redirected to landing page
   → Cannot access protected routes

## API Authentication

All API routes check authentication:
```typescript
const user = await requireAuth()
// Throws error if not authenticated
```

Returns 401 Unauthorized if no valid session.
