// PM2 process definitions for the three KR Fuels Next.js apps on the Greentree VPS.
//
// Each app runs its own `next start` (port fixed by the app's package.json start
// script). The Virtualmin/Apache reverse proxy maps each subdomain to these
// internal ports — see deploy/reverse-proxy.md.
//
// Runtime env (FIREBASE_ADMIN_*, COOKIE_DOMAIN, origins, REVALIDATE_SECRET) is
// read by `next start` from each app's own .env.local — so no secrets live here.
// NEXT_PUBLIC_* values are baked in at BUILD time, so .env.local must be in place
// BEFORE `pnpm build`. See deploy/README.md.
//
//   Usage (from repo root):
//     pm2 startOrReload deploy/ecosystem.config.js
//     pm2 save

const path = require("path");
const REPO = path.resolve(__dirname, "..");

const common = {
  script: "pnpm",
  args: "start",
  interpreter: "none",     // run pnpm directly, not via node
  exec_mode: "fork",       // Next manages its own workers; never cluster mode
  instances: 1,
  autorestart: true,
  max_memory_restart: "1G",
  time: true,              // timestamp log lines
  env: { NODE_ENV: "production" },
};

module.exports = {
  apps: [
    {
      ...common,
      name: "kr-user",                       // krfuels.com  ->  127.0.0.1:3000
      cwd: path.join(REPO, "apps/user"),
    },
    {
      ...common,
      name: "kr-admin",                      // admin.krfuels.com  ->  127.0.0.1:3001
      cwd: path.join(REPO, "apps/admin"),
    },
    {
      ...common,
      name: "kr-backend",                    // api.krfuels.com  ->  127.0.0.1:4000
      cwd: path.join(REPO, "apps/backend"),
    },
  ],
};
