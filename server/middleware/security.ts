import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { RequestHandler } from 'express';
import { env } from '../config/env';

// Helmet security headers (configured for SPA serving and API safety)
export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", '*']
    }
  } : false,
  crossOriginEmbedderPolicy: false
});

const isLocalOrDev = (req: any) =>
  env.NODE_ENV !== 'production' ||
  req.ip === '127.0.0.1' ||
  req.ip === '::1' ||
  req.ip === '::ffff:127.0.0.1' ||
  req.hostname === 'localhost';

// General API rate limiter (prevents scraping & DoS)
export const apiLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'production' ? 200 : 10000,
  skip: isLocalOrDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 30 : 500,
  skip: isLocalOrDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

// CORS configuration
export const corsMiddleware: RequestHandler = cors({
  origin: true, // Allow same-origin or configured origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
});

