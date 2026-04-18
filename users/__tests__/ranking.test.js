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
})