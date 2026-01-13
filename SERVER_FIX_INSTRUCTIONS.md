# Fix Server Prisma Client Error

## Problem
The error shows that Prisma Client on the server doesn't recognize the `page_type` column, even though the migration has been run and the column exists in the database.

## Root Cause
The Prisma Client was generated before the migration was applied, so it doesn't know about the new `page_type`, `category_id`, and `sub_category_id` columns.

## Solution

### Step 1: SSH into your server (if remote) or navigate to backend directory
```bash
cd /app  # or wherever your backend code is deployed
```

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: Verify the migration is applied to the server database
```bash
npx prisma migrate status
```

If it shows pending migrations, run:
```bash
npx prisma migrate deploy
```

### Step 4: Restart the backend server
After regenerating Prisma Client, restart your Node.js server:

**If using PM2:**
```bash
pm2 restart your-app-name
# or
pm2 restart all
```

**If using Docker:**
```bash
docker-compose restart backend
# or rebuild if needed
docker-compose up -d --build backend
```

**If using systemd:**
```bash
sudo systemctl restart your-backend-service
```

**If running directly:**
```bash
# Stop the server (Ctrl+C) and restart
npm start
# or
node server.js
```

### Step 5: Verify it's working
After restarting, test the banners endpoint:
```bash
curl http://your-server/api/admin/banners
```

Or test from the admin panel - the error should be gone.

## For Docker/Containerized Deployments

If your backend is in a Docker container:

1. **Rebuild the container with new Prisma Client:**
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

2. **Or run commands inside the container:**
   ```bash
   docker-compose exec backend npx prisma generate
   docker-compose restart backend
   ```

## Prevention

Make sure your deployment process includes:
1. Run `npx prisma migrate deploy` to apply migrations
2. Run `npx prisma generate` to regenerate Prisma Client
3. Restart the application

Add to your deployment script:
```bash
#!/bin/bash
npx prisma migrate deploy
npx prisma generate
pm2 restart all  # or your restart command
```

## Quick Checklist

- [ ] Migration applied to server database ✓
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Backend server restarted
- [ ] Error is resolved

## Still Not Working?

If the error persists:
1. Check if you're connecting to the correct database
2. Verify the migration was actually applied:
   ```sql
   DESCRIBE banners;
   -- Should show page_type, category_id, sub_category_id columns
   ```
3. Check Prisma schema matches the database
4. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   npx prisma generate
   ```
