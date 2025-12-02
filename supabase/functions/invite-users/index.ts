import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  emails: string[];
  role: 'admin' | 'vendedor';
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with user token to check permissions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user token (for auth check)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client (for sending invites)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated and is admin
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Get user profile to check role and company
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    if (profile.role !== "admin") {
      throw new Error("Only admins can invite users");
    }

    // Parse request body
    const { emails, role }: InviteRequest = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error("At least one email is required");
    }

    if (!role || !["admin", "vendedor"].includes(role)) {
      throw new Error("Invalid role. Must be 'admin' or 'vendedor'");
    }

    // Get site URL for redirect
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";

    // Send invites
    const results: InviteResult[] = [];

    for (const email of emails) {
      try {
        // Check if user already exists in this company
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .eq("company_id", profile.company_id)
          .single();

        if (existingProfile) {
          results.push({
            email,
            success: false,
            error: "Usuário já existe nesta empresa",
          });
          continue;
        }

        // Send invite email using Supabase Admin API
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${siteUrl}/auth/callback?role=${role}&company_id=${profile.company_id}`,
          data: {
            role,
            company_id: profile.company_id,
            invited_by: user.id,
          },
        });

        if (error) {
          results.push({
            email,
            success: false,
            error: error.message,
          });
        } else {
          results.push({
            email,
            success: true,
          });
        }
      } catch (err: any) {
        results.push({
          email,
          success: false,
          error: err.message || "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `${successCount} convite(s) enviado(s)${failCount > 0 ? `, ${failCount} falha(s)` : ''}`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
