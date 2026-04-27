# Yovi_es2a

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_es2a/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_es2a/actions/workflows/release-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es2a&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es2a)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es2a&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es2a)

<img width="1392" height="768" alt="Gemini_Generated_Image_y0yhsfy0yhsfy0yh" src="https://github.com/user-attachments/assets/e8c917e1-3aa9-4350-8129-0b815e8d988b" />
(generado por Gemini)

-----------------
Implementación web del juego de tablero Y con autenticación de usuarios, historial de partidas, estadísticas personales y monitorización en tiempo real.

---

## Equipo

- Sergio González Martínez (UO300798@uniovi.es)
- Iyán Díaz Pereda (UO300006@uniovi.es)
- Pablo Arias Fernández (UO300305@uniovi.es)
- Enol de la Calle Iglesias (UO301431@uniovi.es)
- Iyán Álvarez Casanovas (UO301299@uniovi.es)

**Curso:** Arquitectura del Software    
**Año:** 2025/2026

---

## Características

- Registro e inicio de sesión con contraseña
- Partidas locales (2 jugadores) y contra bots de IA
- 4 estrategias de bot en 3 niveles de dificultad (fácil, medio, difícil)
- Estrategia extra de dificultad extrema (monte carlo)
- Selector de tamaño de tablero (4×4 a 30×30)
- Historial de partidas por usuario con filtros por resultado, rival, fecha y tamaño
- Estadísticas personales: win rate, racha actual, mejor racha, rival favorito

---

## Arquitectura

El proyecto sigue una arquitectura basada en microservicios: cada módulo es un servicio independiente con su propia tecnología, responsabilidad y ciclo de despliegue. Docker Compose los orquesta como un sistema unificado.

    webapp/     → Frontend     (React 18 + TypeScript + Vite)
    users/      → Usuarios     (Node.js + Express + MongoDB)
    gamey/      → Motor        (Rust + Axum)
    docs/       → Documentación (Arc42, AsciiDoc)

---

## Enlaces utiles

- Aplicación: http://68.221.24.159/
- Documentación: https://arquisoft.github.io/yovi_es2a/

---

## Puesta en marcha

### Con Docker (recomendado)

    docker compose up --build

| Servicio    | URL                        |
|-------------|----------------------------|
| Aplicación  | http://localhost            |
| Usuarios    | http://localhost:3000       |
| Motor       | http://localhost:4000       |
| Swagger     | http://localhost:3000/api-docs |
| Prometheus  | http://localhost:9090       |
| Grafana     | http://localhost:9091       |


### En local

**Users:**

```bash
cd users
npm install
npm start
```
    
**Gamey:**

```bash
cd gamey
cargo run -- --mode server --port 4000
```
    
**Webapp:**

```bash
cd webapp
npm install
npm run dev
```

---

## Bots disponibles

| Estrategia   | easy | medium | hard |
|--------------|------|--------|------|
| `random_bot` | —    | —      | —    |
| `defensive`  | ✓    | ✓      | ✓    |
| `offensive`  | ✓    | ✓      | ✓    |
| `positional` | ✓    | ✓      | ✓    |
| `monte carlo` | —    | —      | —    |

- **Random** — mueve al azar
- **Defensive** — bloquea amenazas del rival antes de atacar
- **Offensive** — busca ganar creando tenedores de victoria
- **Positional** — controla el centro geométrico del tablero
- **Monte Carlo** — busca la mejor estrategia posible (dificultad máxima)

---

## Testing

**Webapp:**
```bash
cd webapp
npm test           # tests unitarios con Vitest
```

**Users:**
```bash
cd users
npm test           # tests unitarios con Vitest
```

**Gamey:**
```bash
cd gamey
cargo test
```

---

## Monitorización

El sistema incluye monitorizacion basada en Prometheus y Grafana.

Levantarlo de forma independiente:

```bash
docker compose up -d prometheus grafana
```

Grafana accesible en `http://localhost:9091` con las credenciales `admin / admin`.

---

## Tecnologías

| Capa            | Tecnologías                                      |
|-----------------|--------------------------------------------------|
| Frontend        | React, TypeScript, Vite                          |
| Backend usuarios| Node.js, Express, MongoDB, Mongoose, argon2      |
| Motor de juego  | Rust, Axum, Tokio, UUID                          |
| Base de datos   | MongoDB Atlas                                    |
| Contenedores    | Docker, Docker Compose                           |
| CI/CD           | GitHub Actions, SonarCloud                       |
| Observabilidad  | Prometheus, Grafana                              |
| Testing         | Vitest, cargo test                               |

---

## Estructura del repositorio

```
yovi_es2a/
├── webapp/                  # Frontend React
│   ├── src/
│   │   ├── components/      # GameBoard, AuthForm, EndGameOverlay
│   │   ├── hooks/           # useGame (lógica central del juego)
│   │   ├── pages/           # Lobby, Game, Historic, Stats, Login
│   │   ├── services/        # gameService.ts (llamadas HTTP)
│   │   ├── styles/          # CSS por componente
│   │   └── types/           # Tipos TypeScript de la API
│   └── Dockerfile
├── users/                   # Servicio de usuarios
│   ├── src/
│   │   ├── models/          # User.js, GameRecord.js
│   │   ├── database.js
│   │   └── hashing.js       # argon2
│   ├── monitoring/          # Configuración Prometheus y Grafana
│   ├── users-service.js     # Servidor Express con todos los endpoints
│   └── Dockerfile
├── gamey/                   # Motor del juego en Rust
│   ├── src/
│   │   ├── core/            # Lógica del tablero y condición de victoria
│   │   ├── bot/             # Implementaciones de bots
│   │   └── bot_server/      # API REST con Axum
│   └── Dockerfile
├── docs/                    # Documentación Arc42
├── docker-compose.yml
└── README.md
```
