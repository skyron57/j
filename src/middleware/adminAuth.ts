import { SecurityService } from '../services/security';

export const adminAuth = (req: Request): boolean => {
  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress;

  if (!clientIP) return false;

  // Check if IP is authorized
  if (!SecurityService.isAuthorizedIP(clientIP.toString())) {
    console.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
    return false;
  }

  // Check rate limit
  if (!SecurityService.checkRateLimit(clientIP.toString())) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return false;
  }

  return true;
};
