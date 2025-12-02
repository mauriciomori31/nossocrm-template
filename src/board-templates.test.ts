import { describe, it, expect } from 'vitest';
import { BOARD_TEMPLATES, BoardTemplateType } from '@/board-templates';

describe('BOARD_TEMPLATES', () => {
  it('should have all required properties for each template', () => {
    // Templates que devem ter conteúdo completo (excluindo CUSTOM)
    const activeTemplates = Object.entries(BOARD_TEMPLATES)
      .filter(([key]) => key !== 'CUSTOM')
      .map(([, template]) => template);

    activeTemplates.forEach(template => {
      // Basic properties
      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');

      expect(template.description).toBeDefined();
      expect(typeof template.description).toBe('string');

      expect(template.emoji).toBeDefined();
      expect(typeof template.emoji).toBe('string');

      // Stages
      expect(template.stages).toBeDefined();
      expect(Array.isArray(template.stages)).toBe(true);
      expect(template.stages.length).toBeGreaterThan(0);

      // Tags (Critical for preventing blank screen bug)
      expect(template.tags).toBeDefined();
      expect(Array.isArray(template.tags)).toBe(true);
      expect(template.tags.length).toBeGreaterThan(0);
      template.tags.forEach(tag => {
        expect(typeof tag).toBe('string');
      });

      // Strategy Fields
      if (template.agentPersona) {
        expect(template.agentPersona.name).toBeDefined();
        expect(template.agentPersona.role).toBeDefined();
        expect(template.agentPersona.behavior).toBeDefined();
      }

      if (template.goal) {
        expect(template.goal.description).toBeDefined();
        expect(template.goal.kpi).toBeDefined();
        expect(template.goal.targetValue).toBeDefined();
        expect(template.goal.type).toBeDefined();
      }
    });
  });

  it('should have CUSTOM template as placeholder', () => {
    expect(BOARD_TEMPLATES.CUSTOM).toBeDefined();
    expect(BOARD_TEMPLATES.CUSTOM.name).toBe('Personalizado');
    expect(BOARD_TEMPLATES.CUSTOM.stages).toEqual([]);
  });
});
