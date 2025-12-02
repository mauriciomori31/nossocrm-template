-- =============================================================================
-- FlowCRM - RESET (Limpa TUDO)
-- =============================================================================
-- ⚠️  CUIDADO: Isso APAGA todos os dados!
-- Use apenas para resetar um projeto existente
-- =============================================================================

-- 1. Drop ALL storage policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload audio notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio notes" ON storage.objects;

-- 2. Limpar storage files
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'audio-notes');

-- 3. Drop ALL functions (CASCADE dropa policies e triggers automaticamente)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || '() CASCADE';
    END LOOP;
END $$;

-- 4. Drop ALL tables in public schema (CASCADE dropa tudo relacionado)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =============================================================================
-- ✅ Reset completo! Agora execute 000_schema.sql
-- =============================================================================
