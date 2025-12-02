import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const { companyName, email, password } = await req.json()

        // Create Supabase client with Admin (Service Role) key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Check if initialized
        const { data: isInitialized, error: initError } = await supabaseAdmin
            .rpc('is_instance_initialized')

        if (initError) throw initError
        if (isInitialized) return new Response(JSON.stringify({ error: 'Instance already initialized' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

        // 2. Create Company
        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({ name: companyName })
            .select()
            .single()

        if (companyError) throw companyError

        // 3. Create User with metadata (trigger will use this to create profile)
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                company_id: company.id
            }
        })

        if (userError) {
            // Rollback company creation
            await supabaseAdmin.from('companies').delete().eq('id', company.id)
            throw userError
        }

        // 4. Criar profile diretamente (não depender do trigger)
        // Primeiro tenta inserir, se falhar (trigger já criou), faz update
        const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.user.id,
                email: email,
                name: email.split('@')[0],
                company_id: company.id,
                role: 'admin'
            }, { 
                onConflict: 'id' 
            })

        if (insertProfileError) {
            // Rollback user and company
            await supabaseAdmin.auth.admin.deleteUser(user.user.id)
            await supabaseAdmin.from('companies').delete().eq('id', company.id)
            throw insertProfileError
        }

        return new Response(
            JSON.stringify({ message: 'Instance setup successfully', company, user }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } })
    }
})
