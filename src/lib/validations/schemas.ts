/**
 * Zod validation schemas for FlowCRM forms
 *
 * Features:
 * - Standardized error codes for i18n
 * - Reusable field validators
 * - Type inference
 */
import { z } from 'zod';
import { ERROR_CODES, getErrorMessage } from './errorCodes';

// ============ HELPER FOR ERROR MESSAGES ============

const msg = (code: keyof typeof ERROR_CODES, params?: Record<string, string | number>) =>
  getErrorMessage(ERROR_CODES[code], params);

// ============ COMMON FIELD SCHEMAS ============

export const emailSchema = z
  .string({ message: msg('EMAIL_REQUIRED') })
  .min(1, msg('EMAIL_REQUIRED'))
  .email(msg('EMAIL_INVALID'));

export const phoneSchema = z
  .string()
  .optional()
  .transform(val => val || '')
  .pipe(
    z.string().refine(val => val === '' || /^[\d\s\-\(\)\+]+$/.test(val), msg('PHONE_INVALID'))
  );

export const requiredString = (field: string) =>
  z.string({ message: msg('FIELD_REQUIRED', { field }) }).min(1, msg('FIELD_REQUIRED', { field }));

export const optionalString = z
  .string()
  .optional()
  .transform(val => val || '');

export const currencySchema = z.coerce
  .number({ message: msg('NUMBER_REQUIRED', { field: 'Valor' }) })
  .min(0, msg('NUMBER_MUST_BE_POSITIVE', { field: 'Valor' }))
  .optional()
  .transform(val => val ?? 0);

export const requiredSelect = (field: string) =>
  z
    .string({ message: msg('SELECTION_REQUIRED', { field }) })
    .min(1, msg('SELECTION_REQUIRED', { field }));

export const requiredDate = (field: string) =>
  z.string({ message: msg('DATE_REQUIRED', { field }) }).min(1, msg('DATE_REQUIRED', { field }));

// ============ CONTACT SCHEMAS ============

export const contactFormSchema = z.object({
  name: requiredString('Nome'),
  email: emailSchema,
  phone: phoneSchema,
  role: optionalString,
  companyName: optionalString,
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============ DEAL SCHEMAS ============

export const dealFormSchema = z.object({
  title: requiredString('Nome do negócio'),
  companyName: requiredString('Empresa'),
  value: currencySchema,
  contactName: optionalString,
  email: z.string().email(msg('EMAIL_INVALID')).optional().or(z.literal('')),
  phone: phoneSchema,
});

export type DealFormData = z.infer<typeof dealFormSchema>;

// ============ ACTIVITY SCHEMAS ============

export const activityTypeSchema = z.enum([
  'CALL',
  'MEETING',
  'EMAIL',
  'TASK',
  'NOTE',
  'STATUS_CHANGE',
]);

export const activityFormTypeSchema = z.enum(['CALL', 'MEETING', 'EMAIL', 'TASK'], {
  message: msg('SELECTION_INVALID'),
});

export const activityFormSchema = z.object({
  title: requiredString('Título'),
  type: activityFormTypeSchema,
  date: requiredDate('Data'),
  time: requiredString('Hora'),
  description: optionalString,
  dealId: requiredSelect('Negócio'),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;

// ============ BOARD SCHEMAS ============

export const boardFormSchema = z.object({
  name: requiredString('Nome do board'),
  description: optionalString,
});

export type BoardFormData = z.infer<typeof boardFormSchema>;

// ============ SETTINGS SCHEMAS ============

export const lifecycleStageSchema = z.object({
  name: requiredString('Nome do estágio'),
  color: requiredString('Cor'),
});

export type LifecycleStageFormData = z.infer<typeof lifecycleStageSchema>;

// ============ AI CONFIG SCHEMAS ============

export const aiConfigSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'anthropic'], {
    message: msg('SELECTION_INVALID'),
  }),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export type AIConfigFormData = z.infer<typeof aiConfigSchema>;

// Re-export error utilities
export { ERROR_CODES, getErrorMessage, setLocale, getLocale } from './errorCodes';
