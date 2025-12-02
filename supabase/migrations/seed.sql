-- =============================================================================
-- SEED DE DEMONSTRAÇÃO COMPLETO - NossoCRM
-- =============================================================================
-- Execute este script APÓS o setup inicial (empresa + admin criados)
-- USA O BOARD EXISTENTE ao invés de criar novos
-- =============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_owner_id UUID;
    -- Board existente
    v_board_vendas UUID;
    -- Stages do board existente
    v_stage_novo UUID;
    v_stage_qualificacao UUID;
    v_stage_proposta UUID;
    v_stage_negociacao UUID;
    v_stage_fechamento UUID;
    -- Auxiliares
    v_contact_id UUID;
    v_deal_id UUID;
BEGIN
    -- Busca a empresa e usuário admin
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    SELECT id INTO v_owner_id FROM profiles WHERE company_id = v_company_id AND role = 'admin' LIMIT 1;
    
    IF v_company_id IS NULL OR v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Execute o setup inicial primeiro (criar empresa e admin)';
    END IF;

    -- ==========================================================================
    -- 1. BUSCAR BOARD EXISTENTE E SEUS STAGES
    -- ==========================================================================
    
    -- Pega o board default (Pipeline de Vendas)
    SELECT id INTO v_board_vendas FROM boards 
    WHERE company_id = v_company_id AND is_default = true 
    LIMIT 1;
    
    IF v_board_vendas IS NULL THEN
        -- Se não tem default, pega o primeiro
        SELECT id INTO v_board_vendas FROM boards 
        WHERE company_id = v_company_id 
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    IF v_board_vendas IS NULL THEN
        RAISE EXCEPTION 'Nenhum board encontrado. Crie um board primeiro.';
    END IF;

    -- Busca os stages do board (pela ordem)
    SELECT id INTO v_stage_novo FROM board_stages 
    WHERE board_id = v_board_vendas AND "order" = 0;
    
    SELECT id INTO v_stage_qualificacao FROM board_stages 
    WHERE board_id = v_board_vendas AND "order" = 1;
    
    SELECT id INTO v_stage_proposta FROM board_stages 
    WHERE board_id = v_board_vendas AND "order" = 2;
    
    SELECT id INTO v_stage_negociacao FROM board_stages 
    WHERE board_id = v_board_vendas AND "order" = 3;
    
    SELECT id INTO v_stage_fechamento FROM board_stages 
    WHERE board_id = v_board_vendas AND "order" = 4;

    -- Verifica se todos os stages foram encontrados
    IF v_stage_novo IS NULL OR v_stage_qualificacao IS NULL OR 
       v_stage_proposta IS NULL OR v_stage_negociacao IS NULL OR 
       v_stage_fechamento IS NULL THEN
        RAISE NOTICE 'Aviso: Alguns stages não foram encontrados. Usando stages disponíveis.';
        -- Pega o primeiro stage disponível como fallback
        SELECT id INTO v_stage_novo FROM board_stages 
        WHERE board_id = v_board_vendas ORDER BY "order" LIMIT 1;
        v_stage_qualificacao := COALESCE(v_stage_qualificacao, v_stage_novo);
        v_stage_proposta := COALESCE(v_stage_proposta, v_stage_novo);
        v_stage_negociacao := COALESCE(v_stage_negociacao, v_stage_novo);
        v_stage_fechamento := COALESCE(v_stage_fechamento, v_stage_novo);
    END IF;

    RAISE NOTICE 'Board encontrado: %', v_board_vendas;
    RAISE NOTICE 'Stages: novo=%, qual=%, prop=%, neg=%, fech=%', 
        v_stage_novo, v_stage_qualificacao, v_stage_proposta, v_stage_negociacao, v_stage_fechamento;

    -- ==========================================================================
    -- 2. CRIAR 20 EMPRESAS (CRM Companies)
    -- ==========================================================================
    INSERT INTO crm_companies (name, industry, website, company_id, owner_id) VALUES
    ('TechSoft Solutions', 'Tecnologia', 'https://techsoft.com.br', v_company_id, v_owner_id),
    ('Indústria Metalmax', 'Manufatura', 'https://metalmax.ind.br', v_company_id, v_owner_id),
    ('Grupo Alimentar SA', 'Alimentos', 'https://grupoalimentar.com.br', v_company_id, v_owner_id),
    ('Construtora Horizonte', 'Construção Civil', 'https://horizonteconstrutora.com.br', v_company_id, v_owner_id),
    ('Clínica Vida Plena', 'Saúde', 'https://vidaplena.med.br', v_company_id, v_owner_id),
    ('Logística Express', 'Logística', 'https://logisticaexpress.com.br', v_company_id, v_owner_id),
    ('Escola Futuro Digital', 'Educação', 'https://futurodigital.edu.br', v_company_id, v_owner_id),
    ('Varejo Plus', 'Varejo', 'https://varejoplus.com.br', v_company_id, v_owner_id),
    ('Banco Digital Norte', 'Financeiro', 'https://banconorte.com.br', v_company_id, v_owner_id),
    ('Agro Tech Brasil', 'Agronegócio', 'https://agrotechbr.com.br', v_company_id, v_owner_id),
    ('Mídia Total', 'Marketing', 'https://midiatotal.com.br', v_company_id, v_owner_id),
    ('Transportadora Rápido', 'Transporte', 'https://transportadorarapido.com.br', v_company_id, v_owner_id),
    ('Hotel Paraíso', 'Hotelaria', 'https://hotelparaiso.com.br', v_company_id, v_owner_id),
    ('Escritório Jurídico Souza', 'Jurídico', 'https://souzaadvogados.com.br', v_company_id, v_owner_id),
    ('Imobiliária Premium', 'Imobiliário', 'https://premiumimoveis.com.br', v_company_id, v_owner_id),
    ('Farmácias Saúde+', 'Farmacêutico', 'https://farmaciasmais.com.br', v_company_id, v_owner_id),
    ('Consultoria Stratego', 'Consultoria', 'https://stratego.com.br', v_company_id, v_owner_id),
    ('E-commerce FastShop', 'E-commerce', 'https://fastshop.com.br', v_company_id, v_owner_id),
    ('Academia Fit Life', 'Fitness', 'https://fitlife.com.br', v_company_id, v_owner_id),
    ('Restaurante Sabor & Arte', 'Alimentação', 'https://saborarte.com.br', v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- ==========================================================================
    -- 3. CRIAR 30 CONTATOS
    -- ==========================================================================
    
    -- CUSTOMERS (5)
    INSERT INTO contacts (name, email, phone, role, company_name, stage, source, notes, total_value, company_id, owner_id) VALUES
    ('Carlos Mendes', 'carlos.mendes@techsoft.com.br', '(11) 99876-5432', 'Diretor de TI', 'TechSoft Solutions', 'CUSTOMER', 'LinkedIn', 'Cliente desde 2023. Comprou Enterprise + IA. Muito satisfeito.', 35000, v_company_id, v_owner_id),
    ('Dr. Paulo Ribeiro', 'paulo.ribeiro@vidaplena.med.br', '(41) 95432-1098', 'Diretor Médico', 'Clínica Vida Plena', 'CUSTOMER', 'Google Ads', 'Fechou contrato anual em novembro. Upsell em janeiro.', 24000, v_company_id, v_owner_id),
    ('Marcos Oliveira', 'marcos@banconorte.com.br', '(11) 98888-7777', 'CTO', 'Banco Digital Norte', 'CUSTOMER', 'Indicação', 'Enterprise + módulos. Renovação em março.', 48000, v_company_id, v_owner_id),
    ('Lucia Fernandes', 'lucia@farmaciasmais.com.br', '(21) 97777-6666', 'Diretora de Operações', 'Farmácias Saúde+', 'CUSTOMER', 'Feira', 'Rede com 15 lojas. Potencial expansão.', 18000, v_company_id, v_owner_id),
    ('Roberto Gomes', 'roberto@stratego.com.br', '(11) 96666-5555', 'Sócio', 'Consultoria Stratego', 'CUSTOMER', 'Webinar', 'Revende nosso produto para clientes dele.', 12000, v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- PROSPECTS (8)
    INSERT INTO contacts (name, email, phone, role, company_name, stage, source, notes, company_id, owner_id) VALUES
    ('Ana Beatriz Silva', 'ana.silva@metalmax.ind.br', '(11) 98765-4321', 'Gerente de Compras', 'Indústria Metalmax', 'PROSPECT', 'Indicação', 'Interessada em automação. Budget aprovado.', v_company_id, v_owner_id),
    ('Marcelo Santos', 'marcelo@logisticaexpress.com.br', '(51) 94321-0987', 'COO', 'Logística Express', 'PROSPECT', 'Feira', 'Conheceu na Fenatran 2024. Pediu proposta.', v_company_id, v_owner_id),
    ('André Martins', 'andre.martins@agrotechbr.com.br', '(62) 93333-2222', 'CEO', 'Agro Tech Brasil', 'PROSPECT', 'Referral', 'Indicado pelo Carlos da TechSoft. Urgente.', v_company_id, v_owner_id),
    ('Patricia Lima', 'patricia@midiatotal.com.br', '(11) 92222-1111', 'Diretora Comercial', 'Mídia Total', 'PROSPECT', 'LinkedIn', 'Agência de marketing. Interessada em white label.', v_company_id, v_owner_id),
    ('Fernando Costa', 'fernando@hotelparaiso.com.br', '(71) 91111-0000', 'Gerente Geral', 'Hotel Paraíso', 'PROSPECT', 'Site', 'Rede com 5 hotéis. Quer centralizar operações.', v_company_id, v_owner_id),
    ('Beatriz Rocha', 'beatriz@premiumimoveis.com.br', '(11) 90000-9999', 'Diretora', 'Imobiliária Premium', 'PROSPECT', 'Instagram', 'Imobiliária de alto padrão. Quer CRM + automação.', v_company_id, v_owner_id),
    ('Diego Souza', 'diego@fastshop.com.br', '(11) 98989-8888', 'Head de Tecnologia', 'E-commerce FastShop', 'PROSPECT', 'Google', 'E-commerce médio porte. Integração com Shopify.', v_company_id, v_owner_id),
    ('Marina Torres', 'marina@fitlife.com.br', '(11) 97878-7777', 'Proprietária', 'Academia Fit Life', 'PROSPECT', 'Referral', '3 unidades. Quer gestão de alunos integrada.', v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- MQL (7)
    INSERT INTO contacts (name, email, phone, role, company_name, stage, source, notes, company_id, owner_id) VALUES
    ('Roberto Almeida', 'roberto@grupoalimentar.com.br', '(21) 97654-3210', 'CEO', 'Grupo Alimentar SA', 'MQL', 'Webinar', 'Participou do webinar sobre IA. Muito engajado.', v_company_id, v_owner_id),
    ('Ricardo Lima', 'ricardo.lima@varejoplus.com.br', '(71) 92109-8765', 'Gerente Geral', 'Varejo Plus', 'MQL', 'Email Marketing', 'Abriu 5 emails. Baixou 3 materiais. Hot lead!', v_company_id, v_owner_id),
    ('Juliana Neves', 'juliana@transportadorarapido.com.br', '(31) 96767-5656', 'Gerente de Frota', 'Transportadora Rápido', 'MQL', 'Landing Page', 'Pediu demonstração do módulo de rastreamento.', v_company_id, v_owner_id),
    ('Eduardo Santos', 'eduardo@souzaadvogados.com.br', '(11) 95656-4545', 'Sócio Administrador', 'Escritório Jurídico Souza', 'MQL', 'LinkedIn', 'Interessado em gestão de processos e clientes.', v_company_id, v_owner_id),
    ('Carla Mendonça', 'carla@saborarte.com.br', '(11) 94545-3434', 'Proprietária', 'Restaurante Sabor & Arte', 'MQL', 'Instagram', 'Rede com 3 restaurantes. Quer fidelização.', v_company_id, v_owner_id),
    ('Thiago Barbosa', 'thiago.barbosa@gmail.com', '(21) 93434-2323', 'Empreendedor', NULL, 'MQL', 'YouTube', 'Viu vídeo sobre automação. Startup de SaaS.', v_company_id, v_owner_id),
    ('Amanda Reis', 'amanda.reis@outlook.com', '(31) 92323-1212', 'Consultora', NULL, 'MQL', 'Podcast', 'Ouviu entrevista. Quer revender para clientes.', v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- LEADS (10)
    INSERT INTO contacts (name, email, phone, role, company_name, stage, source, notes, company_id, owner_id) VALUES
    ('Fernanda Costa', 'fernanda.costa@horizonte.com.br', '(31) 96543-2109', 'Diretora Comercial', 'Construtora Horizonte', 'LEAD', 'Site', 'Baixou e-book sobre CRM para construção.', v_company_id, v_owner_id),
    ('Juliana Pereira', 'juliana@futurodigital.edu.br', '(61) 93210-9876', 'Coordenadora', 'Escola Futuro Digital', 'LEAD', 'Instagram', 'Comentou em post sobre automação educacional.', v_company_id, v_owner_id),
    ('Camila Oliveira', 'camila.oliveira@gmail.com', '(81) 91098-7654', 'Empreendedora', NULL, 'LEAD', 'Orgânico', 'Startup em fase inicial. Orçamento limitado.', v_company_id, v_owner_id),
    ('Lucas Martins', 'lucas.martins@hotmail.com', '(91) 90987-6543', 'Freelancer', NULL, 'LEAD', 'Twitter', 'Desenvolvedor querendo usar para projetos.', v_company_id, v_owner_id),
    ('Isabela Castro', 'isabela.castro@yahoo.com', '(85) 89876-5432', 'Analista', NULL, 'LEAD', 'LinkedIn', 'Procurando CRM para empresa onde trabalha.', v_company_id, v_owner_id),
    ('Rodrigo Ferreira', 'rodrigo@empresax.com.br', '(27) 88765-4321', 'Gerente', 'Empresa X', 'LEAD', 'Google', 'Pesquisou CRM + automação. First touch.', v_company_id, v_owner_id),
    ('Natália Santos', 'natalia@startupy.com.br', '(48) 87654-3210', 'COO', 'Startup Y', 'LEAD', 'Capterra', 'Comparando com concorrentes.', v_company_id, v_owner_id),
    ('Gabriel Oliveira', 'gabriel@consultoriaz.com.br', '(19) 86543-2109', 'Consultor', 'Consultoria Z', 'LEAD', 'G2', 'Leu reviews. Interesse em revenda.', v_company_id, v_owner_id),
    ('Mariana Lima', 'mariana@lojaw.com.br', '(43) 85432-1098', 'Proprietária', 'Loja W', 'LEAD', 'Facebook', 'Viu anúncio. E-commerce pequeno.', v_company_id, v_owner_id),
    ('Pedro Henrique', 'pedro@agenciav.com.br', '(67) 84321-0987', 'Diretor', 'Agência V', 'LEAD', 'Indicação', 'Indicado por cliente. Agência digital.', v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- ==========================================================================
    -- 4. CRIAR 20 DEALS NO PIPELINE DE VENDAS (usando board existente!)
    -- ==========================================================================

    -- FECHAMENTO (3 deals - alta probabilidade)
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'ricardo.lima@varejoplus.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Varejo Plus - Sistema PDV + CRM', 52000, 90, 'IN_PROGRESS', 'high', v_board_vendas, v_stage_fechamento, v_contact_id, ARRAY['varejo', 'urgente', 'enterprise'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'andre.martins@agrotechbr.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Agro Tech - CRM Enterprise + IA', 78000, 85, 'IN_PROGRESS', 'high', v_board_vendas, v_stage_fechamento, v_contact_id, ARRAY['enterprise', 'ia', 'agro'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'fernando@hotelparaiso.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Hotel Paraíso - Gestão Multi-Unidade', 45000, 80, 'IN_PROGRESS', 'high', v_board_vendas, v_stage_fechamento, v_contact_id, ARRAY['hotelaria', 'multi-unidade'], v_company_id, v_owner_id);

    -- NEGOCIAÇÃO (4 deals)
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'ana.silva@metalmax.ind.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Metalmax - Automação Industrial', 85000, 70, 'IN_PROGRESS', 'high', v_board_vendas, v_stage_negociacao, v_contact_id, ARRAY['enterprise', 'automação', 'indústria'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'beatriz@premiumimoveis.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Premium Imóveis - CRM Imobiliário', 38000, 65, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_negociacao, v_contact_id, ARRAY['imobiliário', 'automação'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'diego@fastshop.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('FastShop - Integração E-commerce', 42000, 60, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_negociacao, v_contact_id, ARRAY['ecommerce', 'integração'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'patricia@midiatotal.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Mídia Total - White Label + Revenda', 65000, 55, 'IN_PROGRESS', 'high', v_board_vendas, v_stage_negociacao, v_contact_id, ARRAY['parceria', 'white-label'], v_company_id, v_owner_id);

    -- PROPOSTA ENVIADA (5 deals)
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'roberto@grupoalimentar.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Grupo Alimentar - CRM Completo', 45000, 50, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_proposta, v_contact_id, ARRAY['mid-market', 'alimentos'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'juliana@transportadorarapido.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Transp. Rápido - Gestão de Frota', 35000, 45, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_proposta, v_contact_id, ARRAY['logística', 'frota'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'eduardo@souzaadvogados.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Souza Advogados - CRM Jurídico', 28000, 40, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_proposta, v_contact_id, ARRAY['jurídico', 'processos'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'marina@fitlife.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Fit Life - Gestão de Academias', 22000, 40, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_proposta, v_contact_id, ARRAY['fitness', 'gestão'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'carla@saborarte.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Sabor & Arte - Programa Fidelidade', 18000, 35, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_proposta, v_contact_id, ARRAY['restaurante', 'fidelidade'], v_company_id, v_owner_id);

    -- QUALIFICAÇÃO (4 deals)
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'marcelo@logisticaexpress.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Logística Express - Tracking System', 32000, 30, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_qualificacao, v_contact_id, ARRAY['logística', 'tracking'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'thiago.barbosa@gmail.com' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Thiago Barbosa - Startup SaaS', 12000, 25, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_qualificacao, v_contact_id, ARRAY['startup', 'saas'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'amanda.reis@outlook.com' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Amanda Reis - Revenda Consultoria', 15000, 25, 'IN_PROGRESS', 'medium', v_board_vendas, v_stage_qualificacao, v_contact_id, ARRAY['revenda', 'consultoria'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'camila.oliveira@gmail.com' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Startup Camila - MVP CRM', 8000, 20, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_qualificacao, v_contact_id, ARRAY['startup', 'mvp'], v_company_id, v_owner_id);

    -- NOVO LEAD (4 deals)
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'fernanda.costa@horizonte.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Horizonte - Gestão de Obras', 28000, 10, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_novo, v_contact_id, ARRAY['construção', 'gestão'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'juliana@futurodigital.edu.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Futuro Digital - Plataforma Educacional', 18000, 10, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_novo, v_contact_id, ARRAY['educação', 'saas'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'rodrigo@empresax.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Empresa X - CRM Básico', 6000, 5, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_novo, v_contact_id, ARRAY['smb', 'starter'], v_company_id, v_owner_id);

    SELECT id INTO v_contact_id FROM contacts WHERE email = 'natalia@startupy.com.br' AND company_id = v_company_id;
    INSERT INTO deals (title, value, probability, status, priority, board_id, stage_id, contact_id, tags, company_id, owner_id)
    VALUES ('Startup Y - Avaliação', 15000, 5, 'IN_PROGRESS', 'low', v_board_vendas, v_stage_novo, v_contact_id, ARRAY['startup', 'avaliação'], v_company_id, v_owner_id);

    -- ==========================================================================
    -- 5. CRIAR 25 ATIVIDADES
    -- ==========================================================================

    -- HOJE (5)
    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Varejo Plus%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'ricardo.lima@varejoplus.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('☎️ Ligação Final - Fechamento', 'Confirmar assinatura do contrato. Documentos prontos.', 'CALL', NOW() + INTERVAL '1 hour', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Agro Tech%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'andre.martins@agrotechbr.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📋 Revisar contrato', 'Jurídico aprovou. Enviar versão final.', 'TASK', NOW() + INTERVAL '2 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Metalmax%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'ana.silva@metalmax.ind.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🤝 Reunião de Negociação', 'Discutir desconto e condições de pagamento', 'MEETING', NOW() + INTERVAL '4 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Hotel Paraíso%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'fernando@hotelparaiso.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📧 Enviar proposta atualizada', 'Incluir desconto de 10% conforme negociado', 'TASK', NOW() + INTERVAL '3 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%TechSoft%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'carlos.mendes@techsoft.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('💻 Call com cliente top', 'Revisão trimestral de contrato Enterprise', 'MEETING', NOW() + INTERVAL '5 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    -- AMANHÃ (5)
    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Grupo Alimentar%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'roberto@grupoalimentar.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📞 Follow-up Proposta', 'Verificar se recebeu a proposta e tirar dúvidas', 'CALL', NOW() + INTERVAL '1 day', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Logística Express%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'marcelo@logisticaexpress.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🖥️ Demo Tracking', 'Apresentar módulo de rastreamento em tempo real', 'MEETING', NOW() + INTERVAL '1 day 3 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%FastShop%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'diego@fastshop.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🔌 POC Integração', 'Teste de integração com Shopify', 'TASK', NOW() + INTERVAL '1 day 2 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Vida Plena%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'paulo.ribeiro@vidaplena.med.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🎯 Apresentar módulo IA', 'Demo das novas features de IA para upsell', 'MEETING', NOW() + INTERVAL '1 day 4 hours', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Mídia Total%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'patricia@midiatotal.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📄 Enviar contrato parceria', 'Contrato de white label revisado pelo jurídico', 'TASK', NOW() + INTERVAL '1 day', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    -- ESTA SEMANA (5)
    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Horizonte%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'fernanda.costa@horizonte.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('☎️ Qualificar Lead', 'Entender necessidades e orçamento disponível', 'CALL', NOW() + INTERVAL '3 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Futuro Digital%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'juliana@futurodigital.edu.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📧 Enviar cases educação', 'Cases de sucesso do setor educacional', 'TASK', NOW() + INTERVAL '2 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Premium Imóveis%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'beatriz@premiumimoveis.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🤝 Negociação desconto', 'Ela pediu 15%, podemos dar 10%', 'MEETING', NOW() + INTERVAL '4 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Souza Advogados%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'eduardo@souzaadvogados.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📞 Acompanhar proposta', 'Proposta enviada há 5 dias. Fazer follow-up.', 'CALL', NOW() + INTERVAL '2 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Fit Life%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'marina@fitlife.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🖥️ Demo gestão academias', 'Mostrar módulo de check-in e agendamento', 'MEETING', NOW() + INTERVAL '5 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    -- ATRASADAS (5) - Para mostrar no Inbox
    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Amanda Reis%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'amanda.reis@outlook.com' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('🚨 Retornar sobre proposta', 'Ela pediu ajustes no escopo - URGENTE!', 'TASK', NOW() - INTERVAL '2 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id),
    ('📞 Agendar call alinhamento', 'Definir próximos passos do projeto', 'CALL', NOW() - INTERVAL '1 day', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Transp. Rápido%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'juliana@transportadorarapido.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📧 Responder dúvidas técnicas', 'Enviou email com 5 perguntas sobre API', 'TASK', NOW() - INTERVAL '3 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Sabor%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'carla@saborarte.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('☎️ Ligar para Carla', 'Sem resposta aos emails. Tentar telefone.', 'CALL', NOW() - INTERVAL '4 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Thiago%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'thiago.barbosa@gmail.com' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('📋 Enviar proposta startup', 'Prometido há 1 semana!', 'TASK', NOW() - INTERVAL '5 days', false, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    -- COMPLETADAS (5) - Histórico
    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Varejo Plus%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'ricardo.lima@varejoplus.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('✅ Demo realizada', 'Apresentação completa - MUITO POSITIVO!', 'MEETING', NOW() - INTERVAL '7 days', true, v_deal_id, v_contact_id, v_company_id, v_owner_id),
    ('✅ Proposta enviada', 'R$ 52.000 - plano anual com 15% desconto', 'TASK', NOW() - INTERVAL '5 days', true, v_deal_id, v_contact_id, v_company_id, v_owner_id),
    ('✅ Negociação preço', 'Aceitaram R$ 52k em 12x', 'CALL', NOW() - INTERVAL '3 days', true, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    SELECT id INTO v_deal_id FROM deals WHERE title LIKE '%Agro Tech%' AND company_id = v_company_id LIMIT 1;
    SELECT id INTO v_contact_id FROM contacts WHERE email = 'andre.martins@agrotechbr.com.br' AND company_id = v_company_id;
    INSERT INTO activities (title, description, type, date, completed, deal_id, contact_id, company_id, owner_id) VALUES
    ('✅ Reunião com stakeholders', 'Apresentação para diretoria aprovada!', 'MEETING', NOW() - INTERVAL '4 days', true, v_deal_id, v_contact_id, v_company_id, v_owner_id),
    ('✅ POC validada', 'Teste de 15 dias concluído com sucesso', 'TASK', NOW() - INTERVAL '6 days', true, v_deal_id, v_contact_id, v_company_id, v_owner_id);

    -- ==========================================================================
    -- 6. CRIAR PRODUTOS (10)
    -- ==========================================================================
    INSERT INTO products (name, description, price, sku, active, company_id, owner_id) VALUES
    ('CRM Starter', 'Plano básico - até 3 usuários, 1.000 contatos', 299, 'CRM-START', true, v_company_id, v_owner_id),
    ('CRM Professional', 'Plano profissional - 10 usuários, 10.000 contatos, automações', 799, 'CRM-PRO', true, v_company_id, v_owner_id),
    ('CRM Enterprise', 'Plano enterprise - ilimitado + API + suporte dedicado', 1999, 'CRM-ENT', true, v_company_id, v_owner_id),
    ('Módulo IA', 'Add-on: análise de leads, scoring, sugestões', 299, 'MOD-IA', true, v_company_id, v_owner_id),
    ('Módulo Automação', 'Add-on: workflows, emails automáticos, triggers', 199, 'MOD-AUTO', true, v_company_id, v_owner_id),
    ('Módulo WhatsApp', 'Add-on: integração WhatsApp Business API', 149, 'MOD-WHATS', true, v_company_id, v_owner_id),
    ('Consultoria Setup', 'Implementação e configuração - 10 horas', 2500, 'CONS-SETUP', true, v_company_id, v_owner_id),
    ('Consultoria Avançada', 'Consultoria de processos - 20 horas', 4500, 'CONS-ADV', true, v_company_id, v_owner_id),
    ('Treinamento Equipe', 'Treinamento presencial/online - 8 horas', 1500, 'TRAIN-TEAM', true, v_company_id, v_owner_id),
    ('Suporte Premium', 'Suporte prioritário 24/7 - mensal', 499, 'SUP-PREM', true, v_company_id, v_owner_id)
    ON CONFLICT DO NOTHING;

    -- ==========================================================================
    -- 7. CRIAR TAGS (15)
    -- ==========================================================================
    INSERT INTO tags (name, color, company_id) VALUES
    ('urgente', 'bg-red-500', v_company_id),
    ('enterprise', 'bg-purple-500', v_company_id),
    ('mid-market', 'bg-blue-500', v_company_id),
    ('startup', 'bg-green-500', v_company_id),
    ('automação', 'bg-yellow-500', v_company_id),
    ('crm', 'bg-indigo-500', v_company_id),
    ('ia', 'bg-pink-500', v_company_id),
    ('consultoria', 'bg-orange-500', v_company_id),
    ('indicação', 'bg-teal-500', v_company_id),
    ('follow-up', 'bg-gray-500', v_company_id),
    ('upsell', 'bg-emerald-500', v_company_id),
    ('parceria', 'bg-cyan-500', v_company_id),
    ('white-label', 'bg-violet-500', v_company_id),
    ('hot-lead', 'bg-rose-500', v_company_id),
    ('renovação', 'bg-amber-500', v_company_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ SEED DE DEMONSTRAÇÃO EXECUTADO COM SUCESSO!              ║';
    RAISE NOTICE '╠══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║  📊 DADOS CRIADOS:                                           ║';
    RAISE NOTICE '║  • Usando Board existente: %', v_board_vendas;
    RAISE NOTICE '║  • 20 Empresas                                               ║';
    RAISE NOTICE '║  • 30 Contatos (5 clientes, 8 prospects, 7 MQL, 10 leads)   ║';
    RAISE NOTICE '║  • 20 Deals distribuídos nos stages existentes              ║';
    RAISE NOTICE '║  • 25 Atividades (5 hoje, 5 amanhã, 5 semana, 5 atrasadas)  ║';
    RAISE NOTICE '║  • 10 Produtos                                               ║';
    RAISE NOTICE '║  • 15 Tags                                                   ║';
    RAISE NOTICE '║                                                              ║';
    RAISE NOTICE '║  💰 VALOR TOTAL NO PIPELINE: ~R$ 632.000                     ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';

END $$;
