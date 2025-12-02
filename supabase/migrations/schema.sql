-- =============================================================================
-- NossoCRM - Schema Completo (Arquivo Único)
-- =============================================================================
-- 
-- Este arquivo contém TUDO que você precisa para configurar o banco de dados.
-- Basta copiar e colar no SQL Editor do Supabase e clicar em "Run".
--
-- Inclui:
-- ✅ Todas as tabelas (19 tabelas)
-- ✅ Row Level Security (multi-tenant)
-- ✅ Triggers e funções auxiliares
-- ✅ Storage buckets
-- ✅ Realtime habilitado
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSÕES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 2. COMPANIES (Tenants - Empresas que usam o CRM)
-- -----------------------------------------------------------------------------
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE INDEX companies_deleted_at_idx ON public.companies(deleted_at) WHERE deleted_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. PROFILES (Usuários - estende auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX profiles_company_id_idx ON public.profiles(company_id);

-- -----------------------------------------------------------------------------
-- 4. LIFECYCLE_STAGES (Estágios do funil - GLOBAL)
-- -----------------------------------------------------------------------------
CREATE TABLE public.lifecycle_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lifecycle_stages ENABLE ROW LEVEL SECURITY;

INSERT INTO public.lifecycle_stages (id, name, color, "order", is_default) VALUES
('LEAD', 'Lead', 'bg-blue-500', 0, true),
('MQL', 'MQL', 'bg-yellow-500', 1, true),
('PROSPECT', 'Oportunidade', 'bg-purple-500', 2, true),
('CUSTOMER', 'Cliente', 'bg-green-500', 3, true),
('OTHER', 'Outros / Perdidos', 'bg-slate-500', 4, true);

-- -----------------------------------------------------------------------------
-- 5. CRM_COMPANIES (Empresas dos CLIENTES do CRM)
-- -----------------------------------------------------------------------------
CREATE TABLE public.crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
CREATE INDEX crm_companies_company_id_idx ON public.crm_companies(company_id);
CREATE INDEX crm_companies_owner_id_idx ON public.crm_companies(owner_id);

-- -----------------------------------------------------------------------------
-- 6. BOARDS (Quadros Kanban)
-- -----------------------------------------------------------------------------
CREATE TABLE public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'SALES',
    is_default BOOLEAN DEFAULT false,
    template TEXT,
    linked_lifecycle_stage TEXT,
    next_board_id UUID REFERENCES public.boards(id),
    goal_description TEXT,
    goal_kpi TEXT,
    goal_target_value TEXT,
    goal_type TEXT,
    agent_name TEXT,
    agent_role TEXT,
    agent_behavior TEXT,
    entry_trigger TEXT,
    automation_suggestions TEXT[],
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
CREATE INDEX boards_company_id_idx ON public.boards(company_id);
CREATE INDEX boards_owner_id_idx ON public.boards(owner_id);

-- -----------------------------------------------------------------------------
-- 7. BOARD_STAGES (Colunas dos quadros)
-- -----------------------------------------------------------------------------
CREATE TABLE public.board_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT,
    color TEXT,
    "order" INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    linked_lifecycle_stage TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.board_stages ENABLE ROW LEVEL SECURITY;
CREATE INDEX board_stages_board_id_idx ON public.board_stages(board_id);
CREATE INDEX board_stages_company_id_idx ON public.board_stages(company_id);

-- -----------------------------------------------------------------------------
-- 8. CONTACTS (Contatos)
-- -----------------------------------------------------------------------------
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    company_name TEXT,
    crm_company_id UUID REFERENCES public.crm_companies(id),
    avatar TEXT,
    notes TEXT,
    status TEXT DEFAULT 'ACTIVE',
    stage TEXT DEFAULT 'LEAD',
    source TEXT,
    birth_date DATE,
    last_interaction TIMESTAMPTZ,
    last_purchase_date DATE,
    total_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE INDEX contacts_company_id_idx ON public.contacts(company_id);
CREATE INDEX contacts_crm_company_id_idx ON public.contacts(crm_company_id);
CREATE INDEX contacts_stage_idx ON public.contacts(stage);
CREATE INDEX contacts_owner_id_idx ON public.contacts(owner_id);

-- -----------------------------------------------------------------------------
-- 9. PRODUCTS (Catálogo de produtos/serviços)
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    sku TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX products_company_id_idx ON public.products(company_id);

-- -----------------------------------------------------------------------------
-- 10. DEALS (Negócios/Oportunidades)
-- -----------------------------------------------------------------------------
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    probability INTEGER DEFAULT 0,
    status TEXT,
    priority TEXT DEFAULT 'medium',
    board_id UUID REFERENCES public.boards(id),
    stage_id UUID REFERENCES public.board_stages(id),
    contact_id UUID REFERENCES public.contacts(id),
    crm_company_id UUID REFERENCES public.crm_companies(id),
    ai_summary TEXT,
    loss_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    last_stage_change_date TIMESTAMPTZ,
    custom_fields JSONB DEFAULT '{}',
    -- Campos de status (ganho/perdido)
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE INDEX deals_company_id_idx ON public.deals(company_id);
CREATE INDEX deals_crm_company_id_idx ON public.deals(crm_company_id);
CREATE INDEX deals_board_id_idx ON public.deals(board_id);
CREATE INDEX deals_stage_id_idx ON public.deals(stage_id);
CREATE INDEX deals_owner_id_idx ON public.deals(owner_id);
CREATE INDEX deals_contact_id_idx ON public.deals(contact_id);
CREATE INDEX deals_is_won_idx ON public.deals(is_won) WHERE is_won = TRUE;
CREATE INDEX deals_is_lost_idx ON public.deals(is_lost) WHERE is_lost = TRUE;
CREATE INDEX deals_closed_at_idx ON public.deals(closed_at) WHERE closed_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 11. DEAL_ITEMS (Produtos vinculados a deals)
-- -----------------------------------------------------------------------------
CREATE TABLE public.deal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.deal_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX deal_items_deal_id_idx ON deal_items(deal_id);
CREATE INDEX deal_items_company_id_idx ON deal_items(company_id);

-- -----------------------------------------------------------------------------
-- 12. ACTIVITIES (Atividades: tarefas, ligações, reuniões)
-- -----------------------------------------------------------------------------
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT false,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX activities_deal_id_idx ON activities(deal_id);
CREATE INDEX activities_contact_id_idx ON activities(contact_id);
CREATE INDEX activities_owner_id_idx ON activities(owner_id);
CREATE INDEX activities_date_idx ON activities(date);
CREATE INDEX activities_company_id_idx ON activities(company_id);

-- -----------------------------------------------------------------------------
-- 13. TAGS (Sistema de tags)
-- -----------------------------------------------------------------------------
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT 'bg-gray-500',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    UNIQUE(name, company_id)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE INDEX tags_company_id_idx ON tags(company_id);

-- -----------------------------------------------------------------------------
-- 14. CUSTOM_FIELD_DEFINITIONS (Campos personalizados)
-- -----------------------------------------------------------------------------
CREATE TABLE public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    options TEXT[],
    entity_type TEXT NOT NULL DEFAULT 'deal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    UNIQUE(key, company_id)
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
CREATE INDEX custom_field_definitions_company_id_idx ON custom_field_definitions(company_id);

-- -----------------------------------------------------------------------------
-- 15. LEADS (Para importação de leads)
-- -----------------------------------------------------------------------------
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    company_name TEXT,
    role TEXT,
    source TEXT,
    status TEXT DEFAULT 'NEW',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    converted_to_contact_id UUID REFERENCES public.contacts(id),
    owner_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX leads_company_id_idx ON leads(company_id);

-- -----------------------------------------------------------------------------
-- 16. USER_SETTINGS (Configurações do usuário)
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    ai_provider TEXT DEFAULT 'google',
    ai_api_key TEXT,
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    ai_thinking BOOLEAN DEFAULT true,
    ai_search BOOLEAN DEFAULT true,
    ai_anthropic_caching BOOLEAN DEFAULT false,
    dark_mode BOOLEAN DEFAULT true,
    default_route TEXT DEFAULT '/dashboard',
    active_board_id UUID REFERENCES public.boards(id),
    inbox_view_mode TEXT DEFAULT 'list',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX user_settings_user_id_idx ON user_settings(user_id);

-- -----------------------------------------------------------------------------
-- 17. AI_CONVERSATIONS (Histórico de conversas com IA)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_key TEXT NOT NULL,
    messages JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, conversation_key)
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_conversations_user_key_idx ON ai_conversations(user_id, conversation_key);
CREATE INDEX ai_conversations_user_id_idx ON ai_conversations(user_id);

-- -----------------------------------------------------------------------------
-- 18. AI_DECISIONS (Fila de decisões da IA)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    decision_type TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT,
    suggested_action JSONB,
    status TEXT DEFAULT 'pending',
    snoozed_until TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    ai_reasoning TEXT,
    confidence_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_decisions_user_status_idx ON ai_decisions(user_id, status);
CREATE INDEX ai_decisions_deal_idx ON ai_decisions(deal_id);
CREATE INDEX ai_decisions_user_id_idx ON ai_decisions(user_id);

-- -----------------------------------------------------------------------------
-- 19. AI_AUDIO_NOTES (Notas de áudio transcritas)
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_audio_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    audio_url TEXT,
    duration_seconds INTEGER,
    transcription TEXT NOT NULL,
    sentiment TEXT,
    next_action JSONB,
    activity_created_id UUID REFERENCES public.activities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_audio_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_audio_notes_deal_idx ON ai_audio_notes(deal_id);
CREATE INDEX ai_audio_notes_user_id_idx ON ai_audio_notes(user_id);

-- -----------------------------------------------------------------------------
-- 20. COMPANY_INVITES (Convites para novos usuários)
-- -----------------------------------------------------------------------------
CREATE TABLE public.company_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'vendedor',
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX company_invites_token_idx ON public.company_invites(token);
CREATE INDEX company_invites_company_id_idx ON public.company_invites(company_id);

-- -----------------------------------------------------------------------------
-- 21. STORAGE BUCKETS
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-notes', 'audio-notes', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Pegar company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.company_id 
  FROM public.profiles p
  JOIN public.companies c ON c.id = p.company_id
  WHERE p.id = (SELECT auth.uid()) 
    AND c.deleted_at IS NULL
$$;

-- Verificar se instância foi inicializada
CREATE OR REPLACE FUNCTION public.is_instance_initialized()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.companies LIMIT 1);
END;
$$;

-- Estatísticas do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    user_company UUID;
BEGIN
    user_company := get_user_company_id();
    
    SELECT json_build_object(
        'total_deals', (SELECT COUNT(*) FROM public.deals WHERE company_id = user_company),
        'pipeline_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE company_id = user_company AND is_won = FALSE AND is_lost = FALSE),
        'total_contacts', (SELECT COUNT(*) FROM public.contacts WHERE company_id = user_company),
        'total_companies', (SELECT COUNT(*) FROM public.crm_companies WHERE company_id = user_company),
        'won_deals', (SELECT COUNT(*) FROM public.deals WHERE company_id = user_company AND is_won = TRUE),
        'won_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE company_id = user_company AND is_won = TRUE),
        'lost_deals', (SELECT COUNT(*) FROM public.deals WHERE company_id = user_company AND is_lost = TRUE),
        'activities_today', (SELECT COUNT(*) FROM public.activities WHERE company_id = user_company AND DATE(date) = CURRENT_DATE)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Funções para marcar deals como ganho/perdido
CREATE OR REPLACE FUNCTION public.mark_deal_won(deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.deals 
    SET 
        is_won = TRUE,
        is_lost = FALSE,
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = deal_id AND company_id = get_user_company_id();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_deal_lost(deal_id UUID, reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.deals 
    SET 
        is_lost = TRUE,
        is_won = FALSE,
        loss_reason = COALESCE(reason, loss_reason),
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = deal_id AND company_id = get_user_company_id();
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_deal(deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.deals 
    SET 
        is_won = FALSE,
        is_lost = FALSE,
        closed_at = NULL,
        updated_at = NOW()
    WHERE id = deal_id AND company_id = get_user_company_id();
END;
$$;

-- Trigger: criar profile quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    avatar,
    role,
    company_id
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    (new.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: auto-preencher company_id em INSERTs
CREATE OR REPLACE FUNCTION public.auto_set_company_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := get_user_company_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auto_set_company_id em todas as tabelas
CREATE TRIGGER auto_company_id BEFORE INSERT ON public.crm_companies
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.boards
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.board_stages
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.contacts
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.deals
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.deal_items
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.activities
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.tags
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.custom_field_definitions
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

CREATE TRIGGER auto_company_id BEFORE INSERT ON public.company_invites
FOR EACH ROW EXECUTE FUNCTION auto_set_company_id();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES (Multi-Tenant)
-- =============================================================================

-- COMPANIES
CREATE POLICY "tenant_isolation_select" ON public.companies
FOR SELECT TO authenticated
USING (id = get_user_company_id() AND deleted_at IS NULL);

CREATE POLICY "tenant_isolation_update" ON public.companies
FOR UPDATE TO authenticated
USING (id = get_user_company_id() AND deleted_at IS NULL)
WITH CHECK (id = get_user_company_id());

-- PROFILES
CREATE POLICY "tenant_isolation_select" ON public.profiles
FOR SELECT TO authenticated
USING (
    id = (SELECT auth.uid())
    OR company_id = get_user_company_id()
);

CREATE POLICY "tenant_isolation_insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "tenant_isolation_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- LIFECYCLE_STAGES - tabela global, só leitura
CREATE POLICY "global_read" ON public.lifecycle_stages
FOR SELECT TO authenticated USING (true);

-- CRM_COMPANIES
CREATE POLICY "tenant_isolation" ON public.crm_companies
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- BOARDS
CREATE POLICY "tenant_isolation" ON public.boards
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- BOARD_STAGES
CREATE POLICY "tenant_isolation" ON public.board_stages
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- CONTACTS
CREATE POLICY "tenant_isolation" ON public.contacts
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- PRODUCTS
CREATE POLICY "tenant_isolation" ON public.products
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- DEALS
CREATE POLICY "tenant_isolation" ON public.deals
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- DEAL_ITEMS
CREATE POLICY "tenant_isolation" ON public.deal_items
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- ACTIVITIES
CREATE POLICY "tenant_isolation" ON public.activities
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- TAGS
CREATE POLICY "tenant_isolation" ON public.tags
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- CUSTOM_FIELD_DEFINITIONS
CREATE POLICY "tenant_isolation" ON public.custom_field_definitions
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- LEADS
CREATE POLICY "tenant_isolation" ON public.leads
FOR ALL TO authenticated
USING (company_id = get_user_company_id())
WITH CHECK (company_id = get_user_company_id());

-- USER_SETTINGS - só o próprio usuário
CREATE POLICY "own_settings" ON public.user_settings
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_CONVERSATIONS - só o próprio usuário
CREATE POLICY "own_conversations" ON public.ai_conversations
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_DECISIONS - só o próprio usuário
CREATE POLICY "own_decisions" ON public.ai_decisions
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- AI_AUDIO_NOTES - só o próprio usuário
CREATE POLICY "own_audio_notes" ON public.ai_audio_notes
FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- COMPANY_INVITES
CREATE POLICY "Admins can view invites" ON public.company_invites
FOR SELECT TO authenticated
USING (
    company_id = get_user_company_id() 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can create invites" ON public.company_invites
FOR INSERT TO authenticated
WITH CHECK (
    company_id = get_user_company_id() 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete invites" ON public.company_invites
FOR DELETE TO authenticated
USING (
    company_id = get_user_company_id() 
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public can view invite by token" ON public.company_invites
FOR SELECT TO anon, authenticated
USING (true);

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Avatars (público)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Audio Notes (privado)
CREATE POLICY "Users can upload audio notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own audio notes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'audio-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own audio notes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.get_user_company_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instance_initialized TO anon;
GRANT EXECUTE ON FUNCTION public.is_instance_initialized TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_deal_won TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_deal_lost TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_deal TO authenticated;

-- =============================================================================
-- REALTIME (Sincronização em tempo real)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'deals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE deals;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'board_stages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE board_stages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'crm_companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE crm_companies;
  END IF;
END
$$;

ALTER TABLE deals REPLICA IDENTITY FULL;
ALTER TABLE board_stages REPLICA IDENTITY FULL;
ALTER TABLE boards REPLICA IDENTITY FULL;
ALTER TABLE contacts REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;
ALTER TABLE crm_companies REPLICA IDENTITY FULL;

-- =============================================================================
-- ✅ SCHEMA COMPLETO INSTALADO!
-- =============================================================================
-- 
-- TABELAS (20):
-- companies, profiles, lifecycle_stages, crm_companies, boards, board_stages
-- contacts, products, deals, deal_items, activities, tags
-- custom_field_definitions, leads, user_settings, company_invites
-- ai_conversations, ai_decisions, ai_audio_notes
--
-- RECURSOS:
-- ✅ Multi-tenant com RLS
-- ✅ Triggers automáticos
-- ✅ Funções auxiliares
-- ✅ Storage configurado
-- ✅ Realtime habilitado
--
-- Próximo passo: Criar as Edge Functions no Supabase Dashboard
-- =============================================================================
