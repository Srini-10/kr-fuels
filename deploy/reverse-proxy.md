# Reverse-proxy config — hand this to the Greentree server team

Three subdomains, each proxied to a local Node port. All three must be under
`krfuels.com` because the apps share one session cookie (`.krfuels.com`).
Provision a Let's Encrypt cert for **each** subdomain.

| Subdomain                 | App           | Proxy to            |
|---------------------------|---------------|---------------------|
| `krfuels.com` + `www`     | Public site   | `127.0.0.1:3000`    |
| `admin.krfuels.com`       | Admin panel   | `127.0.0.1:3001`    |
| `api.krfuels.com`         | Backend API   | `127.0.0.1:4000`    |

Next.js `next start` (production) does **not** need a WebSocket upgrade — plain
HTTP proxying is enough. Keep `ProxyPreserveHost On` so the apps see the real
Host and set `X-Forwarded-Proto https` so they know the edge is HTTPS.

## Apache (Virtualmin default) — per virtual server

Add to each subdomain's `<VirtualHost *:443>` (Virtualmin: *Services → Configure
Website → Edit Directives*). Example shown for the public site — change the port
per the table above.

```apache
ProxyPreserveHost On
# Let Let's Encrypt http-01 challenges bypass the proxy:
ProxyPass /.well-known !
ProxyPass        / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
RequestHeader set X-Forwarded-Proto "https"
```

Required modules: `mod_proxy`, `mod_proxy_http`, `mod_headers`.

## Nginx (if used instead of Apache)

```nginx
location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

## Two things only the server team can do (jailed user has no sudo)

1. **PM2 boot persistence** — run once as root so our apps relaunch after reboot:
   ```
   pm2 startup systemd -u krfuels --hp /home/krfuels
   ```
   (or `loginctl enable-linger krfuels`). After that we run `pm2 save` ourselves.
2. **Outbound egress** — allow HTTPS/gRPC on 443 to `*.googleapis.com`,
   `firestore.googleapis.com`, `*.firebaseio.com` (the app's Firestore/Auth data
   layer). Confirm the firewall does not block it.
