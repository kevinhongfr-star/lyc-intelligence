
# LYC Intelligence

A comprehensive career intelligence platform for executives and teams.

## Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/your-org/lyc-intelligence
cd lyc-intelligence
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## Production Deployment

### Vercel
1. Fork this repository
2. Connect to Vercel
3. Configure all environment variables in Vercel dashboard (server-side and client-side)
4. Deploy!

### Supabase
1. Create a Supabase project
2. Apply database migrations
3. Enable Row Level Security (RLS) policies
4. Configure Storage buckets for user documents and share cards

## Project Structure

- `/api/`: Vercel serverless functions
- `/src/components/`: Reusable UI components
- `/src/pages/`: Page components
- `/src/lib/`: Utilities and helpers
- `/src/services/`: API and business logic
- `/public/`: Static assets

## Tech Stack
- React 18 + Vite
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- React Router
- PostHog (Analytics)
- Resend (Email)
- Stripe (Payments)
- Vercel (Deployment)

## Performance Targets
- First Contentful Paint (FCP): &lt;1.5s
- Time to Interactive (TTI): &lt;3s on 4G mobile
- Lighthouse score: &gt;90

## Security Checklist
- [x] All sensitive keys server-side only (no VITE_ prefix)
- [ ] RLS enabled and tested on all tables
- [ ] Rate limiting on /api/chat (30/min/IP) and /api/score (10/min/IP)
- [ ] Input sanitization to prevent prompt injection
- [ ] CORS configured (only allow lyc-intelligence.app)
- [ ] No internal methodology exposed client-side

<!-- deploy trigger -->
