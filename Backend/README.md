# Saaluvesa API

Copy `.env.example` to `.env`, add MySQL and SMTP credentials, then run `npm install`, `npm run db:sync`, and `npm run dev`.

This service exposes the public catalogue/contact endpoints and the protected Admin Panel endpoints. `db:sync` uses Sequelize's development sync/alter mode. Before production, replace it with versioned migrations generated from the models. Swagger UI is served at `/api/docs`.

## Webuzo deployment

- Upload this directory as the Node.js application's application root. Keep `package.json`, `package-lock.json`, `server.js`, `app.js`, `src/`, and the writable `uploads/` directory together.
- Set the Node.js application startup file to `server.js`, select the Node version supported by the app's dependencies, run `npm install` from this directory, then restart the application.
- Set production environment values in Webuzo's Node.js application settings or in this directory's `.env`. Do not upload `.env` in a public archive. Set `CORS_ORIGIN=https://saaluvesa.com,https://saaluvesadashboard.saaluvesa.com`; no trailing slashes. `CLIENT_ORIGIN` is only a fallback for older deployments.
- Configure the app's port as provided by Webuzo (the service also defaults to `30008`). Point `https://saaluvesaapi.saaluvesa.com` at this Node.js application.
- Preserve `uploads/` across deployments and grant the Node process write access. The database must already be created and accessible with the configured credentials.
- Check `/health` after restart; it returns HTTP 200 when the database is connected.

`Backend-Webzo-Upload.zip` contains a `Backend/` directory at its root. Extract
that directory as the Node.js application's application root, or upload the
contents of `Backend/` if Webuzo expects the application root itself. The archive
excludes `.env`, `node_modules/`, and `uploads/`; configure the environment on the
server and preserve existing uploads when updating the application.
