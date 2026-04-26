import { describe, it, expect, vi, afterEach } from 'vitest';
import Hashing from '../src/hashing.js'; 
import argon2 from 'argon2';

describe('Hashing Service', () => {
  
  // Para limpiar los mocks después de cada test para que no interfieran entre sí
  afterEach(() => {
    vi.restoreAllMocks();
  });


  it('debería hashear una contraseña correctamente', async () => {
    const password = 'mi_contrasena_segura';
    const hash = await Hashing.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password)
    expect(hash).toContain('$argon2id$'); 
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


  it('debería lanzar un error si argon2.hash falla (Coverage del catch en hashPassword)', async () => {
    const password = 'mi_contrasena_segura';
    
    vi.spyOn(argon2, 'hash').mockRejectedValueOnce(new Error('Fallo simulado interno'));

    await expect(Hashing.hashPassword(password))
      .rejects
      .toThrow('Error al hashear la contraseña: Fallo simulado interno');
  });

  it('debería devolver false y no romper la app si argon2.verify falla (Coverage del catch en verifyPassword)', async () => {
    const password = 'mi_contrasena_segura';
    const fakeHash = 'un_hash_corrupto_o_invalido';

    vi.spyOn(argon2, 'verify').mockRejectedValueOnce(new Error('Hash malformado'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await Hashing.verifyPassword(fakeHash, password);
    expect(result).toBe(false);
    
    expect(consoleSpy).toHaveBeenCalledWith('Error en la verificación:', expect.any(Error));
  });

});