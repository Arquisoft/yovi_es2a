import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import YAML from 'js-yaml';
import promBundle from 'express-prom-bundle';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import connectDB from './src/database.js';  


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
    await User.deleteOne({ username: req.params.username });
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
  const username = req.body && req.body.username;

  try {
    //Si no hay username, devuelve error.
    if (!username) {
      return res.status(200).json({ error: "Username is required" });
    }

    //Si hay username, crea el usuario, y lo guarda
    const newUser = new User({ username });
    await newUser.save();

    //Mensaje de bienvenida
    res.status(201).json({
      message: `Hello ${username}!`,
      user: newUser
    });

  } catch (err) {
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

export default app;