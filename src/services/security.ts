// Browser-compatible security service
const PRIVILEGED_IPS = new Set([
  '88.182.169.164', // Admin IP
]);

export class SecurityService {
  private static instance: SecurityService | null = null;
  
  private userIP: string = '';

  static getInstance(): SecurityService {
    if (!this.instance) {
      this.instance = new SecurityService();
    }
    return this.instance;
  }

  setUserIP(ip: string) {
    this.userIP = ip;
  }

  getUserIP(): string {
    return this.userIP;
  }

  isPrivilegedIP(ip: string): boolean {
    return PRIVILEGED_IPS.has(ip);
  }

  // Browser-compatible hashing using Web Crypto API
  async hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (import.meta.env.VITE_IP_SALT || ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
