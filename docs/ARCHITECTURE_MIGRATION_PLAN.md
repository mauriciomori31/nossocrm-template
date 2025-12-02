# Plano de Migração: Unificar Estado com TanStack Query

## ✅ MIGRAÇÃO COMPLETA

**Data**: 2 de dezembro de 2025
**Status**: Todas as 5 fases concluídas com sucesso
**Testes**: 453 passando

---

## 📋 Resumo Executivo

**Problema resolvido**: Arquitetura híbrida causava bugs de sincronização.
- Antes: Context tinha `useState` + TanStack Query tinha cache próprio = sync manual = bugs
- Depois: TanStack Query é a fonte única de verdade para server state

## 🎯 Resultado Final

| Context | Antes | Depois |
|---------|-------|--------|
| ContactsContext | useState | useTanStackContacts() |
| ActivitiesContext | useState | useTanStackActivities() |
| BoardsContext | useState (boards) | useTanStackBoards() |
| DealsContext | useState + sync manual | useTanStackDealsQuery() |
| CRMContext | Orquestrador | Orquestrador (inalterado) |

**UI State preservado**: `activeBoardId` permanece em useState (é UI state, não server state)

## 📊 Estado Atual vs Estado Futuro

### Contexts Atuais
```
context/
├── deals/DealsContext.tsx      → Tem rawDeals useState (REMOVER)
├── contacts/ContactsContext.tsx → Tem contacts useState (REMOVER)  
├── activities/ActivitiesContext.tsx → Tem activities useState (REMOVER)
├── boards/BoardsContext.tsx    → Tem boards useState (MANTER: contém activeBoardId UI state)
├── settings/SettingsContext.tsx → Config/UI state (MANTER)
└── CRMContext.tsx              → Orquestrador (SIMPLIFICAR)
```

### TanStack Query Hooks Atuais (já existem!)
```
lib/query/hooks/
├── useDealsQuery.ts     ✅ useDeals, useDeal, useCreateDeal, useUpdateDeal, useDeleteDeal
├── useContactsQuery.ts  ✅ useContacts, useContact, useCreateContact, useUpdateContact, useDeleteContact
├── useActivitiesQuery.ts ✅ useActivities, useCreateActivity, useUpdateActivity, useDeleteActivity
└── useBoardsQuery.ts    ✅ useBoards, useCreateBoard, useUpdateBoard, useDeleteBoard
```

## 🚀 Plano de Migração (5 Fases)

---

### Fase 1: Contacts (Mais Simples)

**Risco**: Baixo - Contacts não tem lógica complexa

#### 1.1 Criar teste de integração
```bash
# Criar teste que verifica comportamento atual
npm run test:run -- src/features/contacts/
```

#### 1.2 Modificar ContactsContext
- Remover useState de `contacts` e `companies`
- Usar `useContacts()` e `useCompanies()` do TanStack Query
- Manter `companyMap` e `contactMap` como derivados

#### 1.3 Atualizar páginas que usam ContactsContext
- `ContactsPage` → já usa controller, mínima mudança
- Verificar que `useCRM().contacts` ainda funciona

#### 1.4 Rodar testes
```bash
npm test
```

---

### Fase 2: Activities

**Risco**: Baixo - Similar a Contacts

#### 2.1 Modificar ActivitiesContext
- Remover useState de `activities`
- Usar `useActivities()` do TanStack Query

#### 2.2 Verificar componentes
- `AIAssistant.tsx` usa activities
- `DealDetailModal` mostra activities

---

### Fase 3: Boards (Cuidado!)

**Risco**: Médio - `activeBoardId` é UI state

#### 3.1 Separar concerns
- `boards` lista → TanStack Query
- `activeBoardId` → manter em Context ou Zustand

#### 3.2 Modificar BoardsContext
```tsx
// ANTES
const [boards, setBoards] = useState<Board[]>([]);
const [activeBoardId, setActiveBoardId] = useState<string>('');

// DEPOIS
const { data: boards = [] } = useBoards();
const [activeBoardId, setActiveBoardId] = useState<string>(''); // UI state permanece
```

---

### Fase 4: Deals (Mais Complexo)

**Risco**: Alto - Tem lógica de negócio complexa

#### 4.1 Identificar lógica que NÃO pode ir pro TanStack Query
```tsx
// Em CRMContext.tsx - estas funções ficam no Context:
const addDeal = async (...) => {
  // Cria company se não existe
  // Cria contact se não existe  
  // Cria deal
  // Cria activity "Negócio Criado"
  // LinkedStage automation
}

const moveDeal = async (...) => {
  // Update deal status
  // Cria activity
  // LinkedStage: atualiza contact stage
  // NextBoard automation
}
```

#### 4.2 Modificar DealsContext
- Remover `rawDeals` useState
- Usar `useDeals()` do TanStack Query
- Manter funções que orquestram múltiplas operações

#### 4.3 Atualizar CRMContext
- `deals` (view projection) → derivado do TanStack Query
- Funções complexas continuam no Context

---

### Fase 5: Simplificar CRMContext

#### 5.1 CRMContext final será:
```tsx
// Orquestrador de lógica de negócio complexa
export const CRMInnerProvider = ({ children }) => {
  // Consome TanStack Query
  const { data: deals = [] } = useDeals();
  const { data: contacts = [] } = useContacts();
  const { data: boards = [] } = useBoards();
  
  // UI State
  const [activeBoardId, setActiveBoardId] = useState('');
  
  // Mutations
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  
  // Lógica de negócio complexa
  const addDealWithRelations = async (...) => { ... };
  const moveDealWithAutomations = async (...) => { ... };
  const convertContactToDeal = async (...) => { ... };
  
  return <CRMContext.Provider value={...}>{children}</CRMContext.Provider>;
};
```

---

## ✅ Checklist de Segurança

### Antes de cada fase:
- [ ] Rodar `npm test` - todos testes passando
- [ ] Rodar `npx tsc --noEmit` - sem erros de tipo
- [ ] Testar manualmente no browser

### Depois de cada fase:
- [ ] Commit com mensagem descritiva
- [ ] Deploy para staging/preview
- [ ] Teste manual das funcionalidades afetadas

### Funcionalidades a testar manualmente:
- [ ] Criar contact → aparece na lista
- [ ] Criar deal → aparece no Kanban
- [ ] Mover deal (drag & drop) → posição atualiza
- [ ] Abrir deal modal → dados corretos
- [ ] Converter contact em deal → deal aparece
- [ ] Deletar contact com deals → confirmação funciona

---

## 🛡️ Rollback Strategy

Cada fase terá seu próprio commit. Se algo quebrar:

```bash
git revert HEAD  # Reverte última fase
npm test         # Confirma testes passam
git push         # Deploy revert
```

---

## 📅 Cronograma Sugerido

| Fase | Estimativa | Risco |
|------|------------|-------|
| Fase 1: Contacts | 30 min | Baixo |
| Fase 2: Activities | 30 min | Baixo |
| Fase 3: Boards | 45 min | Médio |
| Fase 4: Deals | 1-2h | Alto |
| Fase 5: Cleanup | 30 min | Baixo |

**Total**: ~4 horas de trabalho focado

---

## 🎁 Benefícios Após Migração

1. **Sem bugs de sync** - Uma fonte de verdade
2. **DevTools melhores** - React Query DevTools mostra tudo
3. **Menos código** - Remove useStates e useEffects de sync
4. **Cache automático** - Menos requests
5. **Optimistic updates** - UI instantânea

---

## ⚠️ Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Quebrar funcionalidade existente | Testes antes/depois de cada fase |
| Performance regression | staleTime configurado adequadamente |
| Perder dados em cache | invalidateQueries nos lugares certos |
| Realtime para de funcionar | Verificar useRealtimeSync após migração |

---

## 🔄 Próximos Passos

1. **Aprovar este plano**
2. **Começar pela Fase 1 (Contacts)**
3. **Commit e test após cada fase**
4. **Deploy final após Fase 5**

---

Quer que eu comece a implementação pela Fase 1 (Contacts)?
