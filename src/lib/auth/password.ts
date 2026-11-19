import bcrypt from "bcryptjs";

/** Rondas de bcrypt para el hash de contraseñas (seguridad §8). */
const BCRYPT_ROUNDS = 10;

/**
 * Genera el hash irreversible de una contraseña en texto plano.
 * Usado al crear usuarios, resetear o cambiar contraseña (RF-U4, RF-U5).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con el hash guardado.
 * @returns true si coinciden.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Genera una contraseña temporal legible de 10 caracteres
 * (sin caracteres ambiguos como 0/O o 1/l). RF-U5.
 */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let temporaryPassword = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));
  for (const randomByte of randomBytes) {
    temporaryPassword += alphabet[randomByte % alphabet.length];
  }
  return temporaryPassword;
}
