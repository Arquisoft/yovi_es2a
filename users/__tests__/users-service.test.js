import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import Friend from '../src/models/Friend.js'

// ─── 1. MOCKS DE DEPENDENCIAS Y BASE DE DATOS ──────────────────────────────

// Usamos vi.hoisted() para que Vitest eleve estas funciones antes que los vi.mock()
const { createChainableMock, mockSave } = vi.hoisted(() => {
    return {
        createChainableMock: (resolvedValue) => ({
            select: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            lean: vi.fn().mockResolvedValue(resolvedValue),
            then: (resolve) => resolve(resolvedValue) // ¡El truco para que funcione con o sin .lean()!
        }),
        mockSave: vi.fn().mockResolvedValue(true)
    };
});

// Mock del Hashing (evita lentitud en tests y problemas de encriptación)
vi.mock('../src/hashing.js', () => ({
    default: {
        hashPassword: vi.fn().mockResolvedValue('hashed_password'),
        verifyPassword: vi.fn().mockResolvedValue(true) 
    }
}));

// Mocks de los Modelos de MongoDB
vi.mock('../src/models/User.js', () => {
    const MockUser = function(data) { Object.assign(this, data); this.save = mockSave; };
    MockUser.findOne = vi.fn();
    MockUser.deleteOne = vi.fn();
    return { default: MockUser };
});

vi.mock('../src/models/GameRecord.js', () => {
    const MockGameRecord = function(data) { Object.assign(this, data); this.save = mockSave; };
    MockGameRecord.find = vi.fn().mockReturnValue(createChainableMock([]));
    return { default: MockGameRecord };
});

vi.mock('../src/models/Friend.js', () => {
    const MockFriend = function(data) { Object.assign(this, data); this.save = mockSave; };
    MockFriend.find = vi.fn().mockReturnValue(createChainableMock([]));
    MockFriend.deleteOne = vi.fn();
    return { default: MockFriend };
});

vi.mock('../src/models/Group.js', () => {
    const MockGroup = function(data) { Object.assign(this, data); this.save = mockSave; };
    MockGroup.find = vi.fn().mockReturnValue(createChainableMock([]));
    MockGroup.findById = vi.fn().mockReturnValue(createChainableMock(null));
    MockGroup.findOne = vi.fn().mockReturnValue(createChainableMock(null));
    MockGroup.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
    return { default: MockGroup };
});

vi.mock('../src/models/GroupMember.js', () => {
    const MockGroupMember = function(data) { Object.assign(this, data); this.save = mockSave; };
    MockGroupMember.findOne = vi.fn().mockReturnValue(createChainableMock(null));
    MockGroupMember.find = vi.fn().mockReturnValue(createChainableMock([]));
    MockGroupMember.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
    MockGroupMember.findOneAndDelete = vi.fn().mockResolvedValue({ _id: 'mock' });
    MockGroupMember.countDocuments = vi.fn().mockResolvedValue(0);
    return { default: MockGroupMember };
});

vi.mock('../src/database.js', () => ({ default: vi.fn() }));

// Importamos la app DESPUÉS de hacer los mocks
import app from '../users-service.js'
import User from '../src/models/User.js'
import GameRecord from '../src/models/GameRecord.js'
import Group from '../src/models/Group.js'          // <--- AÑADE ESTA LÍNEA
import GroupMember from '../src/models/GroupMember.js'
// ─── 2. BATERÍA DE TESTS ───────────────────────────────────────────────────

describe('Users Service Endpoints', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /createuser', () => {
        it('crea un usuario correctamente y devuelve el mensaje de bienvenida', async () => {
            const res = await request(app)
                .post('/createuser')
                .send({ username: 'iyan2', password: '123' })
                .set('Accept', 'application/json');

            expect(res.status).toBe(201);
            expect(res.body.message).toContain('Hello iyan2!');
        });

        it('falla si no se proporciona contraseña', async () => {
            const res = await request(app).post('/createuser').send({ username: 'iyan2' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('required');
        });
    });

    describe('POST /login', () => {
        it('hace login correctamente si el usuario existe', async () => {
            User.findOne.mockResolvedValueOnce({ username: 'iyan2', password: 'hashed_password' });
            
            const res = await request(app).post('/login').send({ username: 'iyan2', password: '123' });
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('Welcome back');
        });

        it('falla si el usuario no existe', async () => {
            User.findOne.mockResolvedValueOnce(null);
            
            const res = await request(app).post('/login').send({ username: 'fantasma', password: '123' });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('User not found');
        });
    });

    describe('POST /savegame', () => {
        it('guarda una partida correctamente', async () => {
            const res = await request(app)
                .post('/savegame')
                .send({ username: 'iyan2', rival: 'bot', resultado: '1', size: 7 });
            
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Game saved');
        });

        it('falla si el resultado es inválido', async () => {
            const res = await request(app)
                .post('/savegame')
                .send({ username: 'iyan2', rival: 'bot', resultado: 'X', size: 7 }); // 'X' no es válido para savegame
            
            expect(res.status).toBe(400);
            expect(res.body.error).toContain("must be '1' or '2'");
        });
    });

    describe('GET /stats/:username', () => {
        it('devuelve las estadísticas correctamente para un usuario con partidas', async () => {
            // Simulamos que la base de datos devuelve 2 partidas
            GameRecord.find.mockReturnValueOnce(createChainableMock([
                { resultado: '1', rival: 'random_bot' },
                { resultado: '2', rival: 'random_bot' }
            ]));

            const res = await request(app).get('/stats/iyan2');
            expect(res.status).toBe(200);
            expect(res.body.total).toBe(2);
            expect(res.body.wins).toBe(1);
            expect(res.body.losses).toBe(1);
            expect(res.body.winRate).toBe(50.0);
        });

        it('devuelve estadísticas a cero si no hay partidas', async () => {
            GameRecord.find.mockReturnValueOnce(createChainableMock([]));

            const res = await request(app).get('/stats/nuevo_usuario');
            expect(res.status).toBe(200);
            expect(res.body.total).toBe(0);
        });
    });

    describe('POST /creategroup', () => {
        it('crea un grupo correctamente', async () => {
            // Simulamos que el usuario existe en la BBDD
            User.findOne.mockResolvedValueOnce({ username: 'iyan2' });
            
            const res = await request(app)
                .post('/creategroup')
                .send({ name: 'Grupo Épico', description: 'El mejor grupo' })
                .set('x-user', 'iyan2'); // Simulamos el header de autenticación
            
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Group created');
        });

        it('falla si no se proporciona el header del creador', async () => {
            const res = await request(app).post('/creategroup').send({ name: 'Grupo Épico' });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('required');
        });
    });

    describe('GET /mygroups', () => {
        it('devuelve los grupos del usuario', async () => {
            GroupMember.find.mockReturnValueOnce(createChainableMock([{ groupId: 'group1', role: 'member' }]));
            Group.find.mockReturnValueOnce(createChainableMock([{ _id: 'group1', name: 'Test Group' }]));

            const res = await request(app).get('/mygroups').set('x-user', 'iyan2');
            expect(res.status).toBe(200); // Solo comprobamos que el endpoint no explota
        });

        it('falla si no se proporciona el usuario', async () => {
            const res = await request(app).get('/mygroups');
            expect(res.status).toBe(400);
        });
    });

    describe('POST /joingroup', () => {
        it('añade un usuario al grupo correctamente', async () => {
            // Mockeamos el grupo (necesita ser público), el usuario (debe existir) y que no sea miembro aún
            Group.findById.mockReturnValueOnce(createChainableMock({ _id: 'group1', isPublic: true }));
            User.findOne.mockResolvedValueOnce({ username: 'iyan2' });
            GroupMember.findOne.mockReturnValueOnce(createChainableMock(null));

            // ¡Corregido! El groupId va en la URL
            const res = await request(app).post('/joingroup/group1').set('x-user', 'iyan2');
            expect([200, 201]).toContain(res.status);
        });

        it('falla si el grupo no existe', async () => {
            Group.findById.mockReturnValueOnce(createChainableMock(null));
            
            // ¡Corregido! El groupId va en la URL
            const res = await request(app).post('/joingroup/falso').set('x-user', 'iyan2');
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /leavegroup', () => {
        it('elimina al usuario del grupo', async () => {
            GroupMember.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
            GroupMember.countDocuments.mockResolvedValueOnce(1); // Aún quedan miembros

            // ¡Corregido! Es un método .delete() y el groupId va en la URL
            const res = await request(app).delete('/leavegroup/group1').set('x-user', 'iyan2');
            expect(res.status).toBe(200);
        });
    });

    


    
});