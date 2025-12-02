import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        const { email, password, token, name } = await req.json();

        if (!email || !password || !token) {
            throw new Error("Email, password and token are required");
        }

        // 1. Validate Token
        const { data: invite, error: inviteError } = await adminClient
            .from("company_invites")
            .select("*")
            .eq("token", token)
            // .is("used_at", null) // Removed to allow multi-use
            .single();

        if (inviteError || !invite) {
            return new Response(
                JSON.stringify({ error: "Convite inválido ou não encontrado" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Check expiration if it exists
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ error: "Convite expirado" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // 2. Check if email matches (if invite has email restriction)
        if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new Error("Este convite não é válido para este email");
        }

        // 3. Create User
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm since they have a valid token
            user_metadata: {
                name: name || email.split("@")[0],
                company_id: invite.company_id,
                role: invite.role,
            },
        });

        if (createError) throw createError;

        // 3. Create User Profile
        const { error: profileError } = await adminClient
            .from("profiles")
            .insert({
                id: authData.user.id,
                email: email,
                role: invite.role,
                company_id: invite.company_id,
                status: "active",
                created_at: new Date().toISOString(),
            });

        if (profileError) {
            // Cleanup auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        // 4. (Optional) Track usage count here if we added a column, but for now just don't mark as used_at
        // await adminClient.from("company_invites").update({ used_at: new Date().toISOString() }).eq("id", invite.id);

        return new Response(
            JSON.stringify({
                user: authData.user,
                message: "Convite aceito com sucesso!"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
