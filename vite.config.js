import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/users.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-database-api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/users', async (req, res, next) => {
          try {
            let body = {};
            if (req.method === 'POST') {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const raw = Buffer.concat(buffers).toString();
              if (raw) {
                try { body = JSON.parse(raw); } catch { body = raw; }
              }
            }

            const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const query = Object.fromEntries(urlObj.searchParams.entries());

            const simulatedReq = {
              method: req.method,
              headers: req.headers,
              query,
              body
            };

            const simulatedRes = {
              setHeader: (k, v) => res.setHeader(k, v),
              status: (code) => {
                res.statusCode = code;
                return {
                  json: (payload) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(payload));
                  },
                  end: () => res.end()
                };
              }
            };

            await handler(simulatedReq, simulatedRes);
          } catch (err) {
            console.error('Local API middleware error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      }
    }
  ],
  build: {
    outDir: 'dist'
  }
});
