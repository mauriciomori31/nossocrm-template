/**
 * Utilitários de sanitização para Supabase
 * 
 * REGRA DE OURO:
 * - company_id = Tenant ID (quem paga pelo SaaS) - vem do auth/profile
 * - crm_company_id = Empresa do cliente do usuário - cadastrado no CRM
 * - board_id, contact_id, stage_id = referências a outras entidades
 * 
 * Todos os UUIDs devem ser válidos ou NULL - nunca string vazia!
 */

// Regex para validar UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verifica se uma string é um UUID válido
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!value || value.trim() === '') return false;
  return UUID_REGEX.test(value);
}

/**
 * Sanitiza um campo UUID - retorna null se inválido
 * Use isso para TODOS os campos que são FK para outras tabelas
 */
export function sanitizeUUID(value: string | undefined | null): string | null {
  if (!value || value === '' || value.trim() === '') return null;
  if (!isValidUUID(value)) {
    console.warn(`[sanitizeUUID] UUID inválido descartado: "${value}"`);
    return null;
  }
  return value;
}

/**
 * Sanitiza múltiplos campos UUID de um objeto
 * Retorna um novo objeto com os campos sanitizados
 */
export function sanitizeUUIDs<T extends Record<string, unknown>>(
  obj: T,
  uuidFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of uuidFields) {
    const value = obj[field];
    if (value !== undefined) {
      (result as Record<string, unknown>)[field as string] = sanitizeUUID(value as string);
    }
  }
  return result;
}

/**
 * Valida que um UUID existe e é válido, lançando erro se não for
 * Use para campos OBRIGATÓRIOS como board_id em deals
 */
export function requireUUID(value: string | undefined | null, fieldName: string): string {
  const sanitized = sanitizeUUID(value);
  if (!sanitized) {
    throw new Error(`${fieldName} é obrigatório e deve ser um UUID válido`);
  }
  return sanitized;
}

/**
 * Sanitiza string para texto - null se vazio
 */
export function sanitizeText(value: string | undefined | null): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

/**
 * Sanitiza número - retorna default se inválido
 */
export function sanitizeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}
