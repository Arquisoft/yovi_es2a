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
    const mockFind = vi.fn(() => ({ sort: mockSort, lean: mockLean }))

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
    function Schema() {}
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

// ─── Datos de prueba ──────────────────────────────────────────────────────────

// alice: 3 victorias contra random_bot (d=1.0), 2 derrotas
const partidasAlice = [
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '2' },
    { username: 'alice', rival: 'random_bot', resultado: '2' },
]

// bob: 2 victorias contra monte_carlo_bot (d=7.0)
const partidasBob = [
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '1' },
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '1' },
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '2' },
]

// Mezcla de ambos para tests multi-usuario
const partidasMultiUsuario = [...partidasAlice, ...partidasBob]

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /ranking', () => {

    beforeEach(() => {
        findShouldThrow = false
        findResult = []
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ── Estructura de la respuesta ─────────────────────────────────────────

    it('devuelve 200 con ranking vacío si no hay partidas', async () => {
        mockFindResult([])

        const res = await request(app).get('/ranking')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('ranking')
        expect(res.body.ranking).toEqual([])
    })

    it('la respuesta tiene la estructura correcta con partidas', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('ranking')
        expect(Array.isArray(res.body.ranking)).toBe(true)
    })

    it('cada entrada del ranking tiene todos los campos esperados', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')
        const entry = res.body.ranking[0]

        expect(entry).toHaveProperty('position')
        expect(entry).toHaveProperty('username')
        expect(entry).toHaveProperty('score')
        expect(entry).toHaveProperty('totalGames')
        expect(entry).toHaveProperty('wins')
    })

    // ── Posiciones y orden ─────────────────────────────────────────────────

    it('con un solo usuario aparece en posición 1', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')

        expect(res.body.ranking).toHaveLength(1)
        expect(res.body.ranking[0].position).toBe(1)
        expect(res.body.ranking[0].username).toBe('alice')
    })

    it('ordena correctamente por puntuación descendente', async () => {
        mockFindResult(partidasMultiUsuario)

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        // bob gana contra monte_carlo (d=7) así que debe superar a alice (d=1)
        expect(ranking[0].username).toBe('bob')
        expect(ranking[1].username).toBe('alice')
        expect(ranking[0].score).toBeGreaterThan(ranking[1].score)
    })

    it('las posiciones son consecutivas empezando en 1', async () => {
        mockFindResult(partidasMultiUsuario)

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        ranking.forEach((entry, idx) => {
            expect(entry.position).toBe(idx + 1)
        })
    })
})