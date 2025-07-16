import { hash } from 'bcryptjs';

/**
 * Hashes a password using bcryptjs
 * @param password The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}
