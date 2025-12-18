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
    const supabaseClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { stream_id } = await req.json();

    // 1. Fetch Stream Metadata
    const { data: stream, error } = await supabaseClient
      .from('streams')
      .select('privacy, storage_path, branch_id')
      .eq('id', stream_id)
      .single();

    if (error || !stream) {
      throw new Error('Stream not found');
    }

    // 2. Auth Check
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Privacy Logic
    if (stream.privacy === 'members_only') {
      if (!user) throw new Error('Unauthorized');
      
      // Check branch membership (simplified)
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('branch_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.branch_id !== stream.branch_id) {
         throw new Error('Access restricted to branch members');
      }
    } else if (stream.privacy === 'private') {
       // Only admins/owner
       // Implement strict check here
    }

    // 3. Generate Signed URL if private bucket, public URL if public bucket
    // Assuming 'videos' bucket is private
    const { data: urlData } = await supabaseClient
      .storage
      .from('private-videos')
      .createSignedUrl(stream.storage_path, 3600); // 1 hour token

    return new Response(
      JSON.stringify({ url: urlData?.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});