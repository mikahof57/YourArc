import { supabase } from '../lib/supabaseClient';

const PACKAGES: Record<number, string> = {
  100: 'pack_100',
  500: 'pack_500',
  1500: 'pack_1500',
};

export async function startCreditCheckout(credits: number) {
  const productId = PACKAGES[credits];
  if (!productId) throw new Error('UNKNOWN_CREDIT_PACKAGE');
  const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { productId } });
  if (error) throw error;
  if (!data?.url) throw new Error('CHECKOUT_URL_MISSING');
  window.location.assign(data.url);
}
