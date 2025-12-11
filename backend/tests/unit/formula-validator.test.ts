/**
 * Unit tests for formula validator.
 */

import { validateFormula } from '../../src/services/formula-validator';

describe('FormulaValidator', () => {
  describe('valid formulas', () => {
    it('should accept simple arithmetic', () => {
      expect(() => validateFormula('1 + 2')).not.toThrow();
      expect(() => validateFormula('10 - 5')).not.toThrow();
      expect(() => validateFormula('3 * 4')).not.toThrow();
      expect(() => validateFormula('8 / 2')).not.toThrow();
    });

    it('should accept field identifiers', () => {
      expect(() => validateFormula('revenue + cost')).not.toThrow();
      expect(() => validateFormula('price * quantity')).not.toThrow();
    });

    it('should accept parentheses', () => {
      expect(() => validateFormula('(1 + 2) * 3')).not.toThrow();
      expect(() => validateFormula('revenue * (1 + margin_pct)')).not.toThrow();
    });

    it('should accept SUM aggregation', () => {
      expect(() => validateFormula('SUM(revenue)')).not.toThrow();
      expect(() => validateFormula('SUM(price) + 10')).not.toThrow();
    });

    it('should accept AVG aggregation', () => {
      expect(() => validateFormula('AVG(score)')).not.toThrow();
      expect(() => validateFormula('AVG(rating) * 100')).not.toThrow();
    });

    it('should accept complex valid expressions', () => {
      expect(() => validateFormula('SUM(price * quantity) / AVG(cost)')).not.toThrow();
      expect(() => validateFormula('(revenue - cost) / revenue * 100')).not.toThrow();
    });
  });

  describe('invalid formulas', () => {
    it('should reject empty expressions', () => {
      expect(() => validateFormula('')).toThrow('Formula expression cannot be empty');
      expect(() => validateFormula('   ')).toThrow('Formula expression cannot be empty');
    });

    it('should reject divide by zero', () => {
      expect(() => validateFormula('10 / 0')).toThrow('Division by zero');
    });

    it('should reject mismatched parentheses', () => {
      expect(() => validateFormula('(1 + 2')).toThrow('Mismatched parentheses');
      expect(() => validateFormula('1 + 2)')).toThrow('Unexpected token');
    });

    it('should reject invalid syntax', () => {
      expect(() => validateFormula('1 +')).toThrow('Invalid formula');
      expect(() => validateFormula('+ 1')).toThrow('Invalid formula');
      expect(() => validateFormula('1 2')).toThrow('Unexpected tokens');
    });

    it('should reject aggregation without parentheses', () => {
      expect(() => validateFormula('SUM revenue')).toThrow('Expected \'(\' after SUM');
    });

    it('should reject aggregation without field', () => {
      expect(() => validateFormula('SUM()')).toThrow('Invalid formula');
    });

    it('should reject unclosed aggregation', () => {
      expect(() => validateFormula('SUM(revenue')).toThrow('Expected \')\'');
    });

    it('should reject unexpected characters', () => {
      expect(() => validateFormula('1 + @')).toThrow('Unexpected character');
    });
  });
});
