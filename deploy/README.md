# Deploying KR Fuels to the Greentree VPS

Three Next.js apps (public site, admin, backend API) from one pnpm/Turborepo
monorepo, run under PM2 behind a Virtualmin reverse proxy. Firestore is the
database (external/managed) — nothing to install for it.

| App          | Subdomain              | Port | PM2 name     |
|--------------|------------------------|------|--------------|
| `@kr/user`   | `krfuels.com` + `www`  | 3000 | `kr-user`    |
| `@kr/admin`  | `admin.krfuels.com`    | 3001 | `kr-admin`   |
| `@kr/backend`| `api.krfuels.com`      | 4000 | `kr-backend` |

## Prerequisites (server team provides)
- Node 22 LTS, corepack-enabled **pnpm 9.15.0**, PM2 (global)
- `pm2 startup` registered for the `krfuels` user, + firewall egress to Firebase
- Reverse-proxy vhosts + Let's Encrypt for all three subdomains — see
  [reverse-proxy.md](reverse-proxy.md)

## One-time setup (SSH in as `krfuels`)
```sh
git clone <your-repo-url> ~/kr-fuels
cd ~/kr-fuels
pnpm install --frozen-lockfile
```
Create each app's `.env.local` from the templates in `deploy/env-templates/`,
filling the `__COPY_FROM_EXISTING_ENV_LOCAL__` secrets from your current local
`.env.local` files:
```sh
cp deploy/env-templates/user.env    apps/user/.env.local
cp deploy/env-templates/admin.env   apps/admin/.env.local
cp deploy/env-templates/backend.env apps/backend/.env.local
# then edit the three files and paste the real secret values
```
> NEXT_PUBLIC_* values are baked in at **build** time, so the .env.local files
> must exist **before** the first build.

First build + start:
```sh
pnpm build
pm2 startOrReload deploy/ecosystem.config.js
pm2 save
```

## Every deploy after that
```sh
./deploy/deploy.sh
```
(pull → install → build → `pm2 reload` → save)

## Post-deploy checklist
- Add `krfuels.com`, `admin.krfuels.com`, `api.krfuels.com` to **Firebase Console
  → Authentication → Settings → Authorized domains**.
- Point DNS A-records for the three subdomains at the VPS IP.
- Create the first admin: set `NEXT_PUBLIC_ALLOW_REGISTRATION=true` in
  `apps/admin/.env.local`, rebuild, register, then revert to `false` and rebuild.
- Verify: `pm2 status`, `pm2 logs kr-backend`, then load each subdomain over HTTPS.
