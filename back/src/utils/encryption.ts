import CryptoJS from 'crypto-js';
import { config } from '../config/env';

/**
 * Encrypt a plaintext string using AES-256.
 */
export const encrypt = (plaintext: string): string => {
  return CryptoJS.AES.encrypt(plaintext, config.encryptionKey).toString();
};

/**
 * Decrypt an AES-256 encrypted string.
 */
export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, config.encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
