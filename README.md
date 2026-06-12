# ⚡ IdeaFlow

> **Think visually. Connect deeply.**  
> A lightweight, canvas-based idea board — drag, resize, connect, and organise your thoughts across multiple boards.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Multiple Boards** | Create unlimited boards, each with its own canvas |
| **Cards** | Drag to move · Resize from corner · 8 colour themes |
| **Rich Text** | Bold, Italic, Inline Code, H1–H3, Bullet & Numbered lists |
| **Arrow Connections** | Draw curved arrows between cards to link ideas |
| **Grid Snap** | Optional 24px snap grid for clean alignment |
| **Full-text Search** | Filters cards in real-time, highlights matches |
| **Dark / Light Mode** | Toggle from the toolbar, preference saved |
| **Auto-save** | 500ms debounced save to `localStorage` — no data loss |
| **Mobile Responsive** | Single-column layout on screens < 768px |

---

## 🛠 Tech Stack

- **React 18** + **Vite 5** — fast dev & lean production build
- **TipTap 2** — headless rich-text editor (no heavy deps)
- **localStorage** — zero-backend persistence, swappable for any API
- **Pure CSS** — no Tailwind or UI framework, fully custom
- **~150 KB gzipped** — entire app bundle

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ideaflow.git
cd ideaflow

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

### Build for production
```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

---

## ☁️ Deploy to Google Cloud Platform (GCP)

IdeaFlow is a static SPA — the `dist/` folder after build is the entire deployable artefact.  
The two simplest GCP options are **Cloud Run** (containerised) and **Firebase Hosting** (CDN static).

---

### Option A — GCP Cloud Run (Docker + Nginx) ✅ Recommended

#### 1. Add `nginx.conf`
Create `nginx.conf` in the project root:

```nginx
server {
  listen 8080;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback — send all routes to index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets aggressively
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/plain text/css application/javascript application/json;
}
```

#### 2. Add `Dockerfile`
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Serve stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Add `.dockerignore`
```
node_modules
dist
.git
*.md
```

#### 4. Deploy via GitHub to Cloud Run

```bash
# One-time setup — enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Set your project
gcloud config set project YOUR_GCP_PROJECT_ID

# Build & deploy (from repo root)
gcloud run deploy ideaflow \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

# → You'll get a URL like: https://ideaflow-xxxx-uc.a.run.app
```

#### 5. CI/CD via GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ideaflow
          region: asia-south1
          source: .
```

**GitHub Secrets to add** (`Settings → Secrets → Actions`):
| Secret | Value |
|---|---|
| `GCP_SA_KEY` | JSON key of a Service Account with `Cloud Run Admin` + `Storage Admin` roles |

---

### Option B — Firebase Hosting (Simplest CDN option)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login & init
firebase login
firebase init hosting
# → Public directory: dist
# → Single-page app: Yes
# → Overwrite index.html: No

# Build and deploy
npm run build
firebase deploy --only hosting
# → https://YOUR_PROJECT.web.app
```

---

### Option C — GCP Cloud Storage + CDN (Cheapest static hosting)

```bash
# Build
npm run build

# Create bucket
gsutil mb -p YOUR_PROJECT -l ASIA-SOUTH1 gs://ideaflow-app

# Upload
gsutil -m cp -r dist/* gs://ideaflow-app

# Make public
gsutil iam ch allUsers:objectViewer gs://ideaflow-app

# Enable website serving
gsutil web set -m index.html -e index.html gs://ideaflow-app
```

Then set up a Cloud CDN Load Balancer in front of the bucket for HTTPS + custom domain.

---

## 📁 Project Structure

```
thinkcanvas/
├── public/                 # Static assets (favicon etc.)
├── src/
│   ├── components/
│   │   ├── Card.jsx        # Draggable, resizable card with rich editor
│   │   ├── RichEditor.jsx  # TipTap editor wrapper
│   │   ├── Toolbar.jsx     # Top bar: search, snap, arrows, theme toggle
│   │   ├── Sidebar.jsx     # Board navigation panel
│   │   └── ArrowLayer.jsx  # SVG canvas for curved connection arrows
│   ├── hooks/
│   │   ├── useDrag.js      # Mouse drag + resize logic (ref-stable)
│   │   └── useSave.js      # 500ms debounced auto-save hook
│   ├── utils/
│   │   ├── constants.js    # Color themes, app config, resolveTheme()
│   │   └── storage.js      # localStorage read/write + migration
│   ├── styles/
│   │   └── app.css         # Global styles + dark mode via data-theme
│   ├── App.jsx             # Root component: state, pages, canvas
│   └── main.jsx            # React entry point
├── index.html
├── vite.config.js
├── package.json
├── Dockerfile              # (add manually for Cloud Run)
├── nginx.conf              # (add manually for Cloud Run)
└── README.md
```

---

## 🔄 Migrating to a Real Backend

All persistence is isolated to `src/utils/storage.js`.  
To swap `localStorage` for a REST API, replace only these two functions:

```js
// src/utils/storage.js — backend version example
export async function loadAll() {
  const res = await fetch('/api/workspace');
  return res.json();
}

export async function saveAll(data) {
  await fetch('/api/workspace', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
```

Everything else (React state, hooks, UI) stays identical.

---

## 🔑 Environment Variables

None required for the frontend. If you add a backend:

```bash
# .env.local (never commit)
VITE_API_BASE_URL=https://api.yourbackend.com
```

Access in code: `import.meta.env.VITE_API_BASE_URL`

---

## 📝 Licence

MIT — free to use, modify, and deploy.
