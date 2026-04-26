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
    function Schema() {
        this.index = vi.fn();
    }
    Schema.Types = {
        ObjectId: function ObjectId() {}
    };
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


const partidasAlice = [
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '1' },
    { username: 'alice', rival: 'random_bot', resultado: '2' },
    { username: 'alice', rival: 'random_bot', resultado: '2' },
]

const partidasBob = [
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '1' },
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '1' },
    { username: 'bob', rival: 'monte_carlo_bot', resultado: '2' },
]

const partidasMultiUsuario = [...partidasAlice, ...partidasBob]


describe('GET /ranking', () => {

    beforeEach(() => {
        findShouldThrow = false
        findResult = []
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })


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

    


    it('totalGames refleja el total de partidas jugadas por el usuario', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')

        expect(res.body.ranking[0].totalGames).toBe(5)
    })

    it('wins refleja solo las victorias del usuario', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')

        expect(res.body.ranking[0].wins).toBe(3)
    })

    it('score es un número mayor que 0 si hay victorias', async () => {
        mockFindResult(partidasAlice)

        const res = await request(app).get('/ranking')

        expect(res.body.ranking[0].score).toBeGreaterThan(0)
    })

    it('un usuario con solo derrotas tiene score 0', async () => {
        mockFindResult([
            { username: 'loser', rival: 'random_bot', resultado: '2' },
            { username: 'loser', rival: 'random_bot', resultado: '2' },
        ])

        const res = await request(app).get('/ranking')

        expect(res.body.ranking[0].score).toBe(0)
    })

    


    it('victoria contra rival difícil puntúa más que contra rival fácil', async () => {
        mockFindResult([
            { username: 'charlie', rival: 'monte_carlo_bot', resultado: '1' },
            { username: 'charlie', rival: 'monte_carlo_bot', resultado: '2' },
            { username: 'dave',    rival: 'random_bot',      resultado: '1' },
            { username: 'dave',    rival: 'random_bot',      resultado: '2' },
        ])

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        const charlie = ranking.find(e => e.username === 'charlie')
        const dave    = ranking.find(e => e.username === 'dave')

        expect(charlie.score).toBeGreaterThan(dave.score)
    })

    it('rival desconocido (humano) usa el peso por defecto de 5.0', async () => {
        mockFindResult([
            { username: 'eve',   rival: 'jugador_humano', resultado: '1' },
            { username: 'eve',   rival: 'jugador_humano', resultado: '2' },
            { username: 'frank', rival: 'random_bot',     resultado: '1' },
            { username: 'frank', rival: 'random_bot',     resultado: '2' },
        ])

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        const eve   = ranking.find(e => e.username === 'eve')
        const frank = ranking.find(e => e.username === 'frank')

        expect(eve.score).toBeGreaterThan(frank.score)
    })


    it('más victorias absolutas supera a mejor eficacia cuando la diferencia es grande', async () => {
        const partidasIvan = Array.from({ length: 20 }, () =>
            ({ username: 'ivan', rival: 'random_bot', resultado: '1' })
        ).concat(Array.from({ length: 20 }, () =>
            ({ username: 'ivan', rival: 'random_bot', resultado: '2' })
        ))

        const partidasJulia = Array.from({ length: 5 }, () =>
            ({ username: 'julia', rival: 'random_bot', resultado: '1' })
        )

        mockFindResult([...partidasIvan, ...partidasJulia])

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        const ivan  = ranking.find(e => e.username === 'ivan')
        const julia = ranking.find(e => e.username === 'julia')

        expect(ivan.score).toBeGreaterThan(julia.score)
    })


    it('1 partida ganada no genera una puntuación desproporcionada', async () => {
        mockFindResult([
            { username: 'karen', rival: 'random_bot', resultado: '1' },
            ...Array.from({ length: 10 }, () =>
                ({ username: 'lee', rival: 'random_bot', resultado: '1' })
            ).concat(Array.from({ length: 2 }, () =>
                ({ username: 'lee', rival: 'random_bot', resultado: '2' })
            )),
        ])

        const res = await request(app).get('/ranking')
        const ranking = res.body.ranking

        const karen = ranking.find(e => e.username === 'karen')
        const lee   = ranking.find(e => e.username === 'lee')

        expect(lee.score).toBeGreaterThan(karen.score)
    })


    it('devuelve como máximo 10 jugadores aunque haya más', async () => {
        const muchasPartidas = Array.from({ length: 15 }, (_, i) => ({
            username: `user${i}`,
            rival: 'random_bot',
            resultado: '1',
        }))
        mockFindResult(muchasPartidas)

        const res = await request(app).get('/ranking')

        expect(res.body.ranking.length).toBeLessThanOrEqual(10)
    })

    it('devuelve 500 si la base de datos falla', async () => {
        mockFindThrows()

        const res = await request(app).get('/ranking')

        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error')
    })
})