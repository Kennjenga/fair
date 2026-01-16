# FAIR PWA - Architecture Documentation

## Progressive Web App (PWA) Overview

The FAIR platform is a **Progressive Web App (PWA)**, which means it can be installed on devices like a native app while still being a web application. This provides the best of both worlds: the accessibility of a web app and the user experience of a native app.

## Backend and Database Architecture

### **Same Backend and Database**

**Yes**, the installed PWA uses the **exact same backend and database** as the browser version. Here's why:

### Architecture Diagram

```
┌─────────────────────┐     ┌─────────────────────┐
│   Browser Version   │     │  Installed PWA App  │
│  (Chrome/Firefox)   │     │   (Desktop/Mobile)  │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │    HTTP/HTTPS Requests    │
           └────────────┬──────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │    Next.js Backend     │
           │  (API Routes /api/v1)  │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   PostgreSQL Database  │
           │     (fair_db)          │
           └────────────────────────┘
```

### How It Works

1. **Single Backend**: 
   - Both browser and PWA versions connect to: `http://localhost:3000/api` (or production URL)
   - All API endpoints are shared (authentication, voting, admin features, etc.)

2. **Single Database**:
   - PostgreSQL database: `fair_db`
   - Host: `localhost:5432` (dev) or production server
   - Same tables, same data for all clients

3. **PWA Features**:
   - **Service Worker** (`public/sw.js`): Handles offline caching and background sync
   - **Manifest** (`public/manifest.json`): Defines app metadata, icons, and install behavior
   - **Same API Calls**: Both versions use identical fetch requests to the same endpoints

### Key Configuration Files

#### 1. `.env` - Backend Configuration
```env
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fair_db
DB_USER=postgres
DB_PASSWORD=112233

# API Endpoints (used by both browser and PWA)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### 2. `public/manifest.json` - PWA Configuration
```json
{
  "name": "Fair App",
  "short_name": "Fair",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "icons": [...]
}
```

#### 3. `public/sw.js` - Service Worker
- Handles caching strategies
- Manages offline functionality
- Syncs data when connection is restored

### Data Synchronization

| Feature | Browser | Installed PWA |
|---------|---------|---------------|
| **Authentication** | ✅ Same JWT tokens | ✅ Same JWT tokens |
| **Database Connection** | ✅ Via Next.js API | ✅ Via Next.js API |
| **Real-time Updates** | ✅ HTTP requests | ✅ HTTP requests |
| **Offline Support** | ❌ Requires connection | ✅ Cached via Service Worker |
| **Data Storage** | Same PostgreSQL | Same PostgreSQL |

### Benefits of This Architecture

1. **Unified Data**: Users see the same data whether using browser or installed app
2. **Single Codebase**: Easier maintenance and updates
3. **Session Continuity**: Login sessions work across both versions
4. **Offline Capability**: PWA can cache assets for offline viewing (data still requires backend)
5. **Push Notifications**: Service worker enables notification support (future feature)

### Important Notes

⚠️ **Critical Points**:
- The PWA is not a separate application - it's the same web app with enhanced capabilities
- All authentication tokens, API calls, and database queries are identical
- Changes made in one version (browser or PWA) are immediately reflected in the other
- The backend server must be running for both versions to function fully

### Technical Stack

- **Frontend**: Next.js 16 + React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (fair_db)
- **PWA Tools**: Next-PWA / Workbox
- **Authentication**: JWT tokens stored in localStorage
- **Blockchain**: Avalanche (Fuji testnet)

---

**Last Updated**: January 16, 2026
