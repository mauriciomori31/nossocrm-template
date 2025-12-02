# NossoCRM - AI Coding Instructions

## ⚠️ VALIDAÇÃO DE DADOS - LEIA PRIMEIRO

**Stack de validação**: Use Zod (`z.uuid()`, `z.string()`) para validar dados antes de salvar. IDs vazios = null ou erro. Nunca confie no frontend.

Regras:
- IDs/UUIDs: use `z.uuid()` - rejeita string vazia automaticamente
- Campos opcionais: `z.uuid().nullable()`
- Texto obrigatório: `z.string().min(1)`
- Sempre `.parse()` antes de inserir no Supabase
- Se não tiver Zod, use os utilitários em `lib/supabase/utils.ts` (sanitizeUUID, requireUUID)

Lembre-se: dados do usuário podem vir sujos. Valide sempre.

---

## Architecture Overview

NossoCRM é um CRM multi-tenant SaaS com React 19 + TypeScript + Supabase + TanStack Query.

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Dark Mode
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
- **AI**: Google Gemini
- **Testing**: Vitest, React Testing Library, Playwright

### Core Patterns

**Feature-based Structure** (`src/features/<domain>/`)

```
src/features/contacts/
├── ContactsPage.tsx           # Route component (thin)
├── components/                # UI components
└── hooks/useContactsController.ts  # Business logic + TanStack Query
```

**Controller Hook Pattern**: Each feature has a controller hook that uses TanStack Query hooks:

```tsx
// ContactsPage.tsx - Always this pattern
export const ContactsPage: React.FC = () => {
  const controller = useContactsController();
  return <ContactsView {...controller} />;
};

// useContactsController.ts - Uses TanStack Query
export function useContactsController() {
  const { data: contacts, isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  // ... filtering, handlers
}
```

**TanStack Query Hooks** (`lib/query/hooks/`):

- `useDealsQuery.ts` - Deals CRUD + queries
- `useContactsQuery.ts` - Contacts CRUD + queries
- `useActivitiesQuery.ts` - Activities CRUD + queries
- `useBoardsQuery.ts` - Boards/Stages CRUD + queries

**Supabase Services** (`lib/supabase/`):

- `contacts.ts` - contactsService.getAll(), create(), update(), delete()
- `deals.ts` - dealsService.\*
- `activities.ts` - activitiesService.\*
- `boards.ts` - boardsService._, boardStagesService._
- `settings.ts` - settingsService._, lifecycleStagesService._

**Realtime Sync** (`lib/realtime/`):

- `useRealtimeSync.ts` - Auto-invalidates queries on Supabase changes

## Key Conventions

### Path Aliases

Use `@/` alias for imports:

```tsx
import { useContacts } from '@/lib/query/hooks';
import { useAuth } from '@/context/AuthContext';
import { Contact } from '@/types';
```

### Types

All domain types in `/types.ts`:

- `Contact`, `Deal`, `DealView`, `Activity`
- `Board`, `BoardStage`, `LifecycleStage`
- `Company`, `Profile`

### Styling

- Tailwind CSS with custom theme in `tailwind.config.js`
- Dark mode via `darkMode: 'class'` and `ThemeContext`
- Custom colors: `primary-*`, `dark-*` (bg, card, border, hover)
- Glass effect: `glass` class

## Authentication

**Supabase Auth** (`context/AuthContext.tsx`):

```tsx
const { user, profile, session, signOut, loading } = useAuth();
// profile inclui: company_id, role ('admin' | 'vendedor')
```

**Multi-tenant**: Todas as queries filtram por `company_id` do usuário logado via RLS.

## Supabase Database

**Schema location**: `supabase/migrations/000_schema.sql`

**Tabelas principais:**

```
TENANTS:
- companies           # Empresas SaaS (tenants)
- profiles            # Usuários (estende auth.users)

CRM:
- contacts            # Contatos
- crm_companies       # Empresas dos clientes
- deals               # Negócios/Oportunidades
- deal_items          # Produtos do deal
- activities          # Tarefas e reuniões
- boards              # Quadros kanban
- board_stages        # Colunas dos quadros
- tags                # Etiquetas
- products            # Catálogo de produtos

CONFIG:
- lifecycle_stages    # Estágios do funil (Lead, MQL, etc)
- user_settings       # Preferências do usuário

AI:
- ai_conversations    # Histórico chat IA
- ai_decisions        # Fila sugestões IA
- ai_audio_notes      # Áudios transcritos
```

**Edge Functions** (`supabase/functions/`):

- `setup-instance` - Onboarding: cria company + admin
- `create-user` - Cria usuário na company
- `delete-user` - Remove usuário
- `list-users` - Lista usuários da company
- `invite-users` - Convite em batch

**RLS Best Practices:**

- Use `(select auth.uid())` nas policies (não `auth.uid()` direto) - 20x mais rápido
- `TO authenticated` em todas as policies
- Índices em `company_id`, `owner_id`, todas as FKs
- `ON DELETE CASCADE` ou `SET NULL` nas FKs
- `TIMESTAMPTZ` para datas (não `TIMESTAMP`)

## ⚠️ VALIDAÇÃO DE DADOS - REGRAS OBRIGATÓRIAS

**NUNCA passe dados diretamente para o Supabase sem validar!**

### Utilitários de Sanitização (`lib/supabase/utils.ts`):

```typescript
import { sanitizeUUID, requireUUID, sanitizeText } from '@/lib/supabase/utils';

// Campos FK OPCIONAIS: sanitizeUUID (retorna null se inválido)
contact_id: sanitizeUUID(deal.contactId),  // "" → null, "abc" → null

// Campos FK OBRIGATÓRIOS: requireUUID (lança erro se inválido)
board_id: requireUUID(deal.boardId, 'Board ID'),  // Erro se vazio

// Texto opcional: sanitizeText (retorna null se vazio)
notes: sanitizeText(contact.notes),  // "  " → null
```

### Regras de IDs:

```
company_id  = Tenant ID (quem PAGA pelo SaaS) - vem do auth/profile
crm_company_id = Empresa DO CLIENTE do usuário - cadastrada no CRM

NUNCA confunda os dois! 
- company_id: segurança multi-tenant (RLS)
- crm_company_id: relacionamento de negócio
```

### Ao criar/editar Services:

1. **Importe os utils**: `import { sanitizeUUID, requireUUID } from './utils'`
2. **Campos FK obrigatórios**: Use `requireUUID(value, 'NomeCampo')`
3. **Campos FK opcionais**: Use `sanitizeUUID(value)`
4. **Valide existência**: Para FKs críticas (board_id), verifique se existe no banco ANTES de inserir
5. **NUNCA passe string vazia** para campos UUID - sempre null ou UUID válido

## AI Integration (Gemini)

**Service location**: `services/geminiService.ts`

Key functions:

- `chatWithCRM()` - Agentic chat with function calling
- `analyzeLead()` - Deal analysis with structured JSON output
- `parseLeadFromText()` - "Magic Import" for unstructured data
- `generateRescueMessage()` - Context-aware messages by channel
- `processAudioNote()` - Voice transcription

API key: `import.meta.env.VITE_GEMINI_API_KEY`

## Testing

**Framework**: Vitest + React Testing Library + happy-dom

```bash
npm test          # Watch mode
npm run test:run  # Single run
npm run test:ui   # Browser UI
```

**Test utils** (`test/test-utils.tsx`): Custom render wraps all providers:

```tsx
import { render, screen } from '@/test/test-utils';
// Wraps: QueryClientProvider, AuthProvider, ThemeProvider, ToastProvider
```

**Mocks** (`test/__mocks__/supabase.ts`): All Supabase services mocked.

## Commands

```bash
npm run dev        # Dev server (porta 3003)
npm run build      # Production build
npm test           # Run tests in watch mode
npm run test:run   # Single run
npx tsc --noEmit   # Type check
```

## Common Tasks

**Adding a new feature page**:

1. Create `src/features/<name>/` with Page, components/, hooks/
2. Create TanStack Query hooks in `lib/query/hooks/`
3. Create Supabase service in `lib/supabase/`
4. Create controller hook using the Query hooks
5. Add route in `App.tsx`
6. Add nav item in `components/Layout.tsx`

**Adding entity operations**:

1. Add service methods in `lib/supabase/<entity>.ts`
2. Add Query hooks in `lib/query/hooks/use<Entity>Query.ts`
3. Export from `lib/query/hooks/index.ts`
4. Use in controller hooks

**Adding Supabase table**:

1. Add migration in `supabase/migrations/`
2. Add RLS policies with `(select auth.uid())` pattern
3. Add indexes on company_id, owner_id, FKs
4. Create service in `lib/supabase/`
5. Create Query hooks
