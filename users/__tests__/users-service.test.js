import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import app from '../users-service.js'
import User from '../src/models/User.js' 

vi.mock('../src/models/User.js', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            save: vi.fn().mockResolvedValue(true) 
        }))
    }
})

describe('POST /createuser', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns a greeting message for the provided username', async () => {
        const res = await request(app)
            .post('/createuser')
            .send({ username: 'Pablo' })
            .set('Accept', 'application/json')

        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('message')
        expect(res.body.message).toContain('Pablo!')
    })
})