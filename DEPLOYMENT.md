# AI Admission Counselor — Deployment Guide

## Architecture

```
Vercel (Hosting)
  ├── Next.js App (Edge + Serverless)
  ├── Static assets (/public)
  └── API routes (Serverless Functions)

Neon (Database)
  └── PostgreSQL

Clerk (Authentication)
  └── User management, sign-in/sign-up

Resend (Email)
  └── Notifications, confirmations

AI Providers (choose one):
  ├── Groq (Free: llama-3.3-70b)
  └── Gemini (Free: gemini-2.0-flash)

OpenAI (Embeddings)
  └── text-embedding-3-small
```

## 1. Environment Variables

Copy `.env` to `.env.local` and fill all values:

```env
# Database
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Clerk (https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI (for embeddings — required)
OPENAI_API_KEY=sk-xxx
EMBEDDING_PROVIDER=openai
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# AI Provider — pick one
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.3-70b-versatile

# OR

# AI_PROVIDER=gemini
# GEMINI_API_KEY=AIzaxxx
# GEMINI_MODEL=gemini-2.0-flash

# Resend (email notifications)
RESEND_API_KEY=re_xxx

# Super admin emails (comma-separated)
SUPER_ADMIN_EMAILS=you@example.com

# App URL (required for widget)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 2. Set Up Each Service

### Neon (Database)
1. Sign up at https://neon.tech
2. Create a project → copy connection string
3. Set `DATABASE_URL` in your project
4. Run: `npx prisma db push`

### Clerk (Auth)
1. Sign up at https://clerk.com
2. Create a new application
3. Configure redirect URLs:
   - Sign-in: `https://your-app.vercel.app/sign-in`
   - Sign-up: `https://your-app.vercel.app/sign-up`
   - After sign-in: `https://your-app.vercel.app/dashboard`
4. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
5. Set up webhook:
   - Endpoint: `https://your-app.vercel.app/api/webhooks/clerk`
   - Events: `user.created`
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`

### OpenAI (Embeddings — Required)
1. Sign up at https://platform.openai.com
2. Create API key → `OPENAI_API_KEY`
3. The free tier includes $5 credits. Embedding costs ~$0.0001/1K tokens (very cheap).

### Groq (AI — Free Alternative)
1. Sign up at https://console.groq.com
2. Create API key → `GROQ_API_KEY`
3. Model: `llama-3.3-70b-versatile` (free)

### Gemini (AI — Free Alternative)
1. Sign up at https://aistudio.google.com
2. Get API key → `GEMINI_API_KEY`
3. Model: `gemini-2.0-flash` (free)

### Resend (Email)
1. Sign up at https://resend.com
2. Create API key → `RESEND_API_KEY`
3. Verify your domain (or use `onboarding@resend.dev` for testing)

## 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from project root
vercel --prod
```

Or connect your GitHub repo at https://vercel.com/new

### Vercel Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Output Directory:** `.next`
- **Node.js Version:** 20.x

Add all environment variables in Vercel Dashboard → Project Settings → Environment Variables.

## 4. Apply Database Schema

```bash
npx prisma generate
npx prisma db push
```

## 5. Seed Demo Data (Optional)

```bash
npx prisma db seed
```

This creates:
- A demo institute: "Demo Coaching Institute" (slug: `demo-institute`)
- 7 FAQs covering courses, fees, hostel, admissions, scholarships
- 5 knowledge base articles
- 5 sample leads (hot, warm, cold)
- 3 sample appointments

## 6. Post-Deployment Checklist

- [ ] Sign up at `/sign-up` → onboard → dashboard works
- [ ] Add FAQs in Knowledge Base
- [ ] Add knowledge base entries
- [ ] Configure AI provider in `.env`
- [ ] Set up appointment hours in Settings → Appointments
- [ ] Test chat at `/dashboard/counselor`
- [ ] Test lead creation at `/dashboard/leads`
- [ ] Customize widget at `/dashboard/settings/widget`
- [ ] Add embed code to your website
- [ ] Verify email notifications (check console logs if no Resend key)
- [ ] Set `SUPER_ADMIN_EMAILS` for admin dashboard access

## 7. Cost Breakdown (All Free Tiers)

| Service | Free Tier Limit |
|---------|----------------|
| Vercel  | 100 hrs/month serverless, 100 GB bandwidth |
| Neon    | 0.5 GB storage, 100 hrs/month compute |
| Clerk   | 10K monthly active users |
| OpenAI  | Embeddings: ~$0.02/10K queries |
| Groq    | 30 req/min, 14K req/day (free models) |
| Gemini  | 60 req/min (free tier) |
| Resend  | 100 emails/day |
