# Campus Marketplace

An AI-powered peer-to-peer marketplace for college students — built with the MERN stack and Google Gemini. Students can list items for sale and get instant AI-generated titles, descriptions, and price recommendations from a single product photo.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [AI Integration](#ai-integration)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security Model](#security-model)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Design Decisions](#design-decisions)

---

## Overview

Campus Marketplace solves the friction of student-to-student selling. Listing an item traditionally requires writing a description, naming a price, and choosing a category — tasks students skip, resulting in low-quality posts. This platform eliminates that friction: upload one photo and Gemini 1.5 Flash returns a structured analysis with a catchy title, honest condition assessment, and a realistic price range tailored to the college resale market.

The backend is a RESTful Express API with JWT authentication, MongoDB Atlas for persistence, and Cloudinary for image hosting. The frontend is a React SPA built with Vite, using the native Fetch API and React Context for state.

---

## Live Demo

> _Add your deployed URLs here once hosted._

---

## Key Features

### Listings
- Browse all listings with filter by category and price range
- Paginated results (20 per page, configurable)
- Full detail view per listing with seller information
- Create and delete your own listings

### AI-Powered Listing Creation
- Upload one image → Gemini 1.5 Flash analyzes it
- Returns: product identification, brand detection, condition estimate, suggested title, 2-3 sentence description, and price range
- Form fields are auto-populated; everything is editable before posting
- AI failure is handled gracefully — listing creation continues without AI output

### Authentication
- Register / login with email and password
- JWT tokens stored in `localStorage`, injected automatically into every request
- Protected routes (create, delete) reject unauthenticated users

### Image Handling
- Images uploaded to Cloudinary via a server-side streaming pipeline (Multer + Cloudinary SDK)
- CDN-served URLs stored in MongoDB; no local disk usage

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  React 19 + Vite  │  React Router  │  Fetch API client  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼──────────────────────────────┐
│                    Express API  (Node.js)                │
│                                                         │
│  Middleware chain:                                       │
│  Helmet → CORS → Rate limiter → Morgan → Routes         │
│                                                         │
│  Route layer  →  Controller  →  Service                 │
│                                                         │
│  Auth middleware (JWT verify)                           │
│  Error handler (Mongoose + JWT + custom errors)         │
└──────┬─────────────────────┬───────────────────┬────────┘
       │                     │                   │
       ▼                     ▼                   ▼
 MongoDB Atlas          Cloudinary           Gemini API
 (Mongoose ODM)     (image upload/CDN)   (1.5 Flash model)
```

### Request Lifecycle

1. Browser sends request with `Authorization: Bearer <token>` header
2. Express middleware chain processes (security, logging, rate limiting)
3. Route dispatches to controller
4. Auth middleware verifies JWT and attaches `req.user`
5. Controller calls service layer; service handles DB / external API calls
6. Response serialized and returned; errors caught by global error handler

### Frontend State Management

- **AuthContext** (React Context API): global auth state — `user`, `token`, `loading`, `loginUser()`, `logout()`
- **Component-local state** (useState): form values, loading flags, UI feedback
- **localStorage**: JWT token persistence across page refreshes

---

## Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Framework | Express.js | 4.19.2 |
| Database ORM | Mongoose | 8.4.1 |
| Database | MongoDB Atlas | Managed |
| Authentication | jsonwebtoken | 9.0.2 |
| Password hashing | bcryptjs | 2.4.3 |
| File upload | Multer | 2.1.1 |
| Cloud storage | Cloudinary SDK | 2.5.1 |
| AI | @google/generative-ai | Latest |
| Security headers | Helmet | 7.1.0 |
| Rate limiting | express-rate-limit | 7.3.1 |
| Request logging | Morgan | 1.10.0 |
| Dev server | Nodemon | 3.1.4 |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| UI library | React | 19.2.5 |
| Build tool | Vite | 8.0.10 |
| Routing | React Router DOM | 7.15.0 |
| HTTP client | Fetch API (native) | — |
| Styling | Plain CSS + CSS variables | — |

### External Services

| Service | Purpose |
|---|---|
| MongoDB Atlas | Managed MongoDB cluster |
| Cloudinary | Image upload, transformation, CDN delivery |
| Google Gemini 1.5 Flash | Product image analysis and text generation |

---

## AI Integration

### Flow

```
Frontend
  │
  ├── 1. User uploads image
  │       POST /api/upload  →  Multer (in-memory)  →  Cloudinary stream upload
  │       ← { url, publicId }
  │
  ├── 2. Frontend sends Cloudinary URL to AI endpoint
  │       POST /api/ai/generate-description  →  { imageUrl, category }
  │
Backend (aiService.js)
  │
  ├── 3. Fetch image from Cloudinary URL as binary
  ├── 4. Convert binary to base64 + detect MIME type
  ├── 5. Send to Gemini 1.5 Flash with structured prompt
  ├── 6. Parse structured response into fields
  └── 7. Return { raw, parsed: { title, description, price, condition, brand } }
```

### Gemini Prompt Strategy

The prompt instructs Gemini to:
- Identify the exact product (e.g., `"Nike Air Force 1 Low"`, not just `"shoe"`)
- Detect any visible brand name, model, or text
- Estimate a realistic second-hand condition (excellent / good / fair)
- Generate a listing title capped at 8 words
- Write a 2-3 sentence description that mentions brand, condition, and student value
- Suggest a numeric price range appropriate for the campus resale market

### Fallback Price Ranges

If Gemini returns an unparseable response or the API call fails, the service falls back to hardcoded category ranges:

| Category | Fallback Range |
|---|---|
| Textbooks | $10 – $60 |
| Electronics | $20 – $300 |
| Furniture | $15 – $200 |
| Clothing | $5 – $50 |
| Sports | $10 – $100 |
| Other | $5 – $50 |

AI errors do not block listing creation — the form simply remains unpopulated and the user fills it in manually.

---

## Database Schema

### User

```js
{
  name:      String,   // required, max 50 chars
  email:     String,   // required, unique, regex validated
  password:  String,   // required, bcrypt hash, min 6 chars (raw)
  createdAt: Date,     // auto
  updatedAt: Date      // auto
}
```

- **Pre-save hook**: hashes `password` with bcrypt (12 salt rounds) whenever modified
- **Instance method**: `comparePassword(candidate)` — async bcrypt comparison
- `password` field excluded from JSON serialization via `select: false`

### Listing

```js
{
  title:       String,           // required, max 100 chars
  description: String,           // required, max 2000 chars
  price:       Number,           // required, min 0
  images: [{
    url:       String,           // Cloudinary CDN URL
    publicId:  String            // Cloudinary asset ID
  }],
  category:    String,           // required, enum (see below)
  seller:      ObjectId → User,  // required, populate ref
  createdAt:   Date,
  updatedAt:   Date
}
```

**Category enum**: `textbooks` | `electronics` | `furniture` | `clothing` | `sports` | `other`

---

## API Reference

All endpoints are prefixed `/api`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Server status + MongoDB connection state |

### Authentication

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{ name, email, password }` | `{ token, user }` |
| POST | `/auth/login` | No | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | Yes | — | Current user object |

### Listings

| Method | Path | Auth | Query / Body | Response |
|---|---|---|---|---|
| GET | `/listings` | No | `?category=&minPrice=&maxPrice=&page=&limit=` | `{ listings[], pagination }` |
| GET | `/listings/:id` | No | — | Listing with populated seller |
| POST | `/listings` | Yes | `{ title, description, price, category, images[] }` | Created listing |
| DELETE | `/listings/:id` | Yes (owner only) | — | Success message |

### AI

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/ai/generate-description` | Yes | `{ imageUrl, category }` | `{ basic, enhanced, captionError? }` |

### Upload

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/upload` | Yes | `multipart/form-data` (field: `image`) | `{ url, publicId }` |

### Error Responses

All errors follow:

```json
{
  "success": false,
  "message": "Human-readable description",
  "errors": [ "field-level validation errors (if any)" ]
}
```

Common HTTP status codes:
- `400` Validation error / bad input
- `401` Missing or invalid JWT
- `403` Authenticated but not authorized (e.g., deleting another user's listing)
- `404` Resource not found
- `409` Duplicate key (email already registered)
- `429` Rate limit exceeded
- `500` Internal server error

---

## Security Model

### Authentication & Authorization

- Passwords hashed with **bcryptjs** at 12 salt rounds before storage
- JWT tokens signed with a 64-character hex secret, expire after 7 days
- `password` field excluded from all DB queries via Mongoose `select: false`
- Auth middleware verifies signature and expiry on every protected request

### Transport & Headers

- **Helmet.js** sets strict HTTP security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, etc.
- **CORS**: open in development; locked to client origin in production

### Rate Limiting

- 100 requests per 15-minute window per IP (global, all routes)
- Can be tuned per environment or per route

### Input Validation

| Field | Rule |
|---|---|
| Name | max 50 chars |
| Email | regex format check |
| Password | min 6 chars |
| Title | max 100 chars |
| Description | max 2000 chars |
| Price | non-negative number |
| Category | strict enum check |
| Images | MIME type checked (images only) |

---

## Project Structure

```
Campus-Marketplace/
├── backend/
│   ├── src/
│   │   ├── server.js              # HTTP server bootstrap
│   │   ├── app.js                 # Express app + middleware chain
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB Atlas connection
│   │   │   └── cloudinary.js      # Cloudinary SDK init
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── listingController.js
│   │   │   ├── aiController.js
│   │   │   └── uploadController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify middleware
│   │   │   ├── errorHandler.js    # Global error handler
│   │   │   └── notFound.js        # 404 handler
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Listing.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── listings.js
│   │   │   ├── ai.js
│   │   │   └── upload.js
│   │   └── services/
│   │       ├── authService.js     # Register / login logic
│   │       ├── listingService.js  # CRUD + filter + pagination
│   │       ├── aiService.js       # Gemini image analysis
│   │       └── uploadService.js   # Cloudinary stream upload
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── main.jsx               # React DOM root
    │   ├── App.jsx                # Router + layout
    │   ├── api/
    │   │   ├── client.js          # Fetch wrapper (get/post/del + auth header)
    │   │   ├── auth.js
    │   │   ├── listings.js
    │   │   ├── ai.js
    │   │   └── upload.js
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ListingCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state + provider
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── CreateListing.jsx
    │       └── ProductPage.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas cluster (free tier works)
- Cloudinary account
- Google Gemini API key (from Google AI Studio)

### 1. Clone

```bash
git clone https://github.com/uday0050/Campus-Marketplace.git
cd Campus-Marketplace
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables)).

```bash
npm run dev        # starts Nodemon on port 5001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # starts Vite dev server on port 5173
```

Open [http://localhost:5173](http://localhost:5173).

### Verify

```bash
curl http://localhost:5001/api/health
# {"success":true,"message":"Server is running","database":"connected"}
```

---

## Environment Variables

### `backend/.env`

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=<64-char hex string>
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Google Gemini
GEMINI_API_KEY=<api-key>
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5001/api
```

---

## Design Decisions

**Service layer pattern** — Controllers are thin; all business logic lives in service files. This makes services independently testable and reusable across routes without controller bloat.

**React Context over Redux** — Auth state is the only truly global state in this app. Redux would add boilerplate with no architectural benefit at this scale.

**Native Fetch over Axios** — The custom `client.js` wrapper handles token injection and error normalization in ~30 lines. No additional dependency needed.

**Cloudinary streaming via Multer memory storage** — Images never touch the filesystem. Multer buffers the upload in RAM; the service pipes the stream directly to Cloudinary. This works correctly on stateless/serverless deployments.

**Gemini 1.5 Flash** — Chosen over Pro/Opus for latency and cost. Image analysis tasks don't require the reasoning depth of larger models, and Flash responds in under 2 seconds for typical product photos.

**bcrypt salt rounds = 12** — Balances security and login latency (~300ms per hash on commodity hardware). The value can be raised for higher-security requirements.

**MongoDB Atlas** — Fully managed, handles connection pooling, backups, and scaling. The app connects with a 5-second timeout and relies on Mongoose's built-in connection retry.

---

## License

MIT
