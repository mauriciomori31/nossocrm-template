import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserWithStatus {
  id: string;
  email: string;
  role: string;
  company_id: string;
  created_at: string;
  status: 'active' | 'pending';
  invited_at?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Get user profile to check company
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role, company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    const usersWithStatus: UserWithStatus[] = [];

    // 1. Get all profiles from this company (active users)
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    // Add active users from profiles
    for (const p of profiles || []) {
      usersWithStatus.push({
        id: p.id,
        email: p.email,
        role: p.role,
        company_id: p.company_id,
        created_at: p.created_at,
        status: 'active',
      });
    }

    // 2. Get all auth users and find pending invites for this company
    // We need to check user_metadata for company_id
    const { data: authData } = await adminClient.auth.admin.listUsers();
    
    if (authData?.users) {
      const profileIds = new Set((profiles || []).map(p => p.id));
      
      for (const authUser of authData.users) {
        // Skip if already in profiles (active user)
        if (profileIds.has(authUser.id)) continue;
        
        // Check if this is an invited user for our company
        const metadata = authUser.user_metadata || {};
        if (metadata.company_id === profile.company_id) {
          // This is a pending invite for our company
          usersWithStatus.push({
            id: authUser.id,
            email: authUser.email || '',
            role: metadata.role || 'vendedor',
            company_id: metadata.company_id,
            created_at: authUser.created_at,
            status: 'pending',
            invited_at: authUser.invited_at || authUser.created_at,
          });
        }
      }
    }

    // Sort by created_at descending
    usersWithStatus.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return new Response(
      JSON.stringify({
        success: true,
        users: usersWithStatus,
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
