import argon2 from 'argon2';

class Hashing {
  // Función para hashear la contraseña
  static async hashPassword(password) {
    try {
      // argon2 gestiona el salt automáticamente y lo incluye en el string resultante
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,       // Iteraciones
        parallelism: 4     // Hilos
      });
    } catch (error) {
      throw new Error('Error al hashear la contraseña: ' + error.message);
    }
  }

  // Función para verificar la contraseña
  static async verifyPassword(storedHash, password) {
    try {
      // Compara el password en texto plano con el hash almacenado
      return await argon2.verify(storedHash, password);
    } catch (error) {
      console.error('Error en la verificación:', error);
      return false;
    }
  }
}

export default Hashing;