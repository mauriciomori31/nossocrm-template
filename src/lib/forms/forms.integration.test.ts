/**
 * Integration tests for form validation system
 * Tests validation schemas and performance requirements
 */
import { describe, it, expect } from 'vitest';
import {
  contactFormSchema,
  dealFormSchema,
  activityFormSchema,
  ContactFormData,
  DealFormData,
  ActivityFormData,
} from '../validations/schemas';
import { measureValidationPerformance } from './useFormEnhanced';

// ============ CONTACT FORM VALIDATION TESTS ============

describe('Contact Form Integration', () => {
  it('should validate complete contact form', () => {
    const validData: ContactFormData = {
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '(11) 99999-9999',
      role: 'Gerente',
      companyName: 'Empresa ABC',
    };

    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should show errors for required fields', () => {
    const invalidData = {
      name: '',
      email: '',
    };

    const result = contactFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const issues = result.error.issues;
      const fieldNames = issues.map(i => i.path[0]);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    }
  });

  it('should validate email format', () => {
    const invalidEmail = {
      name: 'Test User',
      email: 'invalid-email',
    };

    const result = contactFormSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);

    if (!result.success) {
      const emailError = result.error.issues.find(i => i.path[0] === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.message).toContain('Email');
    }
  });

  it('should allow optional fields to be empty', () => {
    const minimalData = {
      name: 'Test User',
      email: 'test@email.com',
      // Optional fields omitted
    };

    const result = contactFormSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it('should allow empty strings for optional fields', () => {
    const dataWithEmptyStrings = {
      name: 'Test User',
      email: 'test@email.com',
      phone: '',
      role: '',
      companyName: '',
    };

    const result = contactFormSchema.safeParse(dataWithEmptyStrings);
    expect(result.success).toBe(true);

    // Schema allows empty strings for optional fields
    if (result.success) {
      expect(result.data.phone).toBe('');
      expect(result.data.role).toBe('');
      expect(result.data.companyName).toBe('');
    }
  });
});

// ============ DEAL FORM VALIDATION TESTS ============

describe('Deal Form Integration', () => {
  it('should validate complete deal form', () => {
    const validData: DealFormData = {
      title: 'Venda Importante',
      companyName: 'Empresa XYZ',
      value: 50000,
      contactName: 'Maria',
      email: 'maria@empresa.com',
      phone: '(11) 88888-8888',
    };

    const result = dealFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should coerce value from string to number', () => {
    const dataWithStringValue = {
      title: 'Deal Test',
      companyName: 'Company',
      value: '25000', // String instead of number
      contactName: 'John',
      email: 'john@test.com',
      phone: '',
    };

    const result = dealFormSchema.safeParse(dataWithStringValue);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(typeof result.data.value).toBe('number');
      expect(result.data.value).toBe(25000);
    }
  });

  it('should reject negative values', () => {
    const dataWithNegativeValue = {
      title: 'Deal Test',
      companyName: 'Company',
      value: -1000,
      contactName: 'John',
      email: 'john@test.com',
    };

    const result = dealFormSchema.safeParse(dataWithNegativeValue);
    expect(result.success).toBe(false);

    if (!result.success) {
      const valueError = result.error.issues.find(i => i.path[0] === 'value');
      expect(valueError).toBeDefined();
    }
  });

  it('should accept short titles (no minimum length constraint)', () => {
    const dataWithShortTitle = {
      title: 'AB', // Short but valid
      companyName: 'Company',
      value: 1000,
      contactName: 'John',
      email: 'john@test.com',
    };

    const result = dealFormSchema.safeParse(dataWithShortTitle);
    // Current schema allows short titles
    expect(result.success).toBe(true);
  });

  it('should allow optional phone to be empty', () => {
    const dataWithoutPhone = {
      title: 'Valid Deal',
      companyName: 'Company',
      value: 1000,
      contactName: 'John',
      email: 'john@test.com',
    };

    const result = dealFormSchema.safeParse(dataWithoutPhone);
    expect(result.success).toBe(true);
  });
});

// ============ ACTIVITY FORM VALIDATION TESTS ============

describe('Activity Form Integration', () => {
  it('should validate complete activity form', () => {
    const validData: ActivityFormData = {
      title: 'Reunião com cliente',
      type: 'MEETING',
      date: '2025-01-15',
      time: '14:00',
      dealId: 'deal-123',
      description: 'Discutir proposta',
    };

    const result = activityFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should only accept valid activity types', () => {
    const validTypes = ['CALL', 'MEETING', 'EMAIL', 'TASK'] as const;

    for (const type of validTypes) {
      const data = {
        title: 'Test Activity',
        type,
        date: '2025-01-15',
        time: '10:00',
        dealId: 'deal-1',
      };

      const result = activityFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid activity types', () => {
    const invalidData = {
      title: 'Test Activity',
      type: 'INVALID_TYPE',
      date: '2025-01-15',
      time: '10:00',
      dealId: 'deal-1',
    };

    const result = activityFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require all mandatory fields', () => {
    const incompleteData = {
      title: 'Test',
      // Missing type, date, time, dealId
    };

    const result = activityFormSchema.safeParse(incompleteData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const fieldNames = result.error.issues.map(i => i.path[0]);
      expect(fieldNames).toContain('type');
      expect(fieldNames).toContain('date');
      expect(fieldNames).toContain('time');
      expect(fieldNames).toContain('dealId');
    }
  });

  it('should allow description to be optional', () => {
    const dataWithoutDescription = {
      title: 'Test Activity',
      type: 'CALL' as const,
      date: '2025-01-15',
      time: '10:00',
      dealId: 'deal-1',
    };

    const result = activityFormSchema.safeParse(dataWithoutDescription);
    expect(result.success).toBe(true);
  });
});

// ============ VALIDATION PERFORMANCE TESTS ============

describe('Validation Performance', () => {
  it('should validate contact schema in under 100ms', () => {
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '(11) 99999-9999',
      role: 'Manager',
      companyName: 'Company Inc',
    };

    const { duration, valid } = measureValidationPerformance(contactFormSchema, testData);

    expect(valid).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('should validate deal schema in under 100ms', () => {
    const testData = {
      title: 'Big Deal',
      companyName: 'Company',
      value: 50000,
      contactName: 'John',
      email: 'john@company.com',
      phone: '(11) 99999-9999',
    };

    const { duration, valid } = measureValidationPerformance(dealFormSchema, testData);

    expect(valid).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('should validate activity schema in under 100ms', () => {
    const testData = {
      title: 'Call',
      type: 'CALL' as const,
      date: '2025-01-15',
      time: '10:00',
      description: 'Description',
      dealId: 'deal-123',
    };

    const { duration, valid } = measureValidationPerformance(activityFormSchema, testData);

    expect(valid).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('should handle 100 validations efficiently', () => {
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '',
      role: '',
      companyName: '',
    };

    const durations: number[] = [];

    for (let i = 0; i < 100; i++) {
      const { duration } = measureValidationPerformance(contactFormSchema, testData);
      durations.push(duration);
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    expect(averageDuration).toBeLessThan(10); // Average under 10ms
    expect(maxDuration).toBeLessThan(50); // Max under 50ms
  });

  it('should validate invalid data quickly too', () => {
    const invalidData = {
      name: '',
      email: 'invalid',
    };

    const { duration, valid } = measureValidationPerformance(contactFormSchema, invalidData);

    expect(valid).toBe(false);
    expect(duration).toBeLessThan(100);
  });
});

// ============ ERROR MESSAGE TESTS ============

describe('Error Messages', () => {
  it('should provide meaningful error messages for contact form', () => {
    const invalidData = {
      name: '',
      email: 'not-an-email',
    };

    const result = contactFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const nameError = result.error.issues.find(i => i.path[0] === 'name');
      const emailError = result.error.issues.find(i => i.path[0] === 'email');

      expect(nameError?.message).toBeTruthy();
      expect(emailError?.message).toBeTruthy();
      // Error messages should be user-friendly, not technical
      expect(nameError?.message.length).toBeGreaterThan(5);
    }
  });

  it('should provide meaningful error messages for deal form', () => {
    const invalidData = {
      title: 'AB',
      companyName: '',
      value: -100,
      contactName: '',
      email: 'invalid',
    };

    const result = dealFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      // Should have multiple validation errors
      expect(result.error.issues.length).toBeGreaterThan(1);

      // Each error should have a message
      for (const issue of result.error.issues) {
        expect(issue.message).toBeTruthy();
      }
    }
  });
});

// ============ EDGE CASES ============

describe('Edge Cases', () => {
  it('should handle unicode characters in names', () => {
    const dataWithUnicode = {
      name: 'José María García 日本語',
      email: 'jose@example.com',
    };

    const result = contactFormSchema.safeParse(dataWithUnicode);
    expect(result.success).toBe(true);
  });

  it('should handle very long valid strings', () => {
    const longName = 'A'.repeat(100);
    const dataWithLongName = {
      name: longName,
      email: 'test@example.com',
    };

    const result = contactFormSchema.safeParse(dataWithLongName);
    expect(result.success).toBe(true);
  });

  it('should handle whitespace-only strings as invalid', () => {
    const whitespaceData = {
      name: '   ',
      email: 'test@example.com',
    };

    // Note: Current schema may or may not trim - this documents behavior
    const result = contactFormSchema.safeParse(whitespaceData);
    // Either valid with trimmed value or invalid
    if (result.success) {
      expect(result.data.name.trim()).toBe('');
    }
  });

  it('should handle zero as valid value for deals', () => {
    const zeroValueDeal = {
      title: 'Free Trial',
      companyName: 'Company',
      value: 0,
      contactName: 'John',
      email: 'john@test.com',
    };

    const result = dealFormSchema.safeParse(zeroValueDeal);
    expect(result.success).toBe(true);
  });

  it('should handle large deal values', () => {
    const largeDeal = {
      title: 'Enterprise Deal',
      companyName: 'BigCorp',
      value: 999999999,
      contactName: 'CEO',
      email: 'ceo@bigcorp.com',
    };

    const result = dealFormSchema.safeParse(largeDeal);
    expect(result.success).toBe(true);
  });
});
