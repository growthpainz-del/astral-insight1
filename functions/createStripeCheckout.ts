import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.22.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name = 'Tarot/Oracle Deck',
      amount_cents = 500,
      quantity = 1,
      currency = 'usd',
      success_path = '/?checkout=success',
      cancel_path = '/?checkout=cancel',
      deck_id = null,
      shop_id = null
    } = await req.json().catch(() => ({}));

    const secret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secret) {
      return Response.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

    // Derive origin from request (prefer frontend origin over function origin)
    const reqUrl = new URL(req.url);
    const originHeader = req.headers.get('origin') || req.headers.get('referer');
    let baseOrigin = reqUrl.origin;
    try {
      if (originHeader) {
        const parsed = new URL(originHeader);
        baseOrigin = `${parsed.protocol}//${parsed.host}`;
      }
    } catch (_) {}

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount_cents,
            product_data: {
              name,
            },
          },
          quantity,
        },
      ],
      shipping_address_collection: {
        allowed_countries: [
          'US','CA','GB','AU','NZ','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','BE','AT','CH','PT','PL','CZ'
        ],
      },
      success_url: `${baseOrigin}${success_path}`,
      cancel_url: `${baseOrigin}${cancel_path}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || 'unknown',
        transaction_type: 'deck_print_order',
        user_id: user.id || '',
        user_email: user.email || '',
        deck_id: deck_id || '',
        shop_id: shop_id || '',
        quantity: String(quantity),
        item_name: name,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[createStripeCheckout] Error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});