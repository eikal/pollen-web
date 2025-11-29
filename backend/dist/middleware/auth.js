"use strict";
/**
 * JWT authentication middleware for CSV/Excel ETL service.
 * Validates JWT tokens and attaches user context to requests.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const log = __importStar(require("../services/log"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**
 * Middleware to validate JWT token and attach user to request.
 *
 * Usage: app.get('/protected', authenticateJWT, (req, res) => {...})
 */
function authenticateJWT(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Your session has expired. Please log in again.',
                errorCode: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid authentication token. Please log in again.',
                errorCode: 'INVALID_TOKEN',
            });
            return;
        }
        log.error('JWT verification failed', {
            error: error.message,
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
function optionalAuth(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            orgId: decoded.orgId,
        };
    }
    catch (error) {
        // Silently fail for optional auth
        log.debug('Optional auth failed', { error: error.message });
    }
    next();
}
