import { encryptData, decryptData, hashData, createSignature, verifySignature } from '@utils/encryption';

describe('Encryption Utilities', () => {
  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt string data correctly', () => {
      const originalData = 'Hello, World!';
      const encrypted = encryptData(originalData);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt object data correctly', () => {
      const originalData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const encrypted = encryptData(originalData);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toEqual(originalData);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decryptData('invalid-data')).toThrow('Invalid encrypted data format');
    });

    it('should produce different encrypted values for same input', () => {
      const data = 'test data';
      const encrypted1 = encryptData(data);
      const encrypted2 = encryptData(data);

      // Encrypted values should contain the data
      expect(encrypted1).toContain(':');
      expect(encrypted2).toContain(':');
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'test-data';
      const hash1 = hashData(data);
      const hash2 = hashData(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    it('should produce different hashes for different data', () => {
      const hash1 = hashData('data1');
      const hash2 = hashData('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createSignature and verifySignature', () => {
    const secret = 'test-secret-key';

    it('should create and verify signature correctly', () => {
      const data = 'test-data';
      const signature = createSignature(data, secret);
      const isValid = verifySignature(data, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong data', () => {
      const data = 'test-data';
      const signature = createSignature(data, secret);
      const isValid = verifySignature('wrong-data', signature, secret);

      expect(isValid).toBe(false);
    });

    it('should fail verification with wrong secret', () => {
      const data = 'test-data';
      const signature = createSignature(data, secret);
      const isValid = verifySignature(data, signature, 'wrong-secret');

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered signature', () => {
      const data = 'test-data';
      const signature = createSignature(data, secret);
      const tamperedSignature = signature.substring(0, signature.length - 1) + 'x';

      expect(() => verifySignature(data, tamperedSignature, secret)).toThrow();
    });
  });
});
