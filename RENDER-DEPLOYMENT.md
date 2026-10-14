# Render frontend deployment

The React frontend lives at the repository root: `index.html` loads
`src/main.tsx`, which renders the existing application and BrowserRouter.
`src/main.ts` is a legacy entry point and is not loaded by `index.html`.

Create a **Static Site** using `official-nexoraatech/clothingshop`:

| Setting | Value |
| --- | --- |
| Branch | `feature/chaitanya-clothing` |
| Root Directory | Leave blank (repository root) |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment: `VITE_API_URL` | `https://clothingshop-fafa.onrender.com/api` |
| Environment: `NODE_VERSION` | `22.14.0` |
| Rewrite Source | `/*` |
| Rewrite Destination | `/index.html` |
| Rewrite Action | Rewrite |

Set environment variables before the first build. Vite embeds them at build
time, so changing `VITE_API_URL` requires another frontend deployment.
The committed `.env.production` also supplies the production API URL.
Only public configuration belongs in frontend environment variables.

`render.yaml` provides the same settings for a Render Blueprint. Use either
the manual Static Site setup or the Blueprint; do not create both sites.
The Blueprint configures only the frontend and does not recreate the backend.

After Render assigns the frontend HTTPS URL:

1. Open the existing backend service `clothingshop-fafa` in Render.
2. Set its `CLIENT_URL` to the exact frontend origin, for example
   `https://your-frontend-name.onrender.com`, without a trailing slash or path.
3. Save and redeploy the backend. Its existing CORS middleware uses this
   variable. Password-reset links also use it.
4. Open the frontend URL and check the home page, catalog, login, and registration.
   Refresh `/login`, `/register`, and the relevant dashboard URL. Existing
   dashboards are `/customer`, `/admin`, and `/employee`; there is no
   `/dashboard` route. The rewrite preserves existing React route behavior.
5. In browser Network tools, confirm API requests go to
   `https://clothingshop-fafa.onrender.com/api/...` and have no CORS errors.

Local development remains `npm run dev`, with `/api` and `/uploads` proxied
to `http://localhost:5000` by Vite. `.env.production` is used for production
builds, not the development server. An explicitly supplied `VITE_API_URL`
overrides the production default.
