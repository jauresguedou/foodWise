This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Checkout setup

1. Copy `.env.example` to `.env.local` and set a PostgreSQL `DATABASE_URL`, a random `AUTH_SECRET`, a different random `CART_SECRET`, and the supported `STUDENT_EMAIL_DOMAINS`.
2. Add Stripe test-mode keys from the Stripe Dashboard to `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Do not use live keys for local testing.
3. Set `APP_URL` to the local or deployed HTTPS origin.
4. Use a MongoDB Atlas replica-set cluster (required for multi-document transactions). Run `npm install`, `npm run db:generate`, `npm run db:push`, and `npm run db:seed` from this directory.
5. Start the app with `npm run dev`. For local webhooks, use Stripe CLI to forward events to `/api/webhooks/stripe` and set the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

Checkout stays unavailable until its database and Stripe test-mode settings are configured. Payment success is recorded only by a verified Stripe webhook; the browser return page is informational.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Team members: Jaures Guedou
              Charles Ukoh
              Nicholas Kigozi

Project description:FoodWise is a web app that helps students find affordable meals, order food, and pay at student prices              
