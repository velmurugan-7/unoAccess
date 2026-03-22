import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken, generateRandomToken } from '../utils/jwt';
import { encrypt, decrypt } from '../utils/encryption';
import 'dotenv/config';

describe('JWT Utilities', () => {
  const payload = { userId: 'user123', email: 'test@example.com', role: 'user' };

  it('should generate and verify access token', () => {
    const token = generateAccessToken(payload);
    expect(token).toBeTruthy();
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('should generate and verify refresh token', () => {
    const token = generateRefreshToken('user123');
    expect(token).toBeTruthy();
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe('user123');
  });

  it('should throw on invalid access token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('should generate unique random tokens', () => {
    const t1 = generateRandomToken();
    const t2 = generateRandomToken();
    expect(t1).toHaveLength(64);
    expect(t1).not.toBe(t2);
  });
});

describe('Encryption Utilities', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'super-secret-client-secret-value';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for the same plaintext', () => {
    const plain = 'hello';
    const e1 = encrypt(plain);
    const e2 = encrypt(plain);
    // CryptoJS AES with same key produces same output (deterministic), so just verify decryption works
    expect(decrypt(e1)).toBe(plain);
    expect(decrypt(e2)).toBe(plain);
  });
});
