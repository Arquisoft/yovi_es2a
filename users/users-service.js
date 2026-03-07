import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import YAML from 'js-yaml';
import promBundle from 'express-prom-bundle';
import User from './src/models/User.js';
import GameRecord from './src/models/GameRecord.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import connectDB from './src/database.js';  
import Hashing from './src/hashing.js';


//Carga las variables del .env
dotenv.config();

const app = express();
const port = 3000;

//conecta con mongoDB al arrancar el servidor
connectDB();

//Bloque condicional neceseario para los test al hacer deploy, borra los usuarios durante los test
//E2E, evitando errores de duplicado en la base de datos
if (process.env.NODE_ENV === 'test') {
  app.delete('/testing/deleteuser/:username', async (req, res) => {
    //Miramos el parámetro para evitar inyección en la query, por el aviso de SonarCloud
    const username = String(req.params.username);
    await User.deleteOne({ username: username });
    res.status(200).json({ message: 'User deleted' });
  });
}

//Añade metricas para Prometheus
const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);

//Carga la documentacion de Swagger desde el archivo openapi.yaml
try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

//Este bloque permite que el fronted pueda hacer peticiones al backend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

//Permite que el servido entienda la peticiones en formato JSON
app.use(express.json());


//ENDPOINT POST /createuser, recibe un username, lo guarda en mongoDB y responde con el mensaje de bienvenida
app.post('/createuser', async (req, res) => {
  const username = req.body.username ? String(req.body.username) : null;
  const password = req.body.password ? String(req.body.password) : null;

  try {
    //Si no hay username y/o password, devuelve error.
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    //Si hay username, crea el usuario, y lo guarda
    const hashedPassword = await Hashing.hashPassword(password);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    //Mensaje de bienvenida
    res.status(201).json({
      message: `Hello ${username}!`,
      user: { username: newUser.username }
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: `The username '${username}' is already taken. Please choose another one.` 
      });
    }
    //Si hay algun error como un usario que ya existe, responde con 400.
    res.status(400).json({ error: err.message });
  }
});

//Solo arranca el servidor si el archivo se ejecuta directamente, NO cuando lo importan los tests.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  });
}

// ENDPOINT POST /login
app.post('/login', async (req, res) => {
  const username = req.body.username ? String(req.body.username) : null;
  const password = req.body.password ? String(req.body.password) : null;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    //Buscamos al usuario en la base de datos
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // comparar la contraseña (usando bcrypt en el futuro)
    if (!(await Hashing.verifyPassword(user.password, password))) {
       return res.status(401).json({ error: "Invalid password" });
    }

    res.status(200).json({ 
      message: `Welcome back, ${username}!`, 
      user: { username: user.username } 
    });

  } catch (err) {
    console.error("Internal server error details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ENDPOINT POST /savegame
// Guarda el resultado de una partida finalizada en el historial
// Body: { username, rival, resultado }
// resultado: '1' (gana el usuario logueado), '2' (pierde), 'X' (empate)
app.post('/savegame', async (req, res) => {
  const { username, rival, resultado } = req.body ?? {};

  if (!username || !rival || !resultado) {
    return res.status(400).json({ error: 'username, rival and resultado are required' });
  }

  if (!['1', '2', 'X'].includes(resultado)) {
    return res.status(400).json({ error: "resultado must be '1', '2' or 'X'" });
  }

  try {
    const record = new GameRecord({ username, rival, resultado });
    await record.save();
    res.status(201).json({ message: 'Game saved', record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /history/:username
// Devuelve el historial de partidas de un usuario ordenado por fecha descendente
app.get('/history/:username', async (req, res) => {
  const username = String(req.params.username);

  try {
    const records = await GameRecord.find({ username })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ username, history: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;