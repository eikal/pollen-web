/**
 * JWT authentication middleware for CSV/Excel ETL service.
 * Validates JWT tokens and attaches user context to requests.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../services/config';
import * as log from '../services/log';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        orgId?: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  orgId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to validate JWT token and attach user to request.
 * 
 * Usage: app.get('/protected', authenticateJWT, (req, res) => {...})
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.',
      errorCode: 'AUTHENTICATION_REQUIRED',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication format. Use: Authorization: Bearer <token>',
      errorCode: 'INVALID_AUTH_FORMAT',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user context to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      orgId: decoded.orgId,
    };

    log.debug('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        errorCode: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
        errorCode: 'INVALID_TOKEN',
      });
      return;
    }

    log.error('JWT verification failed', {
      error: (error as Error).message,
    });

    res.status(401).json({
      success: false,
      message: 'Authentication failed. Please try logging in again.',
      errorCode: 'AUTH_FAILED',
    });
  }
}

/**
 * Optional authentication - attaches user if token present, but doesn't block request.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      orgId: decoded.orgId,
    };
  } catch (error) {
    // Silently fail for optional auth
    log.debug('Optional auth failed', { error: (error as Error).message });
  }

  next();
}
