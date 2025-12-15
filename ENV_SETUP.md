# Environment Variables Setup

## Overview
This project uses environment variables to configure the API base URL and other settings. This allows you to easily switch between different environments (development, staging, production) without changing code.

## Required Environment Variables

### VITE_API_BASE_URL
- **Description**: The base URL for the backend API
- **Default**: `http://localhost:5000/api`
- **Example**: 
  - Development: `http://localhost:5000/api`
  - Production: `https://api.optyshop.com/api`

### VITE_ENV
- **Description**: Current environment name
- **Default**: `development`
- **Options**: `development`, `staging`, `production`

## Setup Instructions

1. **Create a `.env` file** in the root directory of the project:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_ENV=development
   ```

3. **For production**, create a `.env.production` file:
   ```env
   VITE_API_BASE_URL=https://api.optyshop.com/api
   VITE_ENV=production
   ```

4. **Restart the development server** after creating/modifying `.env` files:
   ```bash
   npm run dev
   ```

## Important Notes

- ⚠️ **Never commit `.env` files to version control** - they contain sensitive configuration
- ✅ The `.env.example` file is safe to commit - it serves as a template
- 🔄 You must restart the dev server after changing environment variables
- 📝 In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser

## Files Using Environment Variables

- `src/utils/api.js` - Main API client
- `src/utils/customerApi.js` - Customer API client
- `src/api/forms.js` - Forms API client

## Troubleshooting

If the API calls are not working:
1. Check that `.env` file exists in the root directory
2. Verify `VITE_API_BASE_URL` is set correctly
3. Restart the development server
4. Check browser console for any errors



