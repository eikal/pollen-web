"use strict";
/**
 * Structured logging utility for observability.
 * Outputs JSON-formatted logs for refresh jobs and other events.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = debug;
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.logRefreshJob = logRefreshJob;
const config_1 = __importDefault(require("./config"));
const levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
function shouldLog(level) {
    return levelPriority[level] >= levelPriority[config_1.default.logLevel];
}
function log(level, message, context) {
    if (!shouldLog(level))
        return;
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(context && { context })
    };
    console.log(JSON.stringify(entry));
}
function debug(message, context) {
    log('debug', message, context);
}
function info(message, context) {
    log('info', message, context);
}
function warn(message, context) {
    log('warn', message, context);
}
function error(message, context) {
    log('error', message, context);
}
/**
 * Log a refresh job event with structured fields.
 */
function logRefreshJob(productId, event, details) {
    info(`Refresh job ${event}`, {
        product_id: productId,
        event,
        ...details
    });
}
exports.default = { debug, info, warn, error, logRefreshJob };
