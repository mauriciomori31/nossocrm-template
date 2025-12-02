# 🚀 Visão: Setup Wizard Automatizado (Futuro)

> **Status:** Ideia para implementação futura
> **Prioridade:** Médio prazo (após validar deploy manual)
> **Impacto:** Alto - reduz tempo de setup de 5-7 min para 2-3 min

---

## Problema Atual

Atualmente, alunos precisam:
1. Criar projeto Supabase manualmente
2. Copiar/colar env vars
3. Configurar GitHub Secrets
4. Aguardar GitHub Actions rodar

**Tempo total:** ~5-7 minutos (com ~3-4 minutos de trabalho manual)

---

## Visão: Setup Wizard Automatizado

Um **Web App** ou **CLI Tool** que automatiza todo o processo usando APIs da Vercel e Supabase.

### Experiência Ideal do Aluno:

```
1. Acessa: https://setup.nossocrm.com
2. Clica: "Conectar com GitHub"
3. Clica: "Conectar com Vercel" (ou cola token)
4. Clica: "Conectar com Supabase" (ou cola token)
5. Clica: "Criar Meu CRM!"
6. Aguarda 2-3 minutos...
7. ✅ Recebe URL pronta: https://meu-crm.vercel.app
```

**Tempo total:** ~2-3 minutos (10 segundos de trabalho manual)

---

## Arquitetura Proposta

### Tech Stack

```
Frontend:    Next.js 14+ (App Router)
Styling:     Tailwind CSS (mesmo do CRM)
Auth:        NextAuth.js com GitHub OAuth
Backend:     Next.js API Routes
Database:    Supabase (para tracking de deploys)
Deploy:      Vercel
```

### APIs Necessárias

#### 1. Vercel API

**Criar Deployment:**
```typescript
POST https://api.vercel.com/v13/deployments
Authorization: Bearer <VERCEL_TOKEN>

{
  "name": "meu-crm",
  "gitSource": {
    "type": "github",
    "repo": "usuario/crmia",
    "ref": "main"
  },
  "env": {
    "VITE_SUPABASE_URL": "...",
    "VITE_SUPABASE_ANON_KEY": "..."
  }
}
```

**Documentação:**
- https://vercel.com/docs/rest-api/endpoints/deployments

#### 2. Supabase Management API

**Criar Projeto:**
```typescript
POST https://api.supabase.com/v1/projects
Authorization: Bearer <SUPABASE_TOKEN>

{
  "name": "meu-crm",
  "organization_id": "...",
  "region": "sa-east-1",
  "plan": "free"
}
```

**Executar Migrations (via CLI):**
```bash
# Rodado programaticamente no backend
supabase link --project-ref <project-id>
supabase db push
```

**Documentação:**
- https://supabase.com/docs/guides/platform/api

---

## Estrutura do Projeto

```
setup-wizard/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── setup/
│   │   ├── page.tsx               # Wizard principal
│   │   ├── components/
│   │   │   ├── StepConnect.tsx    # Passo 1: Conexões
│   │   │   ├── StepConfigure.tsx  # Passo 2: Configurações
│   │   │   └── StepDeploy.tsx     # Passo 3: Deploy
│   │   └── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx               # Ver deployments do aluno
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/     # NextAuth config
│       ├── vercel/
│       │   ├── create-project/    # Cria projeto Vercel
│       │   └── check-status/      # Verifica status deploy
│       ├── supabase/
│       │   ├── create-project/    # Cria projeto Supabase
│       │   ├── run-migrations/    # Roda migrations
│       │   └── deploy-functions/  # Deploy edge functions
│       └── deploy/
│           └── orchestrate/       # Orquestra tudo
│
├── lib/
│   ├── clients/
│   │   ├── vercel.ts              # Wrapper Vercel API
│   │   ├── supabase-mgmt.ts       # Wrapper Supabase Management API
│   │   └── github.ts              # GitHub API (opcional)
│   ├── db/
│   │   └── schema.sql             # Tracking de deployments
│   └── utils/
│       ├── migrations.ts          # Lógica de migrations
│       └── validation.ts          # Validação de tokens
│
├── public/
│   ├── migrations/                # Cópia das migrations do CRM
│   └── functions/                 # Cópia das edge functions
│
└── package.json
```

---

## Fluxo Detalhado

### 1. Landing Page (`/`)

```tsx
// app/page.tsx

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1>Setup Automático - NossoCRM</h1>
        <p>Deploy seu CRM em 2 minutos, sem configuração manual</p>

        <div className="grid grid-cols-3 gap-4 my-8">
          <Card>
            <Icon>🔗</Icon>
            <Title>Conecte</Title>
            <Text>GitHub, Vercel e Supabase</Text>
          </Card>

          <Card>
            <Icon>⚙️</Icon>
            <Title>Configure</Title>
            <Text>Nome do projeto e região</Text>
          </Card>

          <Card>
            <Icon>🚀</Icon>
            <Title>Deploy</Title>
            <Text>Tudo pronto em 2 minutos</Text>
          </Card>
        </div>

        <Button href="/setup">Começar Agora</Button>
      </div>
    </div>
  );
}
```

### 2. Wizard de Setup (`/setup`)

**Step 1: Conectar Contas**

```tsx
// app/setup/components/StepConnect.tsx

export function StepConnect({ onComplete }) {
  const [githubConnected, setGithubConnected] = useState(false);
  const [vercelToken, setVercelToken] = useState('');
  const [supabaseToken, setSupabaseToken] = useState('');

  return (
    <div>
      <h2>Conecte suas contas</h2>

      {/* GitHub OAuth */}
      <Button onClick={signIn('github')}>
        {githubConnected ? '✅' : '🔗'} Conectar GitHub
      </Button>

      {/* Vercel - OAuth ou Token */}
      <div>
        <Button onClick={connectVercel}>🔗 Conectar Vercel</Button>
        <span>ou</span>
        <Input
          placeholder="Token da Vercel"
          value={vercelToken}
          onChange={(e) => setVercelToken(e.target.value)}
        />
      </div>

      {/* Supabase - Token */}
      <div>
        <Input
          placeholder="Token do Supabase"
          value={supabaseToken}
          onChange={(e) => setSupabaseToken(e.target.value)}
        />
        <Link href="https://supabase.com/dashboard/account/tokens">
          Como obter token?
        </Link>
      </div>

      <Button
        onClick={() => onComplete({ vercelToken, supabaseToken })}
        disabled={!githubConnected || !vercelToken || !supabaseToken}
      >
        Próximo
      </Button>
    </div>
  );
}
```

**Step 2: Configurar Projeto**

```tsx
// app/setup/components/StepConfigure.tsx

export function StepConfigure({ onComplete }) {
  const [projectName, setProjectName] = useState('');
  const [region, setRegion] = useState('sa-east-1');

  return (
    <div>
      <h2>Configure seu projeto</h2>

      <Input
        label="Nome do Projeto"
        placeholder="meu-crm"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />

      <Select
        label="Região do Supabase"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="sa-east-1">São Paulo (Brasil)</option>
        <option value="us-east-1">Virgínia (EUA)</option>
        <option value="eu-west-1">Irlanda (Europa)</option>
      </Select>

      <Button onClick={() => onComplete({ projectName, region })}>
        Próximo
      </Button>
    </div>
  );
}
```

**Step 3: Deploy**

```tsx
// app/setup/components/StepDeploy.tsx

export function StepDeploy({ tokens, config }) {
  const [status, setStatus] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [deploymentUrl, setDeploymentUrl] = useState('');

  useEffect(() => {
    startDeploy();
  }, []);

  async function startDeploy() {
    setStatus('deploying');

    // Chama API que orquestra tudo
    const response = await fetch('/api/deploy/orchestrate', {
      method: 'POST',
      body: JSON.stringify({ tokens, config })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const log = decoder.decode(value);
      setLogs(prev => [...prev, log]);
    }

    setStatus('completed');
  }

  return (
    <div>
      <h2>Fazendo deploy...</h2>

      <ProgressBar status={status} />

      <LogViewer logs={logs} />

      {status === 'completed' && (
        <div>
          <h3>✅ Deploy concluído!</h3>
          <p>Seu CRM está pronto em:</p>
          <a href={deploymentUrl}>{deploymentUrl}</a>

          <Button href={deploymentUrl}>Acessar Meu CRM</Button>
        </div>
      )}
    </div>
  );
}
```

### 3. API de Orquestração

```typescript
// app/api/deploy/orchestrate/route.ts

export async function POST(req: Request) {
  const { tokens, config } = await req.json();
  const encoder = new TextEncoder();

  // Streaming response para mostrar progresso
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Criar projeto Supabase
        controller.enqueue(encoder.encode('📦 Criando projeto Supabase...\n'));
        const supabaseProject = await createSupabaseProject({
          token: tokens.supabaseToken,
          name: config.projectName,
          region: config.region
        });
        controller.enqueue(encoder.encode('✅ Projeto Supabase criado!\n'));

        // 2. Aguardar projeto ficar pronto
        controller.enqueue(encoder.encode('⏳ Aguardando inicialização...\n'));
        await waitForSupabaseReady(supabaseProject.id, tokens.supabaseToken);

        // 3. Rodar migrations
        controller.enqueue(encoder.encode('🗄️ Executando migrations...\n'));
        await runMigrations(supabaseProject.id, tokens.supabaseToken);
        controller.enqueue(encoder.encode('✅ Migrations aplicadas!\n'));

        // 4. Deploy edge functions
        controller.enqueue(encoder.encode('⚡ Deployando Edge Functions...\n'));
        await deployEdgeFunctions(supabaseProject.id, tokens.supabaseToken);
        controller.enqueue(encoder.encode('✅ Edge Functions deployadas!\n'));

        // 5. Criar deployment Vercel
        controller.enqueue(encoder.encode('🚀 Criando deploy no Vercel...\n'));
        const vercelDeployment = await createVercelDeployment({
          token: tokens.vercelToken,
          name: config.projectName,
          env: {
            VITE_SUPABASE_URL: supabaseProject.url,
            VITE_SUPABASE_ANON_KEY: supabaseProject.anonKey
          }
        });
        controller.enqueue(encoder.encode('✅ Deploy Vercel criado!\n'));

        // 6. Aguardar build
        controller.enqueue(encoder.encode('🔨 Fazendo build...\n'));
        await waitForVercelReady(vercelDeployment.id, tokens.vercelToken);

        // 7. Salvar no DB (tracking)
        await saveDeployment({
          userId: session.user.id,
          projectName: config.projectName,
          vercelUrl: vercelDeployment.url,
          supabaseUrl: supabaseProject.url
        });

        controller.enqueue(encoder.encode(`✅ Pronto! ${vercelDeployment.url}\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`❌ Erro: ${error.message}\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

### 4. Clientes das APIs

```typescript
// lib/clients/supabase-mgmt.ts

export class SupabaseManagementClient {
  constructor(private token: string) {}

  async createProject(params: {
    name: string;
    organizationId: string;
    region: string;
  }) {
    const response = await fetch('https://api.supabase.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Falha ao criar projeto: ${response.statusText}`);
    }

    return response.json();
  }

  async waitUntilReady(projectId: string) {
    // Poll até projeto ficar "ACTIVE_HEALTHY"
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos

    while (attempts < maxAttempts) {
      const status = await this.getProjectStatus(projectId);

      if (status === 'ACTIVE_HEALTHY') {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Timeout aguardando projeto Supabase');
  }
}
```

```typescript
// lib/clients/vercel.ts

export class VercelClient {
  constructor(private token: string) {}

  async createDeployment(params: {
    name: string;
    gitSource: {
      type: 'github';
      repo: string;
      ref: string;
    };
    env: Record<string, string>;
  }) {
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Falha ao criar deployment: ${response.statusText}`);
    }

    return response.json();
  }

  async waitUntilReady(deploymentId: string) {
    // Poll até deployment ficar "READY"
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      const deployment = await this.getDeployment(deploymentId);

      if (deployment.readyState === 'READY') {
        return deployment;
      }

      if (deployment.readyState === 'ERROR') {
        throw new Error('Deployment falhou');
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Timeout aguardando deployment Vercel');
  }
}
```

---

## Features Adicionais

### 1. Dashboard de Deployments

```tsx
// app/dashboard/page.tsx

export default function Dashboard() {
  const { data: deployments } = useQuery('deployments', fetchMyDeployments);

  return (
    <div>
      <h1>Meus CRMs</h1>

      <Grid>
        {deployments.map(deploy => (
          <Card key={deploy.id}>
            <h3>{deploy.projectName}</h3>
            <Status status={deploy.status} />
            <Link href={deploy.vercelUrl}>Acessar</Link>
            <Button onClick={() => deleteDeployment(deploy.id)}>
              Deletar
            </Button>
          </Card>
        ))}
      </Grid>

      <Button href="/setup">+ Novo CRM</Button>
    </div>
  );
}
```

### 2. Logs e Troubleshooting

- Salvar logs de cada deploy
- Se falhar, mostrar erro específico
- Botão "Tentar novamente"
- Link para documentação relevante

### 3. Gestão de Recursos

- Mostrar quotas usadas (Vercel, Supabase)
- Alertar quando perto do limite free tier
- Sugerir upgrade se necessário

---

## Vantagens vs. Abordagem Manual

| Aspecto | Manual (GitHub Actions) | Wizard Automatizado |
|---------|------------------------|---------------------|
| **Tempo** | 5-7 min | 2-3 min |
| **Trabalho manual** | 3-4 min | 10 segundos |
| **Passos** | 8 passos | 3 cliques |
| **Erros** | Aluno pode errar em vários pontos | Validação automática |
| **Didático** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **UX** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Manutenção** | Zero (só docs) | Precisa manter o wizard |

---

## Roadmap Sugerido

### Fase 1: MVP (2-3 semanas)
- [ ] Setup básico Next.js
- [ ] Integração Vercel API
- [ ] Integração Supabase API
- [ ] Fluxo básico de deploy (sem OAuth)
- [ ] Validação e error handling

### Fase 2: Melhorias (1-2 semanas)
- [ ] OAuth com GitHub
- [ ] OAuth com Vercel (se possível)
- [ ] Dashboard de deployments
- [ ] Logs detalhados
- [ ] Retry automático em falhas

### Fase 3: Polimento (1 semana)
- [ ] UI/UX melhorada
- [ ] Animações de progresso
- [ ] Documentação
- [ ] Testes E2E
- [ ] Deploy do wizard

### Fase 4: Advanced (futuro)
- [ ] CLI tool alternativo
- [ ] Suporte a templates diferentes
- [ ] Gestão de múltiplas instâncias
- [ ] Backups automáticos
- [ ] Monitoramento

---

## Considerações Técnicas

### Segurança

**Tokens:**
- NUNCA armazenar tokens em plaintext
- Criptografar tokens antes de salvar no DB
- Usar tokens de curta duração quando possível
- Permitir revogação de tokens

**Validação:**
- Validar todos os inputs
- Rate limiting nas APIs
- CSRF protection
- Sanitização de nomes de projetos

### Performance

**Polling:**
- Usar WebSockets ou Server-Sent Events ao invés de polling
- Implementar exponential backoff
- Timeout adequado

**Concorrência:**
- Limitar deploys simultâneos por usuário
- Queue para processar deploys

### Custos

**APIs:**
- Vercel API: Grátis
- Supabase Management API: Grátis
- GitHub API: Grátis (com rate limits)

**Infraestrutura:**
- Vercel Hobby: Grátis (suficiente)
- Supabase Free: Grátis (para tracking)

**Escalabilidade:**
- Se muitos alunos usarem, pode precisar upgrade
- Implementar caching quando possível

---

## Alternativa: CLI Tool

Se Web App for muito complexo, considerar CLI:

```bash
npx create-nossocrm
```

**Prós:**
- Mais simples de implementar
- Não precisa hospedar nada
- Perfeito para desenvolvedores

**Contras:**
- Alunos precisam ter Node instalado
- Menos visual
- Mais difícil de debugar

---

## Conclusão

Esta visão representa a **experiência ideal** para alunos instalarem o NossoCRM.

**Próximos passos:**
1. Implementar abordagem manual (GitHub Actions) primeiro
2. Validar com alunos reais
3. Coletar feedback sobre dificuldades
4. Decidir se vale a pena construir o wizard
5. Se sim, seguir roadmap acima

**Quando implementar:**
- Após pelo menos 20-30 alunos usarem a versão manual
- Quando houver clareza sobre os pontos de dor
- Quando houver tempo/recursos para manter o wizard

---

**Documentado em:** 2024-12-01
**Por:** Thales Laray
**Status:** Planejamento futuro
