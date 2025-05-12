import * as bcrypt from 'bcryptjs';

/**
 * Utility functions for password hashing and verification using bcrypt
 */

// Hash a password using bcrypt
export function hashPassword(password: string): string {
  // Generate a salt and hash the password
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Verify a password against a hash using bcrypt
export function verifyPassword(password: string, hash: string): boolean {
  // Use bcrypt's compare function to verify the password
  return bcrypt.compareSync(password, hash);
}
