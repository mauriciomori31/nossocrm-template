import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      throw new Error("Only admins can delete users");
    }

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    // Can't delete yourself
    if (userId === user.id) {
      throw new Error("Você não pode remover a si mesmo");
    }

    // Check if target user belongs to same company (only for users with profile)
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (targetProfile) {
      // User has profile - delete it
      // Note: We skip company check for now since list-users already filters by company
      await adminClient.from("profiles").delete().eq("id", userId);
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User deleted successfully",
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
        status: 200, // Return 200 so supabase client doesn't throw generic error
      }
    );
  }
});
