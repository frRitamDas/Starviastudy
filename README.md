# Starvia — AI study companion

Starvia is a premium AI study platform for school students, built for Indian
curricula first (ICSE, CBSE and State Board). Students get an AI tutor, generated
tutorials and quizzes, a step-by-step question solver, exam preparation,
flashcards and progress tracking — all metered by a plan that is enforced on the
server.

Version 1.0 · Founded by Ritam Das · [@vxritam](https://instagram.com/vxritam)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Auth + DB | Supabase (Postgres, RLS, Auth, Storage) |
| AI | Google Gemini via `@google/genai` |
| Payments | Razorpay (server-verified; mock mode in development) |
| Hosting | Vercel |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

Useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
npm run start       # run the production build
npm run lint        # eslint
```

### 1. Create the database

Run `supabase/migrations/0001_init.sql` against your Supabase project — either
paste it into the SQL editor, or use the CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates every table, the `handle_new_user` trigger (which provisions a
profile and a free subscription on signup), the `increment_ai_usage` RPC, and
Row Level Security policies.

### 2. Configure environment variables

See `.env.example` for the full list with comments. In short:

- **Public**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Server only**: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`,
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
  `ADMIN_EMAILS`
- **Optional**: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for
  distributed rate limiting (an in-memory limiter is used otherwise)

Add the same keys in **Vercel → Project → Settings → Environment Variables**.

### 3. Enable sign-in methods

In Supabase → Authentication → Providers, enable Email and (optionally) Google.
For Google, add the callback URL:

```
https://<your-domain>/auth/callback
```

### 4. Razorpay (when you are ready to charge)

1. Create the account and copy the Key ID and Key Secret.
2. Add a webhook pointing at `https://<your-domain>/api/billing/webhook`
   subscribed to `payment.captured`, `payment.failed` and
   `subscription.cancelled`, then copy the webhook secret.
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

Until keys are set, checkout runs in a clearly-labelled mock mode. Mock orders
are refused in a production build, so a live deploy can never activate a plan
without a verified payment.

### 5. Admin access

Set `ADMIN_EMAILS` to a comma-separated list of emails. Those accounts can open
`/admin`. Everyone else is redirected to the dashboard.

---

## Architecture

```
src/
  app/
    (marketing)/     public pages: home, features, pricing, about, faq, contact, legal
    (auth)/          login, signup, password reset
    (app)/           authenticated shell: dashboard, tutor, tutorials, quiz, solve,
                     exam-prep, flashcards, progress, profile, checkout
    admin/           admin-only overview
    api/             every server route (AI, auth, billing, profile, usage, contact)
  components/        UI, layout, and one folder per feature
  lib/
    ai/              provider, prompts, schemas, cache, events — the AI service
    billing/         razorpay, payments, subscriptions
    usage/           server-side plan limit enforcement
    supabase/        browser, server and admin clients
  types/             database, content and row types
```

### AI service

No route calls the Gemini SDK directly. Everything goes through
`src/lib/ai/index.ts`:

- `streamTutorResponse()` / `generateTutorResponse()`
- `generateTutorial()`
- `generateQuiz()`
- `solveQuestion()` (text or image)
- `generateFlashcards()`
- `generateExamPrep()`

Swapping the model, the key or the provider is a change in
`src/lib/ai/provider.ts` and nothing else. Structured outputs are validated with
Zod before they are stored or returned, and identical generations are served from
the `content_cache` table so the same tutorial is never paid for twice.

### Usage limits

Limits live in exactly one place: `src/lib/plans.ts` (with an optional
`plan_limits` database override). Every AI route follows the same order:

```
authenticate → load plan → reserve a usage unit → call the model → record usage
```

The unit is reserved *before* the model call so parallel requests cannot exceed
the daily allowance, and refunded if the call fails. The frontend only displays
what the server reports via `/api/usage`; it never enforces a limit itself.

### Security

- Row Level Security on every table; users can only touch their own rows.
- The service-role key is imported only from `lib/supabase/admin.ts`, which is
  marked `server-only`.
- AI, usage and payment logic all run on the server. The Gemini key, the
  service-role key and the Razorpay secrets are never sent to the browser.
- Payment activation requires a server-verified Razorpay signature or a signed
  webhook; the amount always comes from the server-side plan definition.
- A strict Content Security Policy and hardened headers are set in
  `next.config.ts`.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel.
3. Add the environment variables from `.env.example`.
4. Deploy. `NEXT_PUBLIC_APP_URL` must be the production URL so auth redirects
   resolve correctly.

`/api/health` reports which integrations are configured (booleans only, never
secret values) — useful right after the first deploy.
