import { generateKeyPairSync, generateKeyPair, createSign, createVerify, publicEncrypt, privateDecrypt, constants as cryptoConstants } from 'crypto';

export interface KeyPair {
  publicKey: string;  // PEM format
  privateKey: string; // PEM format
}

/**
 * Generate RSA key pair (PEM format)
 * @param modulusLength - Modulus length (bits), recommended 2048 or above
 */
export function generateKeyPairSyncPEM(modulusLength: number = 2048): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * Asynchronously generate RSA key pair (PEM format)
 */
export function generateKeyPairPEM(modulusLength: number = 2048): Promise<KeyPair> {
  return new Promise((resolve, reject) => {
    generateKeyPair('rsa', {
      modulusLength,
      publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    }, (err, publicKey, privateKey) => {
      if (err) return reject(err);
      resolve({ publicKey, privateKey });
    });
  });
}

/**
 * Sign data using private key, default hash algorithm SHA256, outputs base64 string
 * @param privateKey - PEM format private key
 * @param data - String or Buffer to be signed
 */
export function signData(privateKey: string, data: string | Buffer): string {
  const sign = createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * Verify signature using public key, returns true/false
 * @param publicKey - PEM format public key
 * @param data - Original data
 * @param signature - base64 string signature
 */
export function verifySignature(publicKey: string, data: string | Buffer, signature: string): boolean {
  const verify = createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

/**
 * Encrypt data using public key, default RSA_PKCS1_OAEP_PADDING, outputs base64 string
 * @param publicKey - PEM format public key
 * @param data - String or Buffer to be encrypted
 */
export function encryptData(publicKey: string, data: string | Buffer): string {
  const encrypted = publicEncrypt(
    {
      key: publicKey,
      padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.isBuffer(data) ? data : Buffer.from(data)
  );
  return encrypted.toString('base64');
}

/**
 * Decrypt data using private key
 * @param privateKey - PEM format private key
 * @param encryptedData - base64 string
 */
export function decryptData(privateKey: string, encryptedData: string): string {
  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: cryptoConstants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedData, 'base64')
  );
  return decrypted.toString();
}
