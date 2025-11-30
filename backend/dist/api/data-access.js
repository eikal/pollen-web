"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userCreds = __importStar(require("../services/user-credentials"));
const schemaService = __importStar(require("../services/schema-service"));
const router = (0, express_1.Router)();
// TODO: plug in real auth middleware
router.get('/settings/data-access', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'unauthorized' });
    try {
        const schema = await schemaService.ensureUserSchema(req.user.id);
        const { username } = await userCreds.ensureDbUser(req.user.id, schema);
        return res.json({
            host: process.env.PGHOST || 'localhost',
            port: Number(process.env.PGPORT) || 5432,
            database: process.env.PGDATABASE || 'pollen_dev',
            schema,
            username,
            passwordMasked: true,
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'failed to load data access' });
    }
});
router.post('/settings/data-access/reset-password', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'unauthorized' });
    try {
        const schema = await schemaService.ensureUserSchema(req.user.id);
        const { username } = await userCreds.ensureDbUser(req.user.id, schema);
        const newPassword = await userCreds.resetDbPassword(req.user.id);
        return res.status(200).json({
            ok: true,
            credentials: {
                host: process.env.PGHOST || 'localhost',
                port: Number(process.env.PGPORT) || 5432,
                database: process.env.PGDATABASE || 'pollen_dev',
                schema,
                username,
                password: newPassword,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'failed to reset password' });
    }
});
exports.default = router;
