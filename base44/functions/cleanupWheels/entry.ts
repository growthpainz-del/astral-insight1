import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Multi-symbol URLs to single emojis mapping
const SYMBOL_MAP = {
  // Seven Sisters
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/88ee8ec8d_32DB718D-EFA1-4827-8AEC-6AB91A8BF329.png": "🌱",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3bd854cd9_6381CF9C-029F-4D2C-84BA-81168C947FE3.png": "⚡",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a28758f63_8501F496-2B70-4F65-B2BA-FAFEA987F484.png": "🕊️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d7e717c9b_3F39BC02-39E5-47A7-AC4D-3DD487C9C369.png": "🏃‍♀️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/20d73f158_1387F872-F65F-4474-B013-E85675780EFE.png": "🌫️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cb94d92f2_FB6DDABB-8BD8-4659-9B0B-E96D754A7AF0.png": "🔥",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/91325776e_C924B138-EE3C-4992-A912-B0D1598F9C16.png": "🗣️",

  // Spiritual Emoticons
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fda52ec6b_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png": "🌙",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/38c1faf8f_emojiscom1-inner-eye-symbol_-crescent-framing-a-simple-open-eye-with-soft-root-like-lashes-meaning_-trust-intuition-and-inner-sight.png": "👁️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/cc4ec511c_emojiscomsymbol_-crescent-with-a-leaf-breaking-free-from-tangled-roots-meaning_-let-go-of-what-no-longer-serves.png": "💨",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/537236bca_emojiscomheart-root-symbol_-crescent-cradling-a-small-heart-with-roots-growing-from-its-base-meaning_-love-anchored-in-self.png": "💖",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fa6e4de90_emojiscomsymbol_-crescent-turning-into-gentle-flowing-water_leaf-veins-meaning_-move-with-natural-cycles.png": "🌊",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4fe466777_emojiscomspark-seed-symbol_-tiny-glowing-spark-inside-a-crescent-with-sprouting-leaves-meaning_-creative-or-spiritual-ignition.png": "🌱",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/773fddf77_emojiscom8-balance-wings-symbol_-two-symmetrical-crescents-forming-open-wings-with-central-root-meaning_-harmony-between-light-and-shadow.png": "🦋",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/0773b3cdd_emojiscomsymbol_-crescent-with-faint-echoing-ripples-turning-into-roots-meaning_-listen-to-inner-or-ancestral-guidance.png": "🦉",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/de13c89f0_emojiscom10-ascension-flame-symbol_-crescent-rising-with-a-small-flame-merging-into-upward-leaves-meaning_-spiritual-growth-and-elevation.png": "🔥",

  // Moon Emblems
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/79456c147_emojiscommoon--bloom-symbol_-crescent-moon-with-delicate-vines-and-leaves-growing-upward-from-its-base-gently-wrapping-around-the-curve-meaning_-deep-reconnection-with-natures-cycles-and-living-wisdom.png": "🌸",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/fe23fac12_emojiscommoon-chakra-symbol_-crescent-moon-with-a-vertical-column-of-7-small-glowing-dots-the-chakras-aligned-perfectly-down-its-center-softly-radiating-outward.png": "⚛️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/e7a4d3c6d_emojiscommoon--third-eye-symbol_-crescent-moon-with-a-single-glowing-eye-centered-in-the-curve-framed-by-a-subtle-lotus-like-mandala-of-leaves-and-roots.png": "👁️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/8ec22eb41_emojiscommoon--balance-symbol_-two-symmetrical-crescents-facing-each-other-like-open-wings-with-a-single-vertical-line-of-energy-running-down-the-center-connecting-them.png": "⚖️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/02859be58_emojiscom1-moon--flame-symbol_-crescent-moon-with-a-small-flame-rising-from-its-curve-meaning_-passionate-intuition-or-creative-fire.png": "🔥",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/a1041b66f_emojiscom2-moon--feather-symbol_-crescent-moon-with-a-single-feather-gently-resting-inside-its-curve-meaning_-lightness-messages-or-spiritual-surrender.png": "🪶",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6a3be91fd_emojiscom3-moon--spiral-symbol_-crescent-moon-with-a-tight-spiral-growing-from-its-base-like-a-shell-meaning_-inner-journey-cycles-and-unfolding-wisdom.png": "🌀",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d3c8c8191_emojiscom4-moon--lotus-symbol_-crescent-moon-with-a-lotus-flower-blooming-from-its-lower-curve-meaning_-spiritual-awakening-and-rising-above-challenges.png": "🪷",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/7ac2566d5_emojiscom5-moon--hand-symbol_-crescent-moon-cradled-by-an-open-palm-from-below-meaning_-divine-support-receiving-or-surrender.png": "🤲",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/baa05bcd9_emojiscom6-moon--butterfly-symbol_-crescent-moon-with-butterfly-wings-emerging-from-its-sides-meaning_-transformation-and-soul-evolution.png": "🦋",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/eab249185_emojiscom9-moon--key-symbol_-crescent-moon-with-an-ornate-key-hanging-from-its-inner-curve-meaning_-unlocking-hidden-knowledge-or-soul-purpose.png": "🗝️",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/546cc87f8_emojiscom7-moon--antlers-symbol_-crescent-moon-with-elegant-antlers-branching-upward-from-its-tips-meaning_-wild-instinct-protection-and-natural-power.png": "🦌",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/d5b1347eb_emojiscom8-moon--drop-symbol_-crescent-moon-with-a-single-water-drop-falling-from-its-curve-meaning_-emotional-release-cleansing-or-divine-tears.png": "💧",

  // Animal Spirits
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/4b5e817e8_5E5C0F6F-C063-42EF-A81D-13620A8794F8.png": "🐻",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/f9166d16a_4872CE13-DAF7-4DB3-B49C-550EF9313D11.png": "🐺",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/1313d2e5a_EEB98506-2E8A-4DC4-9718-014B240314E3.png": "🦅",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dcf97cc36_C736DB82-E6FB-4D19-89B5-A2EFB8678D87.png": "🦬",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/6b8c8d2fa_B47D7EAA-5DB6-4144-B5D9-04F527CAD0BE.png": "🦉",
  "https://media.base44.com/images/public/68d2a300021f94d0f312c039/5986da740_5D416A3A-09D1-4E52-AA69-2C761DFBD8ED.png": "🦌"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check auth
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    let modifiedCount = 0;

    // Fetch all SpiritWheelConfigurations
    const wheels = await base44.entities.SpiritWheelConfiguration.list();
    for (const wheel of wheels) {
      let changed = false;
      const processRing = (ring) => {
        if (!ring) return ring;
        return ring.map(segment => {
          if (segment.icon && SYMBOL_MAP[segment.icon]) {
            changed = true;
            return { ...segment, icon: SYMBOL_MAP[segment.icon] };
          }
          return segment;
        });
      };

      const outer_ring = processRing(wheel.outer_ring);
      const middle_ring = processRing(wheel.middle_ring);
      const inner_ring = processRing(wheel.inner_ring);

      if (changed) {
        await base44.entities.SpiritWheelConfiguration.update(wheel.id, {
          outer_ring,
          middle_ring,
          inner_ring
        });
        modifiedCount++;
      }
    }

    return Response.json({ success: true, message: `Fixed ${modifiedCount} Spirit Wheels in the database.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});