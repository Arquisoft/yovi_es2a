import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import User from '../src/models/User.js'; 
import app from '../users-service.js';

vi.mock('../src/hashing.js', () => ({
    default: {
        hashPassword: vi.fn().mockResolvedValue('hashed_password'),
        verifyPassword: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('../src/models/User.js', () => {
    const MockUser = vi.fn().mockImplementation((data) => {
        return {
            ...data,
            save: vi.fn().mockResolvedValue(true)
        };
    });
    MockUser.prototype.save = vi.fn();
    return { default: MockUser };
});

describe('POST /createuser', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns a greeting message for the provided username', async () => {
        const res = await request(app)
            .post('/createuser')
            .send({ username: 'Pablo', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Pablo');
    });

    it('should return 409 if username already exists', async () => {
        vi.spyOn(User.prototype, 'save').mockRejectedValueOnce({ code: 11000 });

        const res = await request(app)
            .post('/createuser')
            .send({ username: 'repetido', password: 'password123' });

        expect(res.status).toBe(409);
    });

    it('should return 400 for any other database error', async () => {
        vi.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('DB Error'));

        const res = await request(app)
            .post('/createuser')
            .send({ username: 'test', password: 'password123' });

        expect(res.status).toBe(400);
    });
});