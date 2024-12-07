import { SecurityService } from '../../services/security';
import { LoggingService } from '../../services/logging';

export default async function handler(req: Request, res: Response) {
  const clientIP = req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress;

  if (!clientIP) {
    await LoggingService.logSecurityEvent({
      type: 'access_denied',
      description: 'No IP address detected',
      ip: 'unknown',
      severity: 'high'
    });
    return res.status(403).json({ success: false });
  }

  const ip = clientIP.toString();

  // Check if IP is authorized
  if (!SecurityService.isAuthorizedIP(ip)) {
    await LoggingService.logSecurityEvent({
      type: 'unauthorized_access',
      description: 'Unauthorized IP attempted to access admin panel',
      ip,
      severity: 'medium'
    });
    return res.status(403).json({ success: false });
  }

  // Check rate limit
  if (!SecurityService.checkRateLimit(ip)) {
    await LoggingService.logSecurityEvent({
      type: 'rate_limit_exceeded',
      description: 'Rate limit exceeded for admin panel access',
      ip,
      severity: 'medium'
    });
    return res.status(429).json({ success: false });
  }

  // Create session
  const token = SecurityService.createSession(ip);

  await LoggingService.logSecurityEvent({
    type: 'admin_access_granted',
    description: 'Successful admin panel access',
    ip,
    severity: 'low'
  });

  return res.status(200).json({ 
    success: true,
    token
  });
}
