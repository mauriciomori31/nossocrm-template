import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        // Create client with Auth context to check requester's role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Check if requester is admin
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user) return new Response("Unauthorized", { status: 401 })

        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return new Response("Forbidden: Only admins can create users", { status: 403 })
        }

        const { email, password, role } = await req.json()

        // 2. Create User (Need Service Role for this)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (createError) throw createError

        // 3. Create Profile linked to same company
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                company_id: profile.company_id,
                email: email,
                role: role || 'vendedor'
            })

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
            throw profileError
        }

        return new Response(
            JSON.stringify({ message: 'User created successfully', user: newUser }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } })
    }
})
