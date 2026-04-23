import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'

let findResult = []
let findShouldThrow = false

function mockFindResult(data) { findResult = data }
function mockFindThrows()     { findShouldThrow = true }

vi.mock('../src/models/GameRecord.js', () => {
    const mockLean = vi.fn(async () => {
        if (findShouldThrow) throw new Error('DB error')
        return findResult
    })
    const mockSort = vi.fn(() => ({ lean: mockLean }))
    const mockFind = vi.fn(() => ({ sort: mockSort }))

    function MockGameRecord(data) {
        Object.assign(this, data)
        this.save = vi.fn(async () => true)
    }
    MockGameRecord.find = mockFind

    return { default: MockGameRecord }
})

vi.mock('../src/models/User.js', () => {
    function MockUser() { this.save = vi.fn().mockResolvedValue(true) }
    return { default: MockUser }
})

vi.mock('mongoose', async () => {
    function Schema() {
        this.index = vi.fn();
    }
    return {
        default: {
            Schema,
            model: vi.fn().mockReturnValue(function MockModel() {
                this.save = vi.fn().mockResolvedValue(true)
            }),
            connect: vi.fn().mockResolvedValue(true),
        }
    }
})

import app from '../users-service.js'

const partidasVariadas = [
    { username: 'alice', rival: 'random_bot',    resultado: '1' },
    { username: 'alice', rival: 'random_bot',    resultado: '1' },
    { username: 'alice', rival: 'defensive_easy', resultado: '2' },
    { username: 'alice', rival: 'random_bot',    resultado: '1' },
    { username: 'alice', rival: 'offensive_hard', resultado: '2' },
]

describe('GET /stats/:username', () => {

    beforeEach(() => {
        findShouldThrow = false
        findResult = []
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('devuelve 200 con ceros si el usuario no tiene partidas', async () => {
        mockFindResult([])

        const res = await request(app).get('/stats/alice')

        expect(res.status).toBe(200)
        expect(res.body.username).toBe('alice')
        expect(res.body.total).toBe(0)
        expect(res.body.wins).toBe(0)
        expect(res.body.losses).toBe(0)
        expect(res.body.winRate).toBe(0)
        expect(res.body.currentStreak).toBe(0)
        expect(res.body.bestStreak).toBe(0)
        expect(res.body.mostPlayedRival).toBeNull()
        expect(res.body.rivalStats).toEqual({})
    })

    it('la respuesta siempre incluye todos los campos esperados', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('username')
        expect(res.body).toHaveProperty('total')
        expect(res.body).toHaveProperty('wins')
        expect(res.body).toHaveProperty('losses')
        expect(res.body).toHaveProperty('winRate')
        expect(res.body).toHaveProperty('currentStreak')
        expect(res.body).toHaveProperty('bestStreak')
        expect(res.body).toHaveProperty('mostPlayedRival')
        expect(res.body).toHaveProperty('rivalStats')
    })

    // ── Cálculo de totales ─────────────────────────────────────────────────

    it('cuenta correctamente el total de partidas', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.body.total).toBe(5)
    })

    it('cuenta correctamente victorias y derrotas', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.body.wins).toBe(3)
        expect(res.body.losses).toBe(2)
    })

    it('calcula correctamente el winRate con un decimal', async () => {
        // 3 victorias de 5 partidas = 60%
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.body.winRate).toBe(60)
    })

    it('devuelve winRate 100 si todas las partidas son victorias', async () => {
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.winRate).toBe(100)
    })

    it('devuelve winRate 0 si todas las partidas son derrotas', async () => {
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '2' },
            { username: 'alice', rival: 'random_bot', resultado: '2' },
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.winRate).toBe(0)
    })

    

    // ── Rachas ────────────────────────────────────────────────────────────

    it('calcula la racha actual correctamente cuando arranca con victorias', async () => {
        // find() devuelve ordenado desc (más reciente primero)
        // Las 2 primeras son victorias -> racha actual = 2
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '2' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.currentStreak).toBe(2)
    })

    it('la racha actual es 0 si la última partida es una derrota', async () => {
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '2' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.currentStreak).toBe(0)
    })

    it('calcula la mejor racha histórica correctamente', async () => {
        // En orden cronológico: V V V D V -> mejor racha = 3
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '1' }, // más reciente
            { username: 'alice', rival: 'random_bot', resultado: '2' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' }, // más antigua
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.bestStreak).toBe(3)
    })

    it('la mejor racha coincide con la actual si todas son victorias', async () => {
        mockFindResult([
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
            { username: 'alice', rival: 'random_bot', resultado: '1' },
        ])

        const res = await request(app).get('/stats/alice')

        expect(res.body.currentStreak).toBe(3)
        expect(res.body.bestStreak).toBe(3)
    })

    

    // ── Estadísticas por rival ─────────────────────────────────────────────

    it('identifica correctamente el rival más jugado', async () => {
        // random_bot aparece 3 veces, los demás 1 vez
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.body.mostPlayedRival).toBe('random_bot')
    })

    it('rivalStats contiene entradas para cada rival distinto', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')

        expect(res.body.rivalStats).toHaveProperty('random_bot')
        expect(res.body.rivalStats).toHaveProperty('defensive_easy')
        expect(res.body.rivalStats).toHaveProperty('offensive_hard')
    })

    it('rivalStats refleja correctamente victorias y derrotas por rival', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')
        const rb = res.body.rivalStats['random_bot']

        // random_bot: 3 partidas, 3 victorias
        expect(rb.total).toBe(3)
        expect(rb.wins).toBe(3)
        expect(rb.losses).toBe(0)
    })

    it('rivalStats de un rival con derrota es correcto', async () => {
        mockFindResult(partidasVariadas)

        const res = await request(app).get('/stats/alice')
        const de = res.body.rivalStats['defensive_easy']

        expect(de.total).toBe(1)
        expect(de.wins).toBe(0)
        expect(de.losses).toBe(1)
    })

    
    // ── Errores ───────────────────────────────────────────────────────────

    it('devuelve 500 si la base de datos falla', async () => {
        mockFindThrows()

        const res = await request(app).get('/stats/alice')

        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error')
    })
})