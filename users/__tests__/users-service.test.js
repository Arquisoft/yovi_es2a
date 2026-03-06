import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import User from '../src/models/User.js'; 
import Hashing from '../src/hashing.js';
import app from '../users-service.js';

vi.mock('../src/models/User.js', () => {
    const mockSave = vi.fn().mockResolvedValue(true);
    function MockUser() {
        this.save = mockSave;
    }
    return { default: MockUser };
});

vi.mock('mongoose', async () => {
    function Schema() { }
    return {
        default: {
            Schema,
            model: vi.fn().mockReturnValue(function MockModel() {
                this.save = vi.fn().mockResolvedValue(true);
            }),
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
            .send({ username: 'iyan2', password: 'iyan' })
            .set('Accept', 'application/json')

        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('message')
        expect(res.body.message).toContain('iyan2')
    })

    // Test para el error 400 (Faltan datos)
    it('should return 400 if password is missing', async () => {
        const res = await request(app)
            .post('/createuser')
            .send({ username: 'solo_usuario' }); // Sin password
        expect(res.status).toBe(400);
    });

    // Test para el error 409 (Usuario duplicado)
    it('should return 409 if username already exists', async () => {
        // Simulamos que la base de datos lanza el error 11000
        vi.mocked(User.prototype.save).mockRejectedValueOnce({ code: 11000 });

        const res = await request(app)
            .post('/createuser')
            .send({ username: 'repetido', password: 'password123' });
        expect(res.status).toBe(409);
    });

    it('should return 400 for any other database error', async () => {
    vi.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('DB connection failed'));
    
    const res = await request(app)
        .post('/createuser')
        .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(400);
});
})