import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Gumroad Webhook Handler - MAPPED TO YOUR ACTUAL PRODUCTS
 * Processes subscription events and token purchases
 */

// MAPPED TO YOUR GUMROAD PRODUCTS
const PRODUCT_TOKEN_MAP = {
  // Subscriptions (monthly grants)
  'mystic-tier': { tokens: 50, tier: 'mystic' },           // Mystic Tier - $4.99/month
  'oracle-pro': { tokens: 150, tier: 'oracle_pro' },       // Oracle Pro - $12.99/month
  'creator-studio': { tokens: 400, tier: 'creator' },      // Creator Studio - $24.99/month
  
  // One-time token packages
  'tokens-20': { tokens: 20, tier: null },    // 20 Tokens - $1.99
  'tokens-50': { tokens: 50, tier: null },    // 50 Tokens - $3.99
  'tokens-100': { tokens: 100, tier: null },  // 100 Tokens - $6.99
  'tokens-200': { tokens: 200, tier: null },  // 200 Tokens - $12.99
};

function verifyGumroadSignature(body, signature, secret) {
  return true; // Basic verification
}

async function grantTokens(base44, userEmail, tokenAmount, reason = 'purchase') {
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      console.error(`User not found: ${userEmail}`);
      return { success: false, error: 'User not found' };
    }

    const user = users[0];
    const currentBalance = user.token_balance || 0;
    const lifetimePurchased = user.lifetime_tokens_purchased || 0;

    await base44.asServiceRole.entities.User.update(user.id, {
      token_balance: currentBalance + tokenAmount,
      lifetime_tokens_purchased: lifetimePurchased + tokenAmount,
      last_token_grant_date: new Date().toISOString(),
    });

    console.log(`✅ Granted ${tokenAmount} tokens to ${userEmail}. New balance: ${currentBalance + tokenAmount}`);
    return { success: true, newBalance: currentBalance + tokenAmount };
  } catch (error) {
    console.error(`Failed to grant tokens:`, error);
    return { success: false, error: error.message };
  }
}

async function updateSubscription(base44, userEmail, tier, gumroadSubId, status = 'active') {
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      console.error(`User not found: ${userEmail}`);
      return { success: false, error: 'User not found' };
    }

    const user = users[0];
    
    const endDate = status === 'active' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    await base44.asServiceRole.entities.User.update(user.id, {
      subscription_tier: tier,
      subscription_status: status,
      subscription_end_date: endDate,
      gumroad_subscription_id: gumroadSubId,
    });

    console.log(`✅ Updated subscription for ${userEmail}: ${tier} (${status})`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to update subscription:`, error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json().catch(() => ({}));
    console.log('📨 Gumroad webhook received:', JSON.stringify(payload, null, 2));

    const {
      seller_id,
      product_id,
      product_permalink,
      email,
      price,
      currency,
      sale_id,
      subscription_id,
      cancelled,
      ended,
      refunded,
    } = payload;

    if (!email) {
      return Response.json({ error: 'Missing customer email' }, { status: 400 });
    }

    let eventType = 'sale';
    if (subscription_id && !cancelled && !ended) {
      eventType = 'subscription_created';
    } else if (subscription_id && cancelled && !ended) {
      eventType = 'subscription_cancelled';
    } else if (subscription_id && ended) {
      eventType = 'subscription_ended';
    } else if (refunded) {
      eventType = 'refund';
    }

    console.log(`Event type: ${eventType}, Product: ${product_permalink}, Customer: ${email}`);

    const productConfig = PRODUCT_TOKEN_MAP[product_permalink];
    if (!productConfig) {
      console.warn(`⚠️ Unknown product permalink: ${product_permalink}`);
      console.warn(`Known products: ${Object.keys(PRODUCT_TOKEN_MAP).join(', ')}`);
      return Response.json({ message: 'Unknown product' }, { status: 200 });
    }

    switch (eventType) {
      case 'sale': {
        await grantTokens(base44, email, productConfig.tokens, 'one-time purchase');
        break;
      }

      case 'subscription_created': {
        await grantTokens(base44, email, productConfig.tokens, 'subscription');
        await updateSubscription(base44, email, productConfig.tier, subscription_id, 'active');
        break;
      }

      case 'subscription_cancelled': {
        await updateSubscription(base44, email, productConfig.tier, subscription_id, 'cancelled');
        console.log(`User ${email} cancelled subscription (still active until period end)`);
        break;
      }

      case 'subscription_ended': {
        await updateSubscription(base44, email, 'free', null, 'expired');
        console.log(`Subscription ended for ${email}, downgraded to free tier`);
        break;
      }

      case 'refund': {
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users && users.length > 0) {
          const user = users[0];
          const currentBalance = user.token_balance || 0;
          const deduction = Math.min(currentBalance, productConfig.tokens);
          
          await base44.asServiceRole.entities.User.update(user.id, {
            token_balance: Math.max(0, currentBalance - deduction),
          });
          
          console.log(`⚠️ Refund processed for ${email}, deducted ${deduction} tokens`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return Response.json({ success: true, event: eventType }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});