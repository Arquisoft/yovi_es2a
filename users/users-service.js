import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import YAML from 'js-yaml';
import promBundle from 'express-prom-bundle';
import User from './src/models/User.js';
import GameRecord from './src/models/GameRecord.js';
import Friend from './src/models/Friend.js';
import Group from './src/models/Group.js';
import GroupMember from './src/models/GroupMember.js';
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
// Se poría cambiar endpoint para que sea + seguro, ahora se puede borrar de todo
  app.delete('/testing/deleteuser/:username', async (req, res) => {
    //Miramos el parámetro para evitar inyección en la query, por el aviso de SonarCloud
    const username = String(req.params.username);
    await User.deleteOne({ username: username });
    res.status(200).json({ message: 'User deleted' });
  });
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-User');
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
// Body: { username, rival, resultado, size }
// resultado: '1' (gana el usuario logueado), '2' (pierde), 'X' (empate)
app.post('/savegame', async (req, res) => {
  const { username, rival, resultado, size } = req.body ?? {};

  if (!username || !rival || !resultado) {
    return res.status(400).json({ error: 'username, rival and resultado are required' });
  }

  if (!['1', '2'].includes(resultado)) {
    return res.status(400).json({ error: "resultado must be '1' or '2'" });
  }

  try {
    const record = new GameRecord({ username, rival, resultado, size});
    await record.save();
    res.status(201).json({ message: 'Game saved', record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /history/:username
// Devuelve el historial de partidas de un usuario ordenado por fecha descendente
// Query params opcionales:
//   resultado:  '1' | '2' | 'X'
//   rival:      string (parcial, insensible a mayúsculas)
//   fechaDesde: string (ISO date: YYYY-MM-DD)
//   fechaHasta: string (ISO date: YYYY-MM-DD)
//   size:       number
app.get('/history/:username', async (req, res) => {
  const username = String(req.params.username);
  const { resultado, rival, fechaDesde, fechaHasta, size } = req.query;
 
  if (resultado && !['1', '2', 'X'].includes(resultado)) {
    return res.status(400).json({ error: "resultado must be '1', '2' or 'X'" });
  }
  if (size && isNaN(Number(size))) {
    return res.status(400).json({ error: "size must be a number" });
  }
 
  try {
    const filter = { username: String(username) };
    if (resultado)  filter.resultado = String(resultado);
    if (rival)      filter.rival = { $regex: String(rival).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (size)       filter.size = Number(size);

    if (fechaDesde || fechaHasta) {
      filter.createdAt = {};
      if (fechaDesde) filter.createdAt.$gte = new Date(String(fechaDesde));
      if (fechaHasta) {
        const hasta = new Date(String(fechaHasta));
        hasta.setDate(hasta.getDate() + 1);
        filter.createdAt.$lt = hasta;
      }
    }

    const records = await GameRecord.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ username, history: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /stats/:username
app.get('/stats/:username', async (req, res) => {
  const username = String(req.params.username);

  try {
    const records = await GameRecord.find({ username }).sort({ createdAt: -1 }).lean();

    const total = records.length;
    if (total === 0) {
      return res.status(200).json({
        username, total: 0, wins: 0, losses: 0,
        winRate: 0, currentStreak: 0, bestStreak: 0,
        mostPlayedRival: null, rivalStats: {}
      });
    }

    const wins   = records.filter(r => r.resultado === '1').length;
    const losses = records.filter(r => r.resultado === '2').length;
    const winRate = Math.round((wins / total) * 1000) / 10;

    // Racha actual
    let currentStreak = 0;
    for (const r of records) {
      if (r.resultado === '1') currentStreak++;
      else break;
    }

    // Mejor racha histórica
    let bestStreak = 0;
    let streak = 0;
    for (const r of [...records].reverse()) {
      if (r.resultado === '1') { streak++; if (streak > bestStreak) bestStreak = streak; }
      else streak = 0;
    }

    // Estadísticas por rival
    const rivalMap = {};
    for (const r of records) {
      if (!rivalMap[r.rival]) rivalMap[r.rival] = { wins: 0, losses: 0, total: 0 };
      rivalMap[r.rival].total++;
      if (r.resultado === '1') rivalMap[r.rival].wins++;
      else                     rivalMap[r.rival].losses++;
    }

    const mostPlayedRival = Object.entries(rivalMap)
      .sort((a, b) => b[1].total - a[1].total)[0][0];

    res.status(200).json({
      username, total, wins, losses, winRate,
      currentStreak, bestStreak, mostPlayedRival, rivalStats: rivalMap
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PESOS DE DIFICULTAD para la fórmula de ranking ───────────────────────
// Score(j) = Σ d(i) · W(V_i, N_i)
// W(V,N)   = (V/N) · C(N)
// C(N)     = 1 − exp(−N / K)    [K=10: ~30 partidas para confianza plena]
const RIVAL_WEIGHTS = {
  random_bot:        1.0,
  offensive_easy:    1.5,
  defensive_easy:    1.5,
  positional_easy:   1.5,
  offensive_medium:  2.5,
  defensive_medium:  2.5,
  positional_medium: 2.5,
  offensive_hard:    4.0,
  defensive_hard:    4.0,
  positional_hard:   4.0,
  monte_carlo_bot:   7.0,
};
const HUMAN_WEIGHT = 5.0;
const K = 10;

function difficultyWeight(rival) {
  return RIVAL_WEIGHTS[rival] ?? HUMAN_WEIGHT;
}

function confidenceFactor(n) {
  return 1 - Math.exp(-n / K);
}

function calcScore(rivalStats) {
  let score = 0;
  for (const [rival, s] of Object.entries(rivalStats)) {
    if (s.total === 0) continue;
    const winRate = s.wins / s.total;
    const confidence = confidenceFactor(s.total);
    // Victorias absolutas como factor dominante,
    // eficacia como bonus significativo pero no principal (α = 1.0),
    // confianza estadística para penalizar muestras pequeñas.
    score += difficultyWeight(rival) * s.wins * confidence * (1 + winRate);
  }
  return Math.round(score * 100) / 100;
}

// ENDPOINT GET /ranking
// Devuelve el top 10 de jugadores ordenados por puntuación de ranking.
app.get('/ranking', async (req, res) => {
  try {
    const allRecords = await GameRecord.find({}).lean();

    // Agrupar por usuario y construir rivalStats para cada uno
    const userMap = {};
    for (const r of allRecords) {
      if (!userMap[r.username]) userMap[r.username] = {};
      const rm = userMap[r.username];
      if (!rm[r.rival]) rm[r.rival] = { wins: 0, losses: 0, total: 0 };
      rm[r.rival].total++;
      if (r.resultado === '1') rm[r.rival].wins++;
      else                     rm[r.rival].losses++;
    }

    // Calcular puntuación y construir ranking
    const ranking = Object.entries(userMap)
      .map(([username, rivalStats]) => ({
        username,
        score: calcScore(rivalStats),
        totalGames: Object.values(rivalStats).reduce((s, v) => s + v.total, 0),
        wins: Object.values(rivalStats).reduce((s, v) => s + v.wins, 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, position: idx + 1 }));

    res.status(200).json({ ranking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FRIENDS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// ENDPOINT GET /user/:username
// Devuelve datos públicos de un usuario (username, estadísticas resumidas)
app.get('/user/:username', async (req, res) => {
  const username = String(req.params.username);

  try {
    const user = await User.findOne({ username }).select('username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Obtener estadísticas resumidas
    const records = await GameRecord.find({ username }).lean();
    const total = records.length;
    const wins = records.filter(r => r.resultado === '1').length;
    const losses = records.filter(r => r.resultado === '2').length;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;

    res.status(200).json({
      username,
      stats: { total, wins, losses, winRate }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT POST /addfriend/:friendUsername
// Agrega un amigo al usuario actual (usa username del header X-User)
app.post('/addfriend/:friendUsername', async (req, res) => {
  const currentUser = req.headers['x-user'] ? String(req.headers['x-user']) : null;
  const friendUsername = req.params.friendUsername ? String(req.params.friendUsername) : null;

  if (!currentUser || !friendUsername) {
    return res.status(400).json({ error: 'Current user and friend username are required' });
  }

  if (currentUser === friendUsername) {
    return res.status(400).json({ error: 'Cannot add yourself as a friend' });
  }

  try {
    // Verificar que ambos usuarios existan
    const [current, friend] = await Promise.all([
      User.findOne({ username: currentUser }),
      User.findOne({ username: friendUsername })
    ]);

    if (!current || !friend) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Crear relación de amistad
    const friendRecord = new Friend({ from: currentUser, to: friendUsername });
    await friendRecord.save();

    res.status(201).json({ message: 'Friend added', friend: friendRecord });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already friends with this user' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT DELETE /removefriend/:friendUsername
// Remueve un amigo del usuario actual
app.delete('/removefriend/:friendUsername', async (req, res) => {
  const currentUser = req.headers['x-user'] ? String(req.headers['x-user']) : null;
  const friendUsername = req.params.friendUsername ? String(req.params.friendUsername) : null;

  if (!currentUser || !friendUsername) {
    return res.status(400).json({ error: 'Current user and friend username are required' });
  }

  try {
    const result = await Friend.deleteOne({ from: currentUser, to: friendUsername });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    res.status(200).json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /friends/:username
// Devuelve la lista de amigos de un usuario
app.get('/friends/:username', async (req, res) => {
  const username = String(req.params.username);

  try {
    const friendships = await Friend.find({ from: username }).lean();
    const friendUsernames = friendships.map(f => f.to);
    
    // Obtener datos públicos de cada amigo
    const friends = [];
    for (const friendUsername of friendUsernames) {
      const user = await User.findOne({ username: friendUsername }).select('username');
      if (user) {
        const records = await GameRecord.find({ username: friendUsername }).lean();
        const total = records.length;
        const wins = records.filter(r => r.resultado === '1').length;
        const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
        
        friends.push({
          username: friendUsername,
          stats: { total, wins, winRate }
        });
      }
    }

    res.status(200).json({ username, friends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// ENDPOINT GET /groups
// Devuelve lista de todos los grupos públicos
app.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find({ isPublic: true })
      .select('_id name description createdBy createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT POST /creategroup
// Crea un nuevo grupo (el creador se añade automáticamente como admin)
app.post('/creategroup', async (req, res) => {
  const { name, description } = req.body ?? {};
  const createdBy = req.headers['x-user'] ? String(req.headers['x-user']) : null;

  if (!name || !createdBy) {
    return res.status(400).json({ error: 'Group name and creator are required' });
  }

  try {
    // Verificar que el usuario existe
    const user = await User.findOne({ username: createdBy });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const group = new Group({
      name: String(name),
      description: description ? String(description) : '',
      createdBy,
      isPublic: true
    });
    await group.save();

    // Agregar creador como admin
    const member = new GroupMember({
      groupId: group._id,
      username: createdBy,
      role: 'admin'
    });
    await member.save();

    res.status(201).json({
      message: 'Group created',
      group: { _id: group._id, name: group.name, description: group.description }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /group/:groupId
// Devuelve detalles de un grupo y sus miembros
app.get('/group/:groupId', async (req, res) => {
  const groupId = req.params.groupId;

  try {
    const group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await GroupMember.find({ groupId })
      .select('username role')
      .lean();

    res.status(200).json({
      group,
      members
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT POST /joingroup/:groupId
// Un usuario se une a un grupo público
app.post('/joingroup/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const username = req.headers['x-user'] ? String(req.headers['x-user']) : null;

  if (!username) {
    return res.status(400).json({ error: 'User is required' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.isPublic) {
      return res.status(403).json({ error: 'Cannot join private groups' });
    }

    // Verificar que el usuario existe
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Crear membresía
    const member = new GroupMember({
      groupId,
      username,
      role: 'member'
    });
    await member.save();

    res.status(201).json({ message: 'Joined group', member });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already a member of this group' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT DELETE /leavegroup/:groupId
// Un usuario sale de un grupo
app.delete('/leavegroup/:groupId', async (req, res) => {
  const groupId = req.params.groupId;
  const username = req.headers['x-user'] ? String(req.headers['x-user']) : null;

  if (!username) {
    return res.status(400).json({ error: 'User is required' });
  }

  try {
    const result = await GroupMember.deleteOne({ groupId, username });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }
    res.status(200).json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT GET /mygroups
// Devuelve los grupos del usuario actual
app.get('/mygroups', async (req, res) => {
  const username = req.headers['x-user'] ? String(req.headers['x-user']) : null;

  if (!username) {
    return res.status(400).json({ error: 'User is required' });
  }

  try {
    const memberships = await GroupMember.find({ username })
      .select('groupId role')
      .lean();

    const groupIds = memberships.map(m => m.groupId);
    const groups = await Group.find({ _id: { $in: groupIds } })
      .select('_id name description createdBy createdAt')
      .lean();

    // Enriquecer con role
    const enriched = groups.map(g => {
      const membership = memberships.find(m => String(m.groupId) === String(g._id));
      return { ...g, role: membership?.role };
    });

    res.status(200).json({ groups: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;