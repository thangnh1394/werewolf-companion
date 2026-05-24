# Deployment Guide

This deploys the app to Cloudflare's free tier in two pieces:

1. **Server** → PartyKit cloud-prem deploy into your own Cloudflare account (uses Durable Objects)
2. **Client** → Cloudflare Pages

Estimated cost: **$0/year** for our usage profile.

## Prerequisites

- A Cloudflare account (free plan is fine)
- Node.js 20+
- A GitHub repo to host this code (private recommended)

## Step 1 — Deploy the PartyKit server

The first time:

```bash
cd packages/server
npx partykit login    # Opens browser to authorize with Cloudflare/PartyKit
npx partykit deploy
```

This deploys to `https://werewolf-companion.<your-partykit-username>.partykit.dev`. Copy the URL — you'll need it for step 2.

To redeploy later:

```bash
cd packages/server
npm run deploy
```

To deploy into your *own* Cloudflare account (cloud-prem, recommended for total cost control):

```bash
npx partykit deploy --cf-account-id <your-account-id>
```

You can find your Cloudflare account ID at https://dash.cloudflare.com → right sidebar.

## Step 2 — Deploy the client to Cloudflare Pages

### Option A — Connect GitHub (recommended; redeploys on every push)

1. Push this repo to GitHub.
2. In Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
3. Pick your repo. Cloudflare detects the framework.
4. **Build settings:**
   - **Framework preset:** `Vite`
   - **Build command:** `npm install && npm run build --workspace=@werewolf/client`
   - **Build output directory:** `packages/client/dist`
   - **Root directory:** *(leave blank — keeps repo root)*
5. **Environment variables:**
   - `VITE_PARTYKIT_HOST` = `werewolf-companion.<your-partykit-username>.partykit.dev` (from Step 1)
   - `NODE_VERSION` = `20`
6. Click Save and Deploy.

Subsequent commits to `main` auto-deploy. Use `.github/workflows/deploy.yml` if you prefer pushing-deploys outside of Cloudflare's UI integration.

### Option B — Wrangler CLI (one-off)

```bash
cd packages/client
VITE_PARTYKIT_HOST=werewolf-companion.<your-partykit-username>.partykit.dev npm run build
npx wrangler pages deploy dist --project-name=werewolf-companion
```

## Step 3 — Custom domain (optional)

In Cloudflare Pages → your project → Custom domains, add e.g. `soi.example.com`. Cloudflare handles SSL automatically.

Then update `VITE_PARTYKIT_HOST` if you also point the PartyKit server at a custom domain.

## Verification

After deployment, visit the Pages URL on your phone:

1. Tap "Tạo phòng mới", enter a name + 6-digit code → you should land in the lobby.
2. On a second device (or in a different browser tab), open the QR code or copy the link → tap to join.
3. Both devices should see each other in the player list within ~200ms.
4. Toggle "Sẵn sàng" on both → host's "Bắt đầu chia bài" button becomes active (still requires 5+ players in production).

## Free-tier limits (verified May 2026)

| Resource | Free limit | Our usage |
|---|---|---|
| Cloudflare Pages bandwidth | Unlimited | ~5 MB/session |
| Cloudflare Pages builds | 500/month | ~10/month |
| Workers requests | 100,000/day | ~50/day |
| Durable Objects requests | 100,000/day | ~50/day |
| Durable Objects duration | 13,000 GB-s/day | <10 GB-s/day |
| Durable Objects SQLite | Generous (~5 GB) | <5 MB |

All comfortably ~10,000× under the ceiling.

## Troubleshooting

- **"Failed to connect to PartyKit"** — check `VITE_PARTYKIT_HOST` is set correctly (no `https://` prefix, no trailing slash). PartySocket adds the scheme automatically.
- **CORS errors** — PartyKit handles CORS automatically for the configured Pages domain; if you see errors, redeploy the server after a Pages domain change.
- **DO eviction during long idle** — expected. The DO's SQLite state will be restored on next connection. Active rooms (with connected players) never evict.
- **Players see different player lists** — should be impossible (DO is single source of truth). If it happens, file a bug — likely a missed broadcast in `LobbyServer`.

## Rolling back

PartyKit:
```bash
npx partykit list deployments
npx partykit rollback <deployment-id>
```

Cloudflare Pages:
- Dashboard → Pages → your project → Deployments → click the older one → "Rollback to this deployment"
