# Deploying a Node.js app to Render

This walks through what makes a Node.js app deployable on Render, and the exact steps/settings used to deploy this project.

## 1. What makes a Node.js app "Render-ready"

These are requirements in your code/repo — true for any host, not just Render:

1. **A `start` script in `package.json`.** Render runs `npm start` by default.
   ```json
   "scripts": { "start": "node server.js" }
   ```

2. **The server listens on `process.env.PORT`, not a hardcoded port.** Render assigns the port dynamically and tells your app which one via this env var — hardcoding `3000` means Render can't route traffic to you.
   ```js
   const PORT = process.env.PORT || 3000;
   server.listen(PORT, ...);
   ```
   (the `|| 3000` fallback is just so it still works when you run it locally)

3. **The server binds to all network interfaces**, which is Node's default when you don't pass a host to `.listen()`. Don't pass `'localhost'` or `'127.0.0.1'` explicitly, or Render's proxy can't reach it.

4. **Every dependency is declared in `package.json`**, not just installed locally. Render clones your repo fresh and runs `npm install` — anything not listed there won't exist on the server.

5. **Code is pushed to a Git repo** (GitHub, GitLab, or Bitbucket). Render deploys by watching a connected repo, not by uploading files directly.

6. **`node_modules` is excluded via `.gitignore`.** Render installs dependencies itself from `package.json`; committing `node_modules` just bloats the repo and isn't needed.

## 2. Push the code to GitHub

Render deploys from a Git repo it can watch, so the code needs to be on GitHub (or GitLab/Bitbucket) first:

```bash
git add -A
git commit -m "Ready for deploy"
git push
```

## 3. Create the Web Service on Render

1. Sign in at [render.com](https://render.com) (or create an account) and connect your GitHub account if you haven't already.
2. Click **New +** → **Web Service**.
3. Select the GitHub repo for this project. If it's not listed, use the "Configure account" link to grant Render access to it.
4. Fill in the service settings (see table below).
5. Click **Create Web Service**. Render clones the repo, runs the build command, then the start command, and assigns a public URL.
6. Watch the **Logs** tab during the first deploy — you're looking for your server's own startup log line (e.g. `Listening on http://localhost:10000`) followed by Render's `Your service is live 🎉`.

## 4. Settings reference

| Setting | Value | Notes |
|---|---|---|
| Name | anything, e.g. `socketio-chat-demo` | Becomes part of the auto-generated URL |
| Region | closest to your users | Doesn't matter much for a small/classroom app |
| Branch | `main` | Which branch Render deploys from |
| **Root Directory** | leave blank (or `.`) | This is the setting people often forget/misremember — it's "where in the repo is the app," and since this app's `package.json` is at the repo's top level, it stays blank/default. Only set this to a subfolder path if your app lives inside one (e.g. a monorepo with `server/package.json`) |
| Runtime | Node | Usually auto-detected from `package.json` |
| Build Command | `npm install` | Installs dependencies from `package.json` |
| Start Command | `npm start` (or `node server.js`) | Whatever actually starts your server |
| Instance Type | Free (or a paid tier) | Free tier has real limitations — see below |
| Auto-Deploy | On (default) | Every push to the selected branch triggers a new deploy automatically — no manual redeploy step needed |
| Environment Variables | `CLASS_PASSCODE=<your passcode>` | Required — this app won't start without it. Render sets `PORT` for you automatically; `CLASS_PASSCODE` is the one thing you add yourself, under the service's **Environment** tab. Never put the real value in the repo — see `.env.example` |

## 5. Notes specific to the free tier

- **Ephemeral filesystem** — anything written to disk (or kept only in memory, like this app's in-memory chat history) is lost whenever the service restarts.
- **Spins down after inactivity** — the first request after a period of no traffic takes a few seconds while Render wakes the instance back up.
- **WebSockets are supported natively**, on all plans including free — that's not true of every host (e.g. Vercel's serverless functions don't support long-lived WebSocket connections), which matters for a Socket.IO app specifically.
