# Proactive Agent Notifications

Sistema de notificações proativas do agente de IA para o FlowCRM.

## Objetivo

O agente proativo monitora continuamente os dados do CRM e notifica o usuário sobre:

- Oportunidades de upsell/cross-sell
- Negócios parados que precisam de atenção
- Atividades atrasadas críticas
- Aniversários de clientes
- Padrões detectados que requerem ação

## Arquitetura

```
proactive-agent/
├── hooks/
│   └── useProactiveAgent.ts    # Hook principal do agente
├── components/
│   └── ProactiveNotification.tsx # Componente de notificação
├── services/
│   └── detectionService.ts     # Lógica de detecção
└── types.ts                    # Tipos TypeScript
```

## Status

🚧 Em desenvolvimento
