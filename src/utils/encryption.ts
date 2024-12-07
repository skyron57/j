/**
 * Browser-compatible encryption using Web Crypto API
 */
export class Encryption {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async encrypt(text: string): Promise<{ encryptedData: string; iv: string; tag: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = this.encoder.encode(text);
    
    // Generate a random key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Export the key for storage
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    
    return {
      encryptedData: this.bufferToBase64(encryptedBuffer),
      iv: this.bufferToBase64(iv),
      tag: this.bufferToBase64(exportedKey)
    };
  }

  static async decrypt(encryptedData: string, iv: string, tag: string): Promise<string> {
    const encryptedBuffer = this.base64ToBuffer(encryptedData);
    const ivBuffer = this.base64ToBuffer(iv);
    const keyBuffer = this.base64ToBuffer(tag);

    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      key,
      encryptedBuffer
    );

    return this.decoder.decode(decryptedBuffer);
  }

  static async hash(text: string): Promise<string> {
    const encodedText = this.encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedText);
    return this.bufferToBase64(hashBuffer);
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
