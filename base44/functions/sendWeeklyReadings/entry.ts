import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Weekly Reading Email Sender
 * 
 * This function should be triggered by a cron job (e.g., every Sunday at 8 PM)
 * It finds all users with weekly_reading_enabled = true for today's day of week
 * and sends them a reading email.
 * 
 * To set up in Deno Deploy:
 * 1. Deploy this function
 * 2. Use a cron service like cron-job.org or EasyCron to hit this endpoint weekly
 * 3. Or use GitHub Actions with a cron schedule
 */

function getDayOfWeek() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  return days[today.getDay()];
}

async function drawCards(base44, deckId, spreadType) {
  const cards = await base44.asServiceRole.entities.Card.filter({ deck_id: deckId });
  
  if (!cards || cards.length === 0) {
    throw new Error('No cards found in deck');
  }

  const cardCounts = {
    single: 1,
    three_card: 3,
    diamond: 5,
  };

  const count = cardCounts[spreadType] || 3;
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const drawn = shuffled.slice(0, count).map((card, index) => ({
    ...card,
    position: index + 1,
    is_reversed: Math.random() < 0.3,
  }));

  return drawn;
}

function generateEmailHTML(user, deck, drawnCards, question, readingId) {
  const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://your-app.com';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Reading</title>
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .question { background: #f7f7f7; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-style: italic; color: #555; }
    .card { background: #f9f9f9; border: 2px solid #667eea; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
    .card-name { font-size: 18px; font-weight: bold; color: #764ba2; margin-bottom: 5px; }
    .card-position { color: #888; font-size: 14px; margin-bottom: 10px; }
    .card-meaning { color: #333; line-height: 1.6; }
    .reversed { color: #e74c3c; }
    .cta { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .footer { background: #f7f7f7; padding: 20px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Your Weekly Reading</h1>
      <p>From ${deck.name}</p>
    </div>
    
    <div class="content">
      <div class="question">
        <strong>Your Question:</strong> ${question}
      </div>
      
      ${drawnCards.map(card => `
        <div class="card">
          ${card.image_url ? `<img src="${card.image_url}" alt="${card.name}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">` : ''}
          <div class="card-name">${card.name} ${card.is_reversed ? '<span class="reversed">(Reversed)</span>' : ''}</div>
          <div class="card-position">Position ${card.position}</div>
          <div class="card-meaning">
            ${card.is_reversed ? 
              (card.reversed_meaning || card.overall_meaning || 'No meaning available') : 
              (card.upright_meaning || card.overall_meaning || 'No meaning available')
            }
          </div>
        </div>
      `).join('')}
      
      <div class="cta">
        <a href="${appUrl}/reading?id=${readingId}" class="cta-button">
          🔮 Generate Full AI Reading
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 10px;">
          Click above to unlock a detailed AI interpretation<br>
          (Uses tokens from your account)
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you enabled weekly readings in Astral Insight</p>
      <p><a href="${appUrl}/subscription-management" style="color: #667eea;">Manage Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Security: Only allow requests with correct secret
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || secret !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getDayOfWeek();
    console.log(`📅 Running weekly readings for ${today}`);

    // Find all users who want readings today
    const allUsers = await base44.asServiceRole.entities.User.list();
    const eligibleUsers = allUsers.filter(user => 
      user.weekly_reading_enabled === true &&
      user.weekly_reading_preferences?.day_of_week === today &&
      user.weekly_reading_preferences?.deck_id
    );

    console.log(`Found ${eligibleUsers.length} eligible users`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of eligibleUsers) {
      try {
        const prefs = user.weekly_reading_preferences;
        
        // Get deck
        const deck = await base44.asServiceRole.entities.Deck.get(prefs.deck_id);
        if (!deck) {
          console.error(`Deck not found for user ${user.email}`);
          errorCount++;
          continue;
        }

        // Draw cards
        const drawnCards = await drawCards(base44, prefs.deck_id, prefs.spread_type || 'three_card');
        
        // Generate unique reading ID (for tracking clicks)
        const readingId = `weekly-${user.id}-${Date.now()}`;
        
        // Generate email HTML
        const emailHTML = generateEmailHTML(
          user,
          deck,
          drawnCards,
          prefs.question || 'What do I need to know this week?',
          readingId
        );

        // Send email
        await base44.asServiceRole.integrations.SendEmail({
          to: user.email,
          from_name: 'Astral Insight',
          subject: `✨ Your Weekly Reading from ${deck.name}`,
          body: emailHTML,
        });

        successCount++;
        console.log(`✅ Sent weekly reading to ${user.email}`);

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to send reading to ${user.email}:`, error);
        errorCount++;
      }
    }

    return Response.json({
      success: true,
      day: today,
      total: eligibleUsers.length,
      sent: successCount,
      failed: errorCount,
    });

  } catch (error) {
    console.error('Weekly reading job failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});