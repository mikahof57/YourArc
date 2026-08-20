import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-08-27.basil' });
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return new Response('ok');

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') return new Response('ok');
    const purchaseId = session.metadata?.purchase_id;
    if (!purchaseId) return new Response('Missing purchase id', { status: 400 });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await supabase.rpc('apply_paid_purchase', { p_purchase_id: purchaseId, p_provider_payment_id: session.id });
    if (error) throw error;

    return new Response('ok');
  } catch (error) {
    console.error(error);
    return new Response('Webhook verification failed', { status: 400 });
  }
});
