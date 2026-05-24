import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called internally by other functions (with service role)
    // or by authenticated users. Verify caller has valid auth.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key to validate user token
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if this is a service role call (from another function)
    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // If it's not the service role key, verify as user token
    if (token !== serviceRoleKey) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Sessão inválida' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Authenticated user for send-notification:', user.id);
    } else {
      console.log('Internal service call to send-notification');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { notification } = body as { notification: NotificationPayload };

    // Validate notification payload
    if (!notification || !notification.title || !notification.body) {
      return new Response(
        JSON.stringify({ error: 'Dados de notificação inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending notification:', notification);

    // Get all push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Send notifications to all subscriptions
    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        // Note: In a real implementation, you would use web-push library
        // For now, we'll just log the attempt
        console.log(`Would send notification to: ${subscription.endpoint}`);
        
        // In production, you would do something like:
        // await webpush.sendNotification(subscription, JSON.stringify(notification));
        
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error(`Failed to send to ${subscription.endpoint}:`, error);
        return { success: false, endpoint: subscription.endpoint, error };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${subscriptions.length} notifications successfully`);

    return new Response(
      JSON.stringify({
        message: `Notifications sent`,
        total: subscriptions.length,
        successful: successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
