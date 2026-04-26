import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import request from 'supertest'


let findResult = []

function mockFindResult(data) {
    findResult = data
}

let findShouldThrow = false
function mockFindThrows() {
    findShouldThrow = true
}

vi.mock('../src/models/GameRecord.js', () => {
    const mockLean = vi.fn(async () => {
        if (findShouldThrow) throw new Error('DB error')
        return findResult
    })
    const mockSort = vi.fn(() => ({ lean: mockLean }))
    const mockFind = vi.fn(() => ({ sort: mockSort }))

    let savedRecord = null
    function MockGameRecord(data) {
        Object.assign(this, data)
        savedRecord = this
        this.save = vi.fn(async () => {
            if (findShouldThrow) throw new Error('DB error')
            return true
        })
    }
    MockGameRecord.find = mockFind
    MockGameRecord._getSaved = () => savedRecord

    return { default: MockGameRecord }
})

vi.mock('../src/models/User.js', () => {
    function MockUser() {
        this.save = vi.fn().mockResolvedValue(true)
    }
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


describe('POST /savegame', () => {
    beforeEach(() => {
        findShouldThrow = false
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('guarda una partida correctamente y devuelve 201', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', rival: 'random_bot', resultado: '1', size: 7 })
            .set('Accept', 'application/json')

        expect(res.status).toBe(201)
        expect(res.body.message).toBe('Game saved')
    })

    it('devuelve 400 si falta el campo username', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ rival: 'random_bot', resultado: '1' })

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/required/)
    })

    it('devuelve 400 si falta el campo rival', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', resultado: '1' })

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/required/)
    })

    it('devuelve 400 si falta el campo resultado', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', rival: 'random_bot' })

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/required/)
    })

    it('devuelve 400 si resultado no es 1 ni 2', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', rival: 'random_bot', resultado: 'X' })

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/resultado must be/)
    })

    it('devuelve 400 si resultado es un valor inventado', async () => {
        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', rival: 'random_bot', resultado: 'win' })

        expect(res.status).toBe(400)
    })

    it('devuelve 500 si la base de datos falla al guardar', async () => {
        findShouldThrow = true

        const res = await request(app)
            .post('/savegame')
            .send({ username: 'alice', rival: 'random_bot', resultado: '1', size: 7 })

        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error')
    })
})



describe('GET /history/:username', () => {
    const partidas = [
        { username: 'alice', rival: 'random_bot',  resultado: '1', size: 7,  createdAt: new Date('2024-03-10') },
        { username: 'alice', rival: 'smart_bot',   resultado: '2', size: 9,  createdAt: new Date('2024-03-08') },
        { username: 'alice', rival: 'random_bot',  resultado: '1', size: 7,  createdAt: new Date('2024-03-05') },
        { username: 'alice', rival: 'invitado',    resultado: '2', size: 11, createdAt: new Date('2024-02-20') },
    ]

    beforeEach(() => {
        findShouldThrow = false
        mockFindResult(partidas)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })


    it('devuelve 200 y el historial completo del usuario', async () => {
        const res = await request(app).get('/history/alice')

        expect(res.status).toBe(200)
        expect(res.body.username).toBe('alice')
        expect(res.body.history).toHaveLength(4)
    })

    it('devuelve un array vacío si el usuario no tiene partidas', async () => {
        mockFindResult([])

        const res = await request(app).get('/history/sinpartidas')

        expect(res.status).toBe(200)
        expect(res.body.history).toEqual([])
    })

    it('la respuesta incluye siempre los campos username e history', async () => {
        const res = await request(app).get('/history/alice')

        expect(res.body).toHaveProperty('username')
        expect(res.body).toHaveProperty('history')
        expect(Array.isArray(res.body.history)).toBe(true)
    })


    it('acepta resultado=1 como filtro válido', async () => {
        mockFindResult(partidas.filter(p => p.resultado === '1'))

        const res = await request(app).get('/history/alice?resultado=1')

        expect(res.status).toBe(200)
        res.body.history.forEach(p => expect(p.resultado).toBe('1'))
    })

    it('acepta resultado=2 como filtro válido', async () => {
        mockFindResult(partidas.filter(p => p.resultado === '2'))

        const res = await request(app).get('/history/alice?resultado=2')

        expect(res.status).toBe(200)
        res.body.history.forEach(p => expect(p.resultado).toBe('2'))
    })

    it('acepta resultado=X como filtro válido (aunque el modelo no lo usa aún)', async () => {
        mockFindResult([])

        const res = await request(app).get('/history/alice?resultado=X')

        expect(res.status).toBe(200)
    })

    it('devuelve 400 si resultado tiene un valor no permitido', async () => {
        const res = await request(app).get('/history/alice?resultado=win')

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/resultado must be/)
    })

    it('devuelve 400 si resultado es un número fuera del rango permitido', async () => {
        const res = await request(app).get('/history/alice?resultado=3')

        expect(res.status).toBe(400)
    })


    it('filtra por nombre de rival (mock devuelve solo las coincidencias)', async () => {
        mockFindResult(partidas.filter(p => p.rival.includes('random_bot')))

        const res = await request(app).get('/history/alice?rival=random_bot')

        expect(res.status).toBe(200)
        res.body.history.forEach(p => expect(p.rival).toContain('random_bot'))
    })

    it('acepta rival como búsqueda parcial sin error', async () => {
        mockFindResult(partidas.filter(p => p.rival.includes('bot')))

        const res = await request(app).get('/history/alice?rival=bot')

        expect(res.status).toBe(200)
    })


    it('filtra por tamaño de tablero', async () => {
        mockFindResult(partidas.filter(p => p.size === 7))

        const res = await request(app).get('/history/alice?size=7')

        expect(res.status).toBe(200)
        res.body.history.forEach(p => expect(p.size).toBe(7))
    })

    it('devuelve 400 si size no es un número', async () => {
        const res = await request(app).get('/history/alice?size=grande')

        expect(res.status).toBe(400)
        expect(res.body.error).toMatch(/size must be a number/)
    })


    it('acepta fechaDesde sin error', async () => {
        mockFindResult(partidas.filter(p => p.createdAt >= new Date('2024-03-01')))

        const res = await request(app).get('/history/alice?fechaDesde=2024-03-01')

        expect(res.status).toBe(200)
    })

    it('acepta fechaHasta sin error', async () => {
        mockFindResult(partidas.filter(p => p.createdAt <= new Date('2024-03-09')))

        const res = await request(app).get('/history/alice?fechaHasta=2024-03-09')

        expect(res.status).toBe(200)
    })

    it('acepta rango fechaDesde + fechaHasta sin error', async () => {
        mockFindResult(partidas.filter(p =>
            p.createdAt >= new Date('2024-03-01') &&
            p.createdAt <= new Date('2024-03-10')
        ))

        const res = await request(app)
            .get('/history/alice?fechaDesde=2024-03-01&fechaHasta=2024-03-10')

        expect(res.status).toBe(200)
    })


    it('combina filtros resultado + rival sin error', async () => {
        mockFindResult(partidas.filter(p => p.resultado === '1' && p.rival === 'random_bot'))

        const res = await request(app)
            .get('/history/alice?resultado=1&rival=random_bot')

        expect(res.status).toBe(200)
        res.body.history.forEach(p => {
            expect(p.resultado).toBe('1')
            expect(p.rival).toBe('random_bot')
        })
    })

    it('combina resultado + size + fecha sin error', async () => {
        mockFindResult([])

        const res = await request(app)
            .get('/history/alice?resultado=1&size=7&fechaDesde=2024-01-01')

        expect(res.status).toBe(200)
    })


    it('devuelve 500 si la base de datos falla', async () => {
        mockFindThrows()

        const res = await request(app).get('/history/alice')

        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error')
    })
})