import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Service role client needed to write to stream_secrets if RLS is strict
    // But typically we use the user context and RLS + Security Definer RPCs.
    // Here we use Service Role for "God mode" actions if strictly necessary, 
    // but better to stick to user context if possible.
    const supabaseClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify User is Admin
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('primary_role')
        .eq('id', user.id)
        .single();
        
    if (!['admin', 'super_admin'].includes(profile?.primary_role)) {
        throw new Error("Forbidden");
    }

    const { action, stream_id } = await req.json();

    if (action === 'regenerate_key') {
        const newKey = 'live_' + crypto.randomUUID().replace(/-/g, '');
        
        await supabaseClient
            .from('stream_secrets')
            .upsert({ 
                stream_id, 
                stream_key: newKey,
                rtmp_server: 'rtmp://live.faithconnect.app/app'
            });

        return new Response(
            JSON.stringify({ stream_key: newKey }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    throw new Error("Unknown action");

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});