import { RegistryIndex, JourneyDefinition } from '@/types';

const REGISTRY_BASE_URL = 'https://raw.githubusercontent.com/thaleslaray/crm-templates/main';

export const fetchRegistry = async (): Promise<RegistryIndex> => {
    try {
        const response = await fetch(`${REGISTRY_BASE_URL}/registry.json`);
        if (!response.ok) throw new Error('Failed to fetch registry');
        return await response.json();
    } catch (error) {
        console.error('Error fetching registry:', error);
        throw error;
    }
};

export const fetchTemplateJourney = async (templatePath: string): Promise<JourneyDefinition> => {
    try {
        const response = await fetch(`${REGISTRY_BASE_URL}/${templatePath}/journey.json`);
        if (!response.ok) throw new Error('Failed to fetch template journey');
        return await response.json();
    } catch (error) {
        console.error('Error fetching template journey:', error);
        throw error;
    }
};
