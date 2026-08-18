import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for registration
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required.' });
    }

    // Simulate account creation / saving in memory or database
    const newUser = {
      id: `usr_${Date.now()}`,
      username,
      email,
      createdAt: new Date().toISOString(),
    };

    console.log('User registered successfully:', newUser);

    return res.status(200).json({
      success: true,
      message: 'Registration successful.',
      user: newUser,
    });
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware in dev mode vs static serve in production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YOUR ARC Server running on http://localhost:${PORT}`);
  });
}

startServer();
