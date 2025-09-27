# Zawiyah2025 School Reservation System - Server

## Railway Deployment
This server is configured to deploy on Railway for production use.

### Environment Variables Required:
- `PORT`: Server port (Railway sets automatically)
- `CLIENT_URL`: Frontend URL (Vercel deployment URL)
- `CORS_ORIGIN`: Allowed origins for CORS

### Local Development:
```bash
npm install
npm run dev
```

### Production Deployment:
1. Push to GitHub repository
2. Connect repository to Railway
3. Set environment variables in Railway dashboard
4. Deploy automatically