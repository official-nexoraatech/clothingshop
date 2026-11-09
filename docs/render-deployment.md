# Render deployment guide

The existing backend and frontend services remain separate. This checkout's application root is the folder containing package.json, currently `CLOTHING SHOP APPLICATION final(6)/CLOTHING SHOP APPLICATION`. This frontend refresh changes storefront presentation only and uses the existing backend API.

## Changes

Modified:
- `.gitignore`: excludes environment variants, uploaded files, generated builds, dependencies, local MongoDB data, logs and test artifacts; keeps example files.
- `backend/.env.example`: documents runtime settings, Cloudinary, SMTP and one-time account creation without credentials.
- `backend/server.js`: validates production configuration and explicitly listens on 0.0.0.0 using Render's PORT (local fallback 5000).
- `backend/src/app.js`: trusts the nearest production proxy for HTTPS and client-IP rate limiting; normalizes CLIENT_URL for CORS.
- `src/context/AuthContext.jsx`: uses a shared API base that adds /api exactly once.
- `src/main.ts`: uses the same backend configuration for the legacy health page. The active entry remains main.tsx.
- `vite.config.ts`: validates the production HTTPS backend URL and proxies the legacy health endpoint during local development.

Created:
- `src/utils/apiConfig.js`: shared URL normalization, supporting a backend origin or existing /api suffix; local development uses the Vite proxy.
- `backend/src/config/environment.js`: rejects missing production settings, local MongoDB and invalid frontend origins; requires Cloudinary to prevent uploads disappearing on Render's ephemeral filesystem.
- `.env.example`: public frontend build variable.
- `.node-version`: pins Node 22.22.0 for both services.
- `render.yaml`: backend, static site, health check, manual secret entry and SPA rewrite.
- `docs/render-deployment.md`: this report and deployment instructions.

The database already reads MONGO_URI; JWT, SMTP and Cloudinary already read server environment variables. All current feature requests go through AuthContext. No separate backend package.json is needed. Existing localhost image URLs stored in MongoDB must be replaced by reuploading those images to Cloudinary; changing environment variables does not migrate stored data or local files.

## Service settings

| Setting | Frontend | Backend |
| --- | --- | --- |
| Service type | Static Site | Web Service, Node |
| Build | npm install && npm run build | npm install |
| Publish | dist | Not applicable |
| Start | Not applicable | npm run server |
| Health | Not applicable | /health |
| Node | .node-version | .node-version |

Use the folder containing package.json as the repository root when following this guide. If you push the outer workspace instead, set the Root Directory of BOTH services to `CLOTHING SHOP APPLICATION final(6)/CLOTHING SHOP APPLICATION`. For Blueprints, select the nested render.yaml path and add that same `rootDir` to both service definitions. Root directories are relative to the Git repository, not your Windows drive.

The Blueprint selects a paid Starter backend because the existing mail implementation uses SMTP. Review the plan before creating resources. Manual deployment below also lets you choose a plan. Free backends cannot send on SMTP ports 25, 465 or 587. SMTP remains optional for features that do not send email.

## Environment variables

Frontend only: `VITE_API_URL=https://<actual-backend-host>` (public, build time; use the real Render HTTPS URL, no /api needed). Changing it requires rebuilding the static site. No backend secrets belong in VITE_ variables. `npm run dev` works with it blank; `npm run build` requires it.

Backend:

| Variable | Requirement/default | Secret? |
| --- | --- | --- |
| MONGO_URI | Required Atlas/cloud connection string with database name | Yes |
| JWT_SECRET | Required random value of at least 32 characters | Yes |
| NODE_ENV | production | No |
| CLIENT_URL | Required public frontend HTTPS origin, no route | No |
| PORT | Supplied by Render; leave unset manually | No |
| JWT_EXPIRES_IN | 7d | No |
| AUTH_RATE_LIMIT | 20 per 15 minutes | No |
| PHASE9_RATE_LIMIT | 30 per 15 minutes | No |
| CLOUDINARY_CLOUD_NAME | Required for production uploads | No |
| CLOUDINARY_API_KEY | Required for production uploads; backend only | Keep private |
| CLOUDINARY_API_SECRET | Required for production uploads | Yes |
| SMTP_HOST | Required to enable email | No |
| SMTP_PORT | 587 by default | No |
| SMTP_SECURE | false for STARTTLS on 587; true for 465 | No |
| SMTP_USER | Mail provider username when authentication required | Keep private |
| SMTP_PASS | Mail provider password/app password | Yes |
| SMTP_FROM | Verified sender address | No |
| ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD | Only for npm run create:admin | Password secret; identity private |
| EMPLOYEE_NAME, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD | Only for npm run create:employee | Password secret; identity private |

MONGOD_PATH and CHROME_PATH are local/test executable overrides, not Render settings. The service integration test sets CLOUDINARY_URL to a local mock endpoint; the application uses the three explicit CLOUDINARY_* values above.

## Exact deployment steps

### STEP 1 — Push project to GitHub

Open a terminal in the folder containing package.json. This workspace was not a Git repository when inspected. Create an empty GitHub repository, then run:

```sh
git init
git add .
git status --short
git diff --cached --stat
```

Inspect staged files before committing. Never stage .env, MongoDB files, uploads, logs, node_modules, dist or real account passwords. Ignore rules do not remove previously tracked files; if importing existing Git history, audit it separately. If a secret was previously published, rotate it.

```sh
git commit -m "Prepare existing application for Render"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

No GitHub push or Render resource creation was performed by this task.

### STEP 2 — Configure MongoDB cloud database

Create a MongoDB Atlas cluster (replica set support is needed for order/inventory transactions). Create a database user with read/write access to the application database. Get the Drivers connection string, insert its real credentials and database name, and URL-encode special characters in credentials. Add the backend Render service's outbound IP ranges to Atlas Network Access after creating the service. Do not deploy backend/.local-mongo. An empty Atlas database does not contain local products, accounts or orders; migrate existing data separately if needed.

### STEP 3 — Create Render backend Web Service

Connect the GitHub repository. Select Node and the correct Root Directory. Build: `npm install`. Start: `npm run server`. Health check: `/health`. Choose a paid instance if using the current SMTP implementation on standard ports. Do not add a local MongoDB service.

### STEP 4 — Add backend environment variables

Set the required backend values from the table. Generate a strong JWT_SECRET locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` and paste it into Render only. Enter Cloudinary credentials. Set CLIENT_URL to the HTTPS frontend hostname you intend to create; correct it in step 11. This must be a valid HTTPS origin; leaving it blank intentionally prevents production startup. Add SMTP settings if email is needed. Leave PORT to Render.

### STEP 5 — Deploy backend

Allow the backend's outbound IP ranges in Atlas, deploy, and inspect Render logs for successful database connection and API listening. Correct missing environment settings or Atlas access errors before proceeding.

### STEP 6 — Copy backend Render URL

Copy the public HTTPS URL from Render. Open `<backend-url>/health`; expect HTTP 200 with status ok and database connected. Do not use a private/internal hostname.

### STEP 7 — Create Render frontend Static Site

Connect the same repository and branch. Set the correct Root Directory, build `npm install && npm run build`, and publish directory `dist`.

### STEP 8 — Set VITE_API_URL to backend URL

Set the public backend URL from step 6, then deploy. An optional trailing /api is supported for compatibility. Vite embeds this value at build time; rebuild after any change.

### STEP 9 — Add React Router rewrite

In Static Site Redirects/Rewrites add source `/*`, destination `/index.html`, action **Rewrite** (not Redirect). The Blueprint contains the same rule. Existing assets remain static files; React Router handles application paths.

### STEP 10 — Copy frontend Render URL

Copy the actual public frontend HTTPS origin from Render.

### STEP 11 — Set backend CLIENT_URL to frontend URL

Use that exact origin, without any page path. It controls browser CORS and password-reset email links. Authorization uses the existing bearer JWT; no cookie-based authentication changes are needed.

### STEP 12 — Redeploy backend if required

Save the changed backend environment and ensure the redeploy succeeds. Repeat the /health check. If the frontend origin changes later, update CLIENT_URL again.

### STEP 13 — Test application

Create the initial admin with the existing `npm run create:admin` script using the Atlas MONGO_URI and private ADMIN_* variables in a trusted local environment or Render shell. Create employees through the existing workflow or `npm run create:employee` with EMPLOYEE_* variables. Remove one-time bootstrap passwords from the service environment afterwards. Public registration is not an admin bootstrap mechanism.

Run the checklist below with test accounts and products. Do not treat a successful frontend build as proof that database, mail or upload integrations work.

## Final testing checklist

- [ ] Home page and product navigation load.
- [ ] Registration and login work; invalid login is rejected.
- [ ] JWT session survives refresh; protected routes reject unauthorized roles.
- [ ] Products and product images load from HTTPS URLs.
- [ ] Cart add/update/remove persists correctly.
- [ ] Checkout succeeds and stock changes correctly.
- [ ] Orders and order history display correctly.
- [ ] Admin login, dashboard, product management and analytics work.
- [ ] Employee login and dashboard enforce employee permissions.
- [ ] Inventory changes and logs persist in Atlas.
- [ ] /health reports MongoDB connected.
- [ ] Cloudinary product and avatar uploads survive a backend redeploy.
- [ ] Password-reset email arrives, links use the frontend domain and reset works (if SMTP configured).
- [ ] Direct navigation and refresh work on existing login/register/products/cart/checkout/admin/employee routes and nested routes.
- [ ] Browser console has no CORS, mixed-content or API URL errors.

## References

- Render Blueprint fields: https://render.com/docs/blueprint-spec
- Render port binding: https://render.com/docs/web-services
- SPA rewrites: https://render.com/docs/redirects-rewrites
- Nested service roots: https://render.com/docs/monorepo-support
- Free service SMTP and filesystem limits: https://render.com/docs/free

## Additional startup repair

`backend/src/controllers/catalogController.js` was also modified: the existing DELETE variant route referenced a missing export, causing Express to crash before database connection or port binding. Added the required handler, matching the catalog's existing soft-delete approach by marking the variant inactive and retaining order references. Invalid or missing variants return 404; the existing admin-only route guard remains unchanged.

## Verification results

- `npm install`: passed. npm refreshed package-lock.json; no dependency changes were intentionally requested.
- `npm run build`: TypeScript and Vite build passed with a temporary non-secret HTTPS example API URL. This generated dist is a verification artifact, not a configured production deployment. Render must rebuild with the actual backend URL.
- `npm run lint`: completed with one existing unused `employee` warning in backend/test-audit.js.
- Focused checks: production required-variable/local-URI validation, API prefix normalization, proxy trust, CORS preflight and disconnected /health behavior passed. Soft-delete handler and authentication checks are recorded in the ignored test-results/render-check.mjs verification script.
- `npm run server`: passed module/route initialization after the missing controller repair, then failed because the configured local MongoDB at 127.0.0.1:27028 refused the connection. A listening backend and connected /health response were NOT verified. No database records were changed.
- Atlas connectivity and transactions require a real cloud database and Render environment variables. Cloudinary uploads, SMTP delivery and deployed browser workflows were not exercised.
- Windows sandbox path permissions initially blocked Node; successful build and focused checks used approved elevated execution. Local verification used installed Node 22.14.0; Render is pinned to Node 22.22.0.
- No .env secrets were copied into source, examples, YAML or this report. Existing private environment files were left unchanged. There was no Git repository to audit for previously committed secrets.

