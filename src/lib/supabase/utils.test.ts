import { describe, it, expect, vi } from 'vitest';
import { 
  isValidUUID, 
  sanitizeUUID, 
  sanitizeUUIDs, 
  requireUUID,
  sanitizeText,
  sanitizeNumber 
} from './utils';

describe('Supabase Utils', () => {
  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('   ')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('c-12345678')).toBe(false); // Formato antigo inválido
    });
  });

  describe('sanitizeUUID', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    it('should return valid UUID as-is', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(sanitizeUUID(uuid)).toBe(uuid);
    });

    it('should return null for empty string', () => {
      expect(sanitizeUUID('')).toBeNull();
      expect(sanitizeUUID('   ')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(sanitizeUUID(null)).toBeNull();
      expect(sanitizeUUID(undefined)).toBeNull();
    });

    it('should return null and warn for invalid UUID format', () => {
      expect(sanitizeUUID('c-12345678')).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('sanitizeUUIDs', () => {
    it('should sanitize multiple UUID fields', () => {
      const obj = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        boardId: '',
        contactId: null,
        name: 'Test',
      };

      const result = sanitizeUUIDs(obj, ['id', 'boardId', 'contactId']);

      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.boardId).toBeNull();
      expect(result.contactId).toBeNull();
      expect(result.name).toBe('Test'); // Não afetado
    });
  });

  describe('requireUUID', () => {
    it('should return valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(requireUUID(uuid, 'testField')).toBe(uuid);
    });

    it('should throw error for empty string', () => {
      expect(() => requireUUID('', 'Board ID')).toThrow('Board ID é obrigatório');
    });

    it('should throw error for null', () => {
      expect(() => requireUUID(null, 'Board ID')).toThrow('Board ID é obrigatório');
    });

    it('should throw error for invalid UUID', () => {
      expect(() => requireUUID('invalid', 'Board ID')).toThrow('Board ID é obrigatório');
    });
  });

  describe('sanitizeText', () => {
    it('should return trimmed text', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should return null for empty string', () => {
      expect(sanitizeText('')).toBeNull();
      expect(sanitizeText('   ')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(sanitizeText(null)).toBeNull();
      expect(sanitizeText(undefined)).toBeNull();
    });
  });

  describe('sanitizeNumber', () => {
    it('should return number as-is', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber(0)).toBe(0);
      expect(sanitizeNumber(-5)).toBe(-5);
    });

    it('should parse string to number', () => {
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber('3.14')).toBe(3.14);
    });

    it('should return default for invalid input', () => {
      expect(sanitizeNumber('abc')).toBe(0);
      expect(sanitizeNumber(null)).toBe(0);
      expect(sanitizeNumber(undefined)).toBe(0);
      expect(sanitizeNumber(NaN)).toBe(0);
    });

    it('should use custom default value', () => {
      expect(sanitizeNumber('abc', 100)).toBe(100);
    });
  });
});
