import Stripe from 'npm:stripe@18.5.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { productId } = await req.json();
    const { data: product, error } = await supabase.from('store_products').select('*').eq('id', productId).eq('active', true).single();
    if (error || !product) return new Response('Product not found', { status: 404 });

    const { data: purchase, error: purchaseError } = await supabase.from('purchases').insert({ user_id: user.id, product_id: product.id, provider: 'stripe', amount_cents: product.price_cents, currency: product.currency, status: 'pending' }).select('id').single();
    if (purchaseError) throw purchaseError;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-08-27.basil' });
    const origin = req.headers.get('origin') || Deno.env.get('APP_URL') || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: product.currency, product_data: { name: product.name, description: `${product.credits} ARC Credits` }, unit_amount: product.price_cents }, quantity: 1 }],
      metadata: { purchase_id: purchase.id, user_id: user.id, product_id: product.id },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      customer_email: user.email || undefined,
    });

    await supabase.from('purchases').update({ provider_payment_id: session.id }).eq('id', purchase.id);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : 'Checkout failed' }, { status: 500 });
  }
});
