"use strict";
/**
 * Formula validator for KPI metric expressions.
 * Supports arithmetic operators (+, -, *, /, parentheses) and basic aggregations (SUM, AVG).
 * Rejects invalid syntax, divide-by-zero patterns, and unsupported operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFormula = validateFormula;
const OPERATORS = ['+', '-', '*', '/'];
const AGGREGATIONS = ['SUM', 'AVG'];
class FormulaValidator {
    constructor() {
        this.tokens = [];
        this.position = 0;
    }
    /**
     * Validate a formula expression.
     * @param expression - Formula string to validate
     * @throws Error if expression is invalid
     */
    validate(expression) {
        if (!expression || expression.trim().length === 0) {
            throw new Error('Formula expression cannot be empty');
        }
        this.tokens = this.tokenize(expression);
        this.position = 0;
        try {
            this.parseExpression();
            if (this.currentToken().type !== 'EOF') {
                throw new Error('Unexpected tokens after valid expression');
            }
            this.checkDivideByZero(expression);
        }
        catch (err) {
            throw new Error(`Invalid formula: ${err.message}`);
        }
    }
    tokenize(expression) {
        const tokens = [];
        let i = 0;
        const expr = expression.trim();
        while (i < expr.length) {
            const char = expr[i];
            // Skip whitespace
            if (/\s/.test(char)) {
                i++;
                continue;
            }
            // Numbers
            if (/\d/.test(char)) {
                let num = '';
                while (i < expr.length && /[\d.]/.test(expr[i])) {
                    num += expr[i];
                    i++;
                }
                tokens.push({ type: 'NUMBER', value: num });
                continue;
            }
            // Operators
            if (OPERATORS.includes(char)) {
                tokens.push({ type: 'OPERATOR', value: char });
                i++;
                continue;
            }
            // Parentheses
            if (char === '(') {
                tokens.push({ type: 'LPAREN', value: char });
                i++;
                continue;
            }
            if (char === ')') {
                tokens.push({ type: 'RPAREN', value: char });
                i++;
                continue;
            }
            // Identifiers and aggregations
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (i < expr.length && /[a-zA-Z_0-9]/.test(expr[i])) {
                    ident += expr[i];
                    i++;
                }
                const upperIdent = ident.toUpperCase();
                if (AGGREGATIONS.includes(upperIdent)) {
                    tokens.push({ type: 'AGGREGATION', value: upperIdent });
                }
                else {
                    tokens.push({ type: 'IDENTIFIER', value: ident });
                }
                continue;
            }
            throw new Error(`Unexpected character: ${char}`);
        }
        tokens.push({ type: 'EOF', value: '' });
        return tokens;
    }
    currentToken() {
        return this.tokens[this.position] || { type: 'EOF', value: '' };
    }
    advance() {
        this.position++;
    }
    parseExpression() {
        this.parseTerm();
        while (this.currentToken().type === 'OPERATOR' &&
            ['+', '-'].includes(this.currentToken().value)) {
            this.advance();
            this.parseTerm();
        }
    }
    parseTerm() {
        this.parseFactor();
        while (this.currentToken().type === 'OPERATOR' &&
            ['*', '/'].includes(this.currentToken().value)) {
            this.advance();
            this.parseFactor();
        }
    }
    parseFactor() {
        const token = this.currentToken();
        if (token.type === 'NUMBER') {
            this.advance();
            return;
        }
        if (token.type === 'IDENTIFIER') {
            this.advance();
            return;
        }
        if (token.type === 'AGGREGATION') {
            this.advance();
            if (this.currentToken().type !== 'LPAREN') {
                throw new Error(`Expected '(' after ${token.value}`);
            }
            this.advance();
            // Parse inner expression (can be complex like 'price * quantity')
            this.parseExpression();
            if (this.currentToken().type !== 'RPAREN') {
                throw new Error(`Expected ')' after ${token.value}(...)`);
            }
            this.advance();
            return;
        }
        if (token.type === 'LPAREN') {
            this.advance();
            this.parseExpression();
            if (this.currentToken().type !== 'RPAREN') {
                throw new Error('Mismatched parentheses');
            }
            this.advance();
            return;
        }
        throw new Error(`Unexpected token: ${token.value}`);
    }
    checkDivideByZero(expression) {
        // Simple pattern check for obvious divide-by-zero
        if (/\/\s*0(?!\d)/.test(expression)) {
            throw new Error('Division by zero detected');
        }
    }
}
const validator = new FormulaValidator();
/**
 * Validate a KPI formula expression.
 * @param expression - Formula string
 * @throws Error if invalid
 */
function validateFormula(expression) {
    validator.validate(expression);
}
exports.default = { validateFormula };
