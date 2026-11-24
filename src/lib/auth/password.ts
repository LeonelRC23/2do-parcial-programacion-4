import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

/** Hashea una contraseña con bcrypt. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/** Compara texto plano con el hash guardado. */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/** Genera una contraseña temporal aleatoria. */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let temporaryPassword = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));
  for (const randomByte of randomBytes) {
    temporaryPassword += alphabet[randomByte % alphabet.length];
  }
  return temporaryPassword;
}
