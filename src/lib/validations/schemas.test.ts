/**
 * Tests for Zod validation schemas
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  contactFormSchema,
  dealFormSchema,
  activityFormSchema,
  boardFormSchema,
  lifecycleStageSchema,
  aiConfigSchema,
  emailSchema,
  phoneSchema,
  currencySchema,
  requiredString,
  requiredSelect,
  requiredDate,
} from './schemas';
import { ERROR_CODES, getErrorMessage, setLocale, getLocale, createError } from './errorCodes';

// ============ ERROR CODES TESTS ============

describe('Error Codes System', () => {
  beforeEach(() => {
    setLocale('pt-BR'); // Reset to default
  });

  it('should return Portuguese messages by default', () => {
    const message = getErrorMessage(ERROR_CODES.EMAIL_REQUIRED);
    expect(message).toBe('Email é obrigatório');
  });

  it('should return English messages when locale is en-US', () => {
    setLocale('en-US');
    const message = getErrorMessage(ERROR_CODES.EMAIL_REQUIRED);
    expect(message).toBe('Email is required');
  });

  it('should interpolate parameters in messages', () => {
    const message = getErrorMessage(ERROR_CODES.FIELD_REQUIRED, { field: 'Nome' });
    expect(message).toBe('Nome é obrigatório');
  });

  it('should interpolate multiple parameters', () => {
    const message = getErrorMessage(ERROR_CODES.FIELD_TOO_SHORT, { field: 'Senha', min: 8 });
    expect(message).toBe('Senha deve ter no mínimo 8 caracteres');
  });

  it('should return current locale', () => {
    expect(getLocale()).toBe('pt-BR');
    setLocale('en-US');
    expect(getLocale()).toBe('en-US');
  });

  it('should create error object with code and message', () => {
    const error = createError(ERROR_CODES.EMAIL_INVALID);
    expect(error.code).toBe('EMAIL_INVALID');
    expect(error.message).toBe('Email inválido');
  });

  it('should fallback to pt-BR for unknown locale', () => {
    setLocale('unknown-LOCALE');
    const message = getErrorMessage(ERROR_CODES.EMAIL_REQUIRED);
    expect(message).toBe('Email é obrigatório');
  });
});

// ============ COMMON FIELD SCHEMAS ============

describe('emailSchema', () => {
  it('should validate correct email', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should have proper error message', () => {
    const result = emailSchema.safeParse('invalid');
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Email');
    }
  });
});

describe('phoneSchema', () => {
  it('should validate correct phone', () => {
    const result = phoneSchema.safeParse('(11) 99999-9999');
    expect(result.success).toBe(true);
  });

  it('should allow empty phone', () => {
    const result = phoneSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('should allow undefined phone', () => {
    const result = phoneSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it('should validate international format', () => {
    const result = phoneSchema.safeParse('+55 11 99999-9999');
    expect(result.success).toBe(true);
  });
});

describe('currencySchema', () => {
  it('should parse number', () => {
    const result = currencySchema.safeParse(1000);
    expect(result.success).toBe(true);
    expect(result.data).toBe(1000);
  });

  it('should coerce string to number', () => {
    const result = currencySchema.safeParse('1500');
    expect(result.success).toBe(true);
    expect(result.data).toBe(1500);
  });

  it('should reject negative values', () => {
    const result = currencySchema.safeParse(-100);
    expect(result.success).toBe(false);
  });

  it('should default to 0 for undefined', () => {
    const result = currencySchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBe(0);
  });
});

describe('requiredString', () => {
  it('should reject empty string', () => {
    const schema = requiredString('Campo');
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should accept non-empty string', () => {
    const schema = requiredString('Campo');
    const result = schema.safeParse('value');
    expect(result.success).toBe(true);
  });

  it('should include field name in error', () => {
    const schema = requiredString('Nome');
    const result = schema.safeParse('');
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Nome');
    }
  });
});

describe('requiredSelect', () => {
  it('should reject empty selection', () => {
    const schema = requiredSelect('Tipo');
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should accept valid selection', () => {
    const schema = requiredSelect('Tipo');
    const result = schema.safeParse('option1');
    expect(result.success).toBe(true);
  });
});

describe('requiredDate', () => {
  it('should reject empty date', () => {
    const schema = requiredDate('Data');
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should accept valid date string', () => {
    const schema = requiredDate('Data');
    const result = schema.safeParse('2025-01-15');
    expect(result.success).toBe(true);
  });
});

// ============ CONTACT SCHEMA ============

describe('contactFormSchema', () => {
  it('should validate complete contact', () => {
    const result = contactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(11) 99999-9999',
      role: 'Manager',
      companyName: 'Acme Inc',
    });
    expect(result.success).toBe(true);
  });

  it('should require name and email', () => {
    const result = contactFormSchema.safeParse({
      name: '',
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('should allow optional fields', () => {
    const result = contactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(result.success).toBe(true);
  });
});

// ============ DEAL SCHEMA ============

describe('dealFormSchema', () => {
  it('should validate complete deal', () => {
    const result = dealFormSchema.safeParse({
      title: 'Big Contract',
      companyName: 'Acme Inc',
      value: 50000,
      contactName: 'John',
      email: 'john@acme.com',
      phone: '(11) 99999-9999',
    });
    expect(result.success).toBe(true);
  });

  it('should require title and company', () => {
    const result = dealFormSchema.safeParse({
      title: '',
      companyName: '',
      value: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('should coerce value from string', () => {
    const result = dealFormSchema.safeParse({
      title: 'Deal',
      companyName: 'Company',
      value: '25000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(25000);
    }
  });
});

// ============ ACTIVITY SCHEMA ============

describe('activityFormSchema', () => {
  it('should validate complete activity', () => {
    const result = activityFormSchema.safeParse({
      title: 'Call with client',
      type: 'CALL',
      date: '2025-01-15',
      time: '14:00',
      description: 'Discuss contract',
      dealId: 'deal-123',
    });
    expect(result.success).toBe(true);
  });

  it('should require all main fields', () => {
    const result = activityFormSchema.safeParse({
      title: '',
      type: 'CALL',
      date: '',
      time: '',
      dealId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should only allow valid activity types', () => {
    const validResult = activityFormSchema.safeParse({
      title: 'Test',
      type: 'MEETING',
      date: '2025-01-15',
      time: '10:00',
      dealId: 'deal-1',
    });
    expect(validResult.success).toBe(true);

    const invalidResult = activityFormSchema.safeParse({
      title: 'Test',
      type: 'INVALID_TYPE',
      date: '2025-01-15',
      time: '10:00',
      dealId: 'deal-1',
    });
    expect(invalidResult.success).toBe(false);
  });
});

// ============ BOARD SCHEMA ============

describe('boardFormSchema', () => {
  it('should validate complete board', () => {
    const result = boardFormSchema.safeParse({
      name: 'Sales Pipeline',
      description: 'Main sales board',
    });
    expect(result.success).toBe(true);
  });

  it('should require name', () => {
    const result = boardFormSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should allow empty description', () => {
    const result = boardFormSchema.safeParse({
      name: 'Board',
    });
    expect(result.success).toBe(true);
  });
});

// ============ LIFECYCLE STAGE SCHEMA ============

describe('lifecycleStageSchema', () => {
  it('should validate complete stage', () => {
    const result = lifecycleStageSchema.safeParse({
      name: 'Lead',
      color: 'blue',
    });
    expect(result.success).toBe(true);
  });

  it('should require both name and color', () => {
    const result = lifecycleStageSchema.safeParse({
      name: '',
      color: '',
    });
    expect(result.success).toBe(false);
  });
});

// ============ AI CONFIG SCHEMA ============

describe('aiConfigSchema', () => {
  it('should validate complete config', () => {
    const result = aiConfigSchema.safeParse({
      provider: 'gemini',
      apiKey: 'test-key',
      model: 'gemini-pro',
    });
    expect(result.success).toBe(true);
  });

  it('should only allow valid providers', () => {
    const validProviders = ['gemini', 'openai', 'anthropic'];
    for (const provider of validProviders) {
      const result = aiConfigSchema.safeParse({ provider });
      expect(result.success).toBe(true);
    }

    const invalidResult = aiConfigSchema.safeParse({ provider: 'invalid' });
    expect(invalidResult.success).toBe(false);
  });

  it('should allow optional apiKey and model', () => {
    const result = aiConfigSchema.safeParse({
      provider: 'openai',
    });
    expect(result.success).toBe(true);
  });
});
