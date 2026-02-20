import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import YAML from 'js-yaml';
import promBundle from 'express-prom-bundle';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3000;

if (process.env.NODE_ENV === 'test') {
  app.delete('/testing/deleteuser/:username', async (req, res) => {
    await User.deleteOne({ username: req.params.username });
    res.status(200).json({ message: 'User deleted' });
  });
}

const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.post('/createuser', async (req, res) => {
  const username = req.body && req.body.username;

  try {
    if (!username) {
      return res.status(200).json({ error: "Username is required" });
    }

    const newUser = new User({ username });
    await newUser.save();

    res.status(201).json({
      message: `Hello ${username}!`,
      user: newUser
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ESM equivalent of require.main === module
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  });
}

export default app;