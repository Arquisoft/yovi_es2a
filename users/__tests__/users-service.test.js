import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/models/User.js', () => {  // <-- ruta relativa al test
    const mockSave = vi.fn().mockResolvedValue(true);
    const MockUser = vi.fn().mockImplementation(() => ({ save: mockSave }));
    return { default: MockUser };
});

vi.mock('mongoose', async () => {
    return {
        default: {
            Schema: class Schema {
                constructor() {}
            },
            model: vi.fn().mockReturnValue(
                vi.fn().mockImplementation(() => ({
                    save: vi.fn().mockResolvedValue(true)
                }))
            ),
            connect: vi.fn().mockResolvedValue(true),
        }
    }
});

import app from '../users-service.js'

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
        expect(res.body.message).toContain('Pablo')
    })
})