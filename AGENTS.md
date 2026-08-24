# Sundae Run Instructions

Read the relevant file under `specs/` before changing behavior. The repository contains a static web app at the root and a separate mobile application under `mobile-src/`.

- Preserve compatibility with the existing static hosting files (`index.html`, `manifest.json`, `sw.js`, and `_config.yml`).
- Treat database migrations as append-only history; do not rewrite an applied migration without explicit approval.
- Do not commit credentials, local environment files, or generated build output.
- Validate the surface you changed: smoke-test the static app in a browser, or use the mobile package scripts from `mobile-src/`.

