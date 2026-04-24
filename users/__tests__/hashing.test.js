import { describe, it, expect, vi, afterEach } from 'vitest';
import Hashing from '../src/hashing.js'; // Ajusta la ruta si es necesario
import argon2 from 'argon2';

describe('Hashing Service', () => {
  
  // Limpiamos los mocks después de cada test para que no interfieran entre sí
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── 1. RUTAS DE ÉXITO (Happy Paths) ──────────────────────────────────

  it('debería hashear una contraseña correctamente', async () => {
    const password = 'mi_contrasena_segura';
    const hash = await Hashing.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password); // El hash no debe ser la contraseña en texto plano
    expect(hash).toContain('$argon2id$'); // Verifica que usa el algoritmo correcto
  });

  it('debería devolver true al verificar la contraseña correcta', async () => {
    const password = 'mi_contrasena_segura';
    const hash = await Hashing.hashPassword(password);

    const isMatch = await Hashing.verifyPassword(hash, password);
    expect(isMatch).toBe(true);
  });

  it('debería devolver false al verificar una contraseña incorrecta', async () => {
    const password = 'mi_contrasena_segura';
    const wrongPassword = 'hacker_password';
    const hash = await Hashing.hashPassword(password);

    const isMatch = await Hashing.verifyPassword(hash, wrongPassword);
    expect(isMatch).toBe(false);
  });

  // ─── 2. RUTAS DE ERROR (Bloques Catch para el 100% de coverage) ──────

  it('debería lanzar un error si argon2.hash falla (Coverage del catch en hashPassword)', async () => {
    const password = 'mi_contrasena_segura';
    
    // Forzamos a argon2 a que lance un error falso
    vi.spyOn(argon2, 'hash').mockRejectedValueOnce(new Error('Fallo simulado interno'));

    // Esperamos que la función nuestra capture el error y lance el suyo personalizado
    await expect(Hashing.hashPassword(password))
      .rejects
      .toThrow('Error al hashear la contraseña: Fallo simulado interno');
  });

  it('debería devolver false y no romper la app si argon2.verify falla (Coverage del catch en verifyPassword)', async () => {
    const password = 'mi_contrasena_segura';
    const fakeHash = 'un_hash_corrupto_o_invalido';

    // Forzamos a argon2.verify a que lance un error (como pasaría con un hash mal formado)
    vi.spyOn(argon2, 'verify').mockRejectedValueOnce(new Error('Hash malformado'));

    // Silenciamos temporalmente el console.error para que la consola del test salga limpia
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Llamamos a la función y comprobamos que devuelve false por el catch
    const result = await Hashing.verifyPassword(fakeHash, password);
    expect(result).toBe(false);
    
    // Verificamos que pasó por el catch y pintó el error
    expect(consoleSpy).toHaveBeenCalledWith('Error en la verificación:', expect.any(Error));
  });

});