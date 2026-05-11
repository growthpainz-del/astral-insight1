import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // New import for form labels
import { User, Card as OracleCard, Deck } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import {
  Stars,
  Calculator,
  Sparkles,
  ArrowLeft,
  Crown,
  Wand2,
  BookOpen,
  Loader2, // New import for loading spinner
  Star, // New import for select item icons
  Moon // New import for select item icons
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UpgradePrompt from "../components/pricing/UpgradePrompt";

// Elder Futhark Runes data with face down meanings
const elderFutharkRunes = [
  { number: 1, symbol: "ᚠ", name: "Fehu", keywords: ["Wealth", "abundance", "success"], element: "Earth",
    upright_meaning: "Represents the flow of prosperity, indicating opportunities for financial gain, personal achievement, and the fruitful use of talents.",
    reversed_meaning: "Signals potential loss, mismanagement of resources, or an overemphasis on material gain at the expense of spiritual balance.",
    facedown_meaning: "Suggests hidden wealth or untapped potential; the situation requires patience or deeper exploration to reveal financial opportunities." },
  { number: 2, symbol: "ᚢ", name: "Uruz", keywords: ["Strength", "vitality", "determination"], element: "Earth",
    upright_meaning: "Signifies robust health, inner strength, and the ability to overcome obstacles through willpower.",
    reversed_meaning: "Indicates weakness, missed opportunities, or overexertion, suggesting a need for rest and reevaluation.",
    facedown_meaning: "Implies latent strength or a challenge not yet faced; further insight is needed to unlock this power." },
  { number: 3, symbol: "ᚦ", name: "Thurisaz", keywords: ["Strength", "change", "protection"], element: "Fire",
    upright_meaning: "Signifies the ability to overcome challenges with focused energy, offering protection and initiating transformative action.",
    reversed_meaning: "Indicates uncontrolled aggression, destructive impulses, or vulnerability to external forces, urging caution and self-control.",
    facedown_meaning: "Suggests a hidden threat or untapped defensive energy; the situation may require patience to reveal its true nature." },
  { number: 4, symbol: "ᚨ", name: "Ansuz", keywords: ["Wisdom", "inspiration", "communication"], element: "Air",
    upright_meaning: "Indicates a period of receiving profound insights, effective communication, and spiritual guidance.",
    reversed_meaning: "Suggests miscommunication, blocked inspiration, or ignoring inner wisdom, leading to confusion or deceit.",
    facedown_meaning: "Implies hidden wisdom or a message not yet clear; further reflection or time may uncover the guidance." },
  { number: 5, symbol: "ᚱ", name: "Raidho", keywords: ["Journey", "rhythm", "alignment"], element: "Air",
    upright_meaning: "Guides you on a purposeful journey, aligning actions with cosmic rhythm for progress and harmony.",
    reversed_meaning: "Indicates delays, disorientation, or resistance to change, suggesting a need for realignment.",
    facedown_meaning: "Suggests a journey or decision not yet visible; the path requires patience or additional insight to emerge." },
  { number: 6, symbol: "ᚲ", name: "Kenaz", keywords: ["Creativity", "knowledge", "transformation"], element: "Fire",
    upright_meaning: "Ignites creativity, reveals knowledge, and supports transformation through inspired action.",
    reversed_meaning: "Indicates creative blocks, ignorance, or misused energy, urging self-reflection and renewal.",
    facedown_meaning: "Implies a hidden creative spark or knowledge yet to surface; patience or exploration may unlock this potential." },
  { number: 7, symbol: "ᚷ", name: "Gebo", keywords: ["Partnership", "exchange", "balance"], element: "Air",
    upright_meaning: "Fosters balanced relationships and mutual benefits, encouraging generosity and reciprocal love.",
    reversed_meaning: "Suggests imbalance, unreturned favors, or codependency, advising fair boundaries.",
    facedown_meaning: "Indicates a hidden partnership or gift not yet revealed; the situation may need time to clarify mutual benefits." },
  { number: 8, symbol: "ᚹ", name: "Wunjo", keywords: ["Joy", "harmony", "fulfillment"], element: "Air",
    upright_meaning: "Brings joy, emotional fulfillment, and harmonious relationships, encouraging celebration and shared success.",
    reversed_meaning: "Suggests discord, unmet expectations, or suppressed joy, advising resolution of conflicts and self-nurturing.",
    facedown_meaning: "Implies hidden joy or a relationship not yet harmonious; further effort or time may restore balance." },
  { number: 9, symbol: "ᚺ", name: "Hagalaz", keywords: ["Change", "disruption", "renewal"], element: "Water",
    upright_meaning: "Signals unexpected challenges or cleansing changes, urging resilience and adaptation to new circumstances.",
    reversed_meaning: "Suggests resistance to change or prolonged chaos, advising acceptance of inevitable shifts.",
    facedown_meaning: "Indicates a hidden disruption or change not yet apparent; the situation may require preparation or intuition." },
  { number: 10, symbol: "ᚾ", name: "Nauthiz", keywords: ["Need", "constraint", "endurance"], element: "Fire",
    upright_meaning: "Highlights a time of struggle or need, encouraging patience and resourcefulness to overcome limitations.",
    reversed_meaning: "Suggests avoidance of responsibility or unnecessary suffering, urging proactive solutions.",
    facedown_meaning: "Implies a hidden challenge or need not yet recognized; deeper insight may reveal the lesson." },
  { number: 11, symbol: "ᛁ", name: "Isa", keywords: ["Stillness", "strength", "clarity"], element: "Ice",
    upright_meaning: "Offers a time of rest and clarity, strengthening resolve through stillness and emotional discipline.",
    reversed_meaning: "Warns of stagnation, emotional coldness, or resistance to change, urging gentle movement forward.",
    facedown_meaning: "Suggests a hidden pause or strength not yet active; the situation may need time to stabilize." },
  { number: 12, symbol: "ᛃ", name: "Jera", keywords: ["Patience", "harvest", "cycles"], element: "Earth",
    upright_meaning: "Promises the fruition of efforts through patience and alignment with natural cycles, bringing deserved success and harmony.",
    reversed_meaning: "Indicates impatience or disruption of cycles, leading to delayed rewards or imbalance, urging trust in the process.",
    facedown_meaning: "Implies a hidden reward or cycle not yet complete; patience will reveal the outcome." },
  { number: 13, symbol: "ᛇ", name: "Eihwaz", keywords: ["Endurance", "protection", "resilience"], element: "Earth",
    upright_meaning: "Provides enduring strength and protection, enabling you to face trials with courage and maintain balance.",
    reversed_meaning: "Suggests vulnerability, blocked progress, or fear of change, advising inner fortification.",
    facedown_meaning: "Indicates hidden resilience or a challenge not yet confronted; further insight may unlock this strength." },
  { number: 14, symbol: "ᛈ", name: "Perthro", keywords: ["Mystery", "fate", "insight"], element: "Water",
    upright_meaning: "Reveals secrets, enhances psychic abilities, and guides you toward your fate with trust in the unknown.",
    reversed_meaning: "Indicates confusion, resistance to fate, or hidden dangers, suggesting caution and introspection.",
    facedown_meaning: "Suggests a hidden destiny or insight not yet accessible; time or intuition may clarify the path." },
  { number: 15, symbol: "ᛉ", name: "Algiz", keywords: ["Protection", "divinity", "guidance"], element: "Air",
    upright_meaning: "Offers divine protection, enhances intuition, and safeguards your path with spiritual strength.",
    reversed_meaning: "Warns of vulnerability, ignored guidance, or spiritual disconnection, urging awareness.",
    facedown_meaning: "Implies hidden protection or guidance not yet active; the situation may require trust or patience." },
  { number: 16, symbol: "ᛋ", name: "Sowilo", keywords: ["Success", "vitality", "clarity"], element: "Fire",
    upright_meaning: "Brings success, vitality, and clear direction, illuminating your goals with radiant energy.",
    reversed_meaning: "Suggests burnout, lack of direction, or obscured goals, advising rest and realignment.",
    facedown_meaning: "Indicates hidden success or clarity not yet visible; further effort may bring it to light." },
  { number: 17, symbol: "ᛏ", name: "Tiwaz", keywords: ["Justice", "honor", "courage"], element: "Air",
    upright_meaning: "Encourages standing up for justice, leading with integrity, and making sacrifices for a higher cause.",
    reversed_meaning: "Suggests injustice, lack of direction, or cowardice, urging self-reflection and realignment with principles.",
    facedown_meaning: "Implies a hidden cause or honor not yet recognized; patience may reveal the path to justice." },
  { number: 18, symbol: "ᛒ", name: "Berkano", keywords: ["Growth", "fertility", "renewal"], element: "Earth",
    upright_meaning: "Signals growth, the start of new projects, and the nurturing of ideas or relationships with care.",
    reversed_meaning: "Indicates stagnation, blocked growth, or neglect, suggesting a need for attention and care.",
    facedown_meaning: "Suggests a hidden potential or birth not yet realized; time or effort may bring it forth." },
  { number: 19, symbol: "ᛖ", name: "Ehwaz", keywords: ["Progress", "partnership", "trust"], element: "Earth",
    upright_meaning: "Represents steady advancement through collaboration, trust in relationships, and a balanced journey toward goals.",
    reversed_meaning: "Suggests delays, mistrust, or misalignment in partnerships, advising patience and realignment of efforts.",
    facedown_meaning: "Implies a hidden alliance or journey not yet clear; further insight may reveal the path." },
  { number: 20, symbol: "ᛗ", name: "Mannaz", keywords: ["Community", "intelligence", "growth"], element: "Air",
    upright_meaning: "Enhances collaboration, personal growth, and community support, fostering shared understanding and strength.",
    reversed_meaning: "Indicates isolation, misunderstanding, or ego conflicts, suggesting reconnection and humility.",
    facedown_meaning: "Suggests a hidden connection or wisdom not yet accessible; community insight may emerge with time." },
  { number: 21, symbol: "ᛚ", name: "Laguz", keywords: ["Intuition", "flow", "healing"], element: "Water",
    upright_meaning: "Indicates a time of emotional clarity, intuitive guidance, and personal renewal through adaptability and inner reflection.",
    reversed_meaning: "Warns of emotional overwhelm, blocked intuition, or fear of change, suggesting a need for grounding and self-care.",
    facedown_meaning: "Implies hidden emotions or intuition not yet surfaced; deeper reflection may unlock this insight." },
  { number: 22, symbol: "ᛜ", name: "Ingwaz", keywords: ["Fertility", "potential", "growth"], element: "Earth",
    upright_meaning: "Promotes personal growth, potential realization, and communal harmony through sustained effort.",
    reversed_meaning: "Indicates stagnation, unfulfilled potential, or isolation, suggesting renewed focus.",
    facedown_meaning: "Suggests hidden potential or growth not yet manifest; patience or effort may bring it to fruition." },
  { number: 23, symbol: "ᛞ", name: "Dagaz", keywords: ["Transformation", "clarity", "breakthrough"], element: "Air",
    upright_meaning: "Signals a breakthrough, bringing clarity and transformation with the promise of new opportunities.",
    reversed_meaning: "Suggests resistance to change or obscured vision, advising openness to new perspectives.",
    facedown_meaning: "Implies a hidden transformation or clarity not yet visible; time may reveal the breakthrough." },
  { number: 24, symbol: "ᛟ", name: "Othala", keywords: ["Heritage", "home", "wisdom"], element: "Earth",
    upright_meaning: "Connects you to ancestral wisdom and personal security, offering stability and a sense of belonging.",
    reversed_meaning: "Warns of family discord, loss of heritage, or attachment to the past, urging release and renewal.",
    facedown_meaning: "Suggests a hidden legacy or security not yet accessible; further exploration may uncover this foundation." }
];

// Life Path Number meanings
const lifePathMeanings = {
  1: { name: "The Leader", keywords: ["Independence", "Innovation", "Leadership"], description: "Natural-born leaders with strong initiative and pioneering spirit." },
  2: { name: "The Cooperator", keywords: ["Harmony", "Partnership", "Diplomacy"], description: "Peaceful mediators who excel in relationships and teamwork." },
  3: { name: "The Creative", keywords: ["Expression", "Creativity", "Communication"], description: "Artistic souls with natural talent for inspiring others through expression." },
  4: { name: "The Builder", keywords: ["Stability", "Hard work", "Foundation"], description: "Practical builders who create lasting foundations through dedication." },
  5: { name: "The Explorer", keywords: ["Freedom", "Adventure", "Change"], description: "Free spirits who thrive on variety, travel, and new experiences." },
  6: { name: "The Nurturer", keywords: ["Responsibility", "Family", "Healing"], description: "Natural caregivers devoted to helping and healing others." },
  7: { name: "The Seeker", keywords: ["Spirituality", "Analysis", "Wisdom"], description: "Deep thinkers on a quest for truth and spiritual understanding." },
  8: { name: "The Achiever", keywords: ["Ambition", "Material success", "Authority"], description: "Natural executives with strong business acumen and material focus." },
  9: { name: "The Humanitarian", keywords: ["Service", "Compassion", "Universal love"], description: "Compassionate souls dedicated to serving humanity and making a difference." }
};

// Zodiac signs with date ranges
const zodiacSigns = [
  { name: "Aries", dates: "March 21 - April 19", element: "Fire", keywords: ["Leadership", "Courage", "Initiative"] },
  { name: "Taurus", dates: "April 20 - May 20", element: "Earth", keywords: ["Stability", "Persistence", "Luxury"] },
  { name: "Gemini", dates: "May 21 - June 20", element: "Air", keywords: ["Communication", "Versatility", "Curiosity"] },
  { name: "Cancer", dates: "June 21 - July 22", element: "Water", keywords: ["Nurturing", "Intuition", "Home"] },
  { name: "Leo", dates: "July 23 - August 22", element: "Fire", keywords: ["Creativity", "Confidence", "Generosity"] },
  { name: "Virgo", dates: "August 23 - September 22", element: "Earth", keywords: ["Service", "Analysis", "Perfection"] },
  { name: "Libra", dates: "September 23 - October 22", element: "Air", keywords: ["Balance", "Harmony", "Beauty"] },
  { name: "Scorpio", dates: "October 23 - November 21", element: "Water", keywords: ["Transformation", "Intensity", "Mystery"] },
  { name: "Sagittarius", dates: "November 22 - December 21", element: "Fire", keywords: ["Adventure", "Philosophy", "Freedom"] },
  { name: "Capricorn", dates: "December 22 - January 19", element: "Earth", keywords: ["Achievement", "Discipline", "Ambition"] },
  { name: "Aquarius", dates: "January 20 - February 18", element: "Air", keywords: ["Innovation", "Humanitarian", "Independence"] },
  { name: "Pisces", dates: "February 19 - March 20", element: "Water", keywords: ["Intuition", "Compassion", "Spirituality"] }
];

export default function CosmicFusionsPage() { // Kept original component name
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For AI reading generation
  const [isDeckLoading, setIsDeckLoading] = useState(true); // For decks/items loading
  const [reading, setReading] = useState(null);
  const [user, setUser] = useState(null);
  const [isDemoActive, setIsDemoActive] = useState(false);

  // New state variables for deck selection
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckItems, setDeckItems] = useState([]); // Can be OracleCard[] or Rune[]
  const [error, setError] = useState(null); // For general errors

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        // Check demo mode
        const demoActive = sessionStorage.getItem('isDemoActive') === 'true';
        setIsDemoActive(demoActive);
      } catch (err) {
        setUser(null);
      }
    };

    checkUser();
  }, []);

  const loadDecks = useCallback(async () => {
    setError(null);
    setIsDeckLoading(true);
    try {
      const [userDecks, publicDecks] = await Promise.all([
        Deck.list("-created_date"),
        Deck.filter({ is_public: true }, "-created_date")
      ]);

      // Combine user and public decks, filtering out duplicates from public if user has their own version
      const allDecks = [...publicDecks, ...userDecks.filter(deck => !publicDecks.some(p => p.id === deck.id))];
      const compatibleDecks = allDecks.filter(deck =>
        ['oracle', 'tarot', 'runes'].includes(deck.category)
      );

      setDecks(compatibleDecks);

      if (compatibleDecks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(compatibleDecks[0].id);
      }
    } catch (err) {
      setError("Failed to load divination decks. Please try again later.");
    } finally {
      setIsDeckLoading(false);
    }
  }, [selectedDeckId]);

  const loadDeckItems = useCallback(async (deckId) => {
    if (!deckId) {
      setDeckItems([]);
      return;
    }
    setError(null);
    setIsDeckLoading(true);
    try {
      const currentSelectedDeck = decks.find(deck => deck.id === deckId);
      if (!currentSelectedDeck) {
        setDeckItems([]);
        return;
      }

      if (currentSelectedDeck.category === 'runes') {
        // For rune decks, use the predefined elderFutharkRunes as "items"
        setDeckItems(elderFutharkRunes);
      } else {
        // For oracle or tarot decks, fetch OracleCards
        const items = await OracleCard.filter({ deck_id: deckId });
        setDeckItems(items);
      }
    } catch (err) {
      setError(`Failed to load ${selectedDeck?.category === 'runes' ? 'runes' : 'cards'} for the selected deck.`);
      setDeckItems([]);
    } finally {
      setIsDeckLoading(false);
    }
  }, [decks, selectedDeck]);

  // Effect to load decks on component mount
  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  // Effect to update selected deck and load its items when selectedDeckId or decks change
  useEffect(() => {
    if (selectedDeckId && decks.length > 0) {
      const deck = decks.find(d => d.id === selectedDeckId);
      setSelectedDeck(deck);
      loadDeckItems(selectedDeckId);
    } else {
      setSelectedDeck(null);
      setDeckItems([]);
    }
  }, [selectedDeckId, decks, loadDeckItems]);


  const calculateLifePath = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let sum = day + month + year;
    // Reduce until single digit (master numbers 11, 22, 33 are reduced for this system's interpretation)
    while (sum > 9) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum;
  };


  const getZodiacSign = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[0]; // Aries
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[1]; // Taurus
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[2]; // Gemini
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[3]; // Cancer
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[4]; // Leo
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[5]; // Virgo
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[6]; // Libra
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[7]; // Scorpio
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[8]; // Sagittarius
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[9]; // Capricorn
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[10]; // Aquarius
    return zodiacSigns[11]; // Pisces
  };

  const generateReading = async () => {
    const isRedstoneDeck = selectedDeck?.name?.toLowerCase().includes('redstone');
    const unitName = selectedDeck?.category === 'runes' ? 'Rune' : isRedstoneDeck ? 'Stone' : 'Card';
    const unitNamePlural = selectedDeck?.category === 'runes' ? 'Runes' : isRedstoneDeck ? 'Stones' : 'Cards';

    if (!name.trim() || !birthDate) {
      toast.error("Please enter your name and birth date.");
      return;
    }
    if (!selectedDeck || deckItems.length === 0) {
      toast.error(`Please select a deck with available ${unitNamePlural.toLowerCase()} to draw from.`);
      return;
    }

    if (!user || (user.subscription_tier !== 'premium' && !isDemoActive)) {
      return; // UpgradePrompt will be shown
    }

    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      // Calculate cosmic elements
      const lifePath = calculateLifePath(birthDate);
      const zodiacSign = getZodiacSign(birthDate);

      // Dynamic divination item selection
      const randomIndex = Math.floor(Math.random() * deckItems.length);
      const selectedDivinationItem = deckItems[randomIndex];
      let divinationItemData = {};
      let divinationItemPromptSection = "";
      let itemOrientation = null; // Used for runes only

      if (selectedDeck.category === 'runes') {
        itemOrientation = Math.floor(Math.random() * 3); // 0=upright, 1=reversed, 2=facedown
        const runeState = itemOrientation === 0 ? 'upright' : itemOrientation === 1 ? 'reversed' : 'facedown';
        divinationItemData = {
          ...selectedDivinationItem, // This is an item from elderFutharkRunes
          orientation: runeState,
          deckCategory: 'runes',
          deckName: selectedDeck.name // Add deck name for display
        };
        divinationItemPromptSection = `
**${selectedDeck.name || 'Elder Futhark Rune'} - ${divinationItemData.symbol} (${divinationItemData.name}) [${runeState.toUpperCase()}]**
- Element: ${divinationItemData.element}
- Keywords: ${divinationItemData.keywords.join(', ')}
- Meaning: ${divinationItemData[`${runeState}_meaning`]}
`;
      } else { // oracle or tarot
        divinationItemData = {
          ...selectedDivinationItem, // This is an OracleCard
          deckCategory: selectedDeck.category,
          deckName: selectedDeck.name // Add deck name for display
        };
        divinationItemPromptSection = `
**${selectedDeck.name || `Divination ${unitName}`} - "${divinationItemData.name}"**
- Keywords: ${divinationItemData.keywords?.join(', ') || 'Guidance, Wisdom, Insight'}
- Upright Meaning: ${divinationItemData.upright_meaning || 'Positive energy and forward movement'}
`;
      }

      const prompt = `You are the "Astral-Insight Cosmic Fusions Oracle," a master of ancient wisdom combining Numerology, Astrology, and the wisdom of the ${selectedDeck.name} ${unitNamePlural}. Create a unified, insightful reading for ${name} born on ${birthDate}.

**COSMIC ELEMENTS DRAWN:**

**Numerology - Life Path ${lifePath}: "${lifePathMeanings[lifePath].name}"**
- Keywords: ${lifePathMeanings[lifePath].keywords.join(', ')}
- Essence: ${lifePathMeanings[lifePath].description}

**Astrology - ${zodiacSign.name} (${zodiacSign.element})**
- Keywords: ${zodiacSign.keywords.join(', ')}
- Dates: ${zodiacSign.dates}

${divinationItemPromptSection}

**INSTRUCTIONS:**
Create a cohesive reading that weaves these three cosmic elements together. Structure as:

1. **Cosmic Welcome** - Greet ${name} personally and introduce their unique cosmic signature.
2. **Life Path Insight** - How their Life Path ${lifePath} shapes their journey.
3. **Zodiacal Influence** - How ${zodiacSign.name} energy enhances their path.
4. **Divination Guidance** - What ${divinationItemData.name} (${divinationItemData.deckCategory === 'runes' ? divinationItemData.orientation : 'Upright'}) from the ${selectedDeck.name} deck reveals about their current situation and provides specific direction. Focus on integrating this wisdom with the Life Path and Zodiac influences.
5. **Unified Synthesis** - Blend all elements into actionable cosmic guidance.

Address ${name} directly throughout. Make it personal, mystical, and practical. Use markdown formatting for clarity.`;

      const aiReading = await InvokeLLM({ prompt });

      // Increment user's total AI readings count
      if (user) {
        try {
          const newCount = (user.total_ai_readings_count || 0) + 1;
          await User.updateMyUserData({ total_ai_readings_count: newCount });
          // Optionally, update the local user state to reflect the new count
          setUser(prevUser => ({ ...prevUser, total_ai_readings_count: newCount }));
        } catch (updateError) {
          // Don't block the user from getting their reading, just log the error.
        }
      }

      setReading({
        name,
        birthDate,
        lifePath,
        zodiacSign,
        divinationItem: divinationItemData,
        aiReading
      });

    } catch (err) {
      setError("Failed to generate your cosmic reading. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show upgrade prompt for non-premium users
  if (user && user.subscription_tier !== 'premium' && !isDemoActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-gray-700 text-cyan-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center gap-2">
              <Stars className="w-8 h-8 text-purple-400" />
              Cosmic Fusions
            </h1>
          </div>
          <UpgradePrompt onClose={() => navigate(createPageUrl("Dashboard"))} />
        </div>
      </div>
    );
  }

  if (reading) {
    const isRedstoneDeckReading = reading.divinationItem.deckName?.toLowerCase().includes('redstone');
    const readingUnitName = reading.divinationItem.deckCategory === 'runes' ? 'Rune' : isRedstoneDeckReading ? 'Stone' : 'Card';

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center gap-2">
              <Stars className="w-8 h-8 text-purple-400" />
              Cosmic Fusions Reading
            </h1>
            <Button
              onClick={() => setReading(null)}
              variant="outline"
              className="border-gray-700 text-cyan-300 hover:bg-gray-800"
            >
              New Reading
            </Button>
          </div>

          {/* Cosmic Elements Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Life Path */}
            <Card className="bg-black/50 backdrop-blur-sm rounded-2xl border border-purple-500/30">
              <CardHeader className="text-center">
                <Calculator className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <CardTitle className="text-amber-300">Life Path {reading.lifePath}</CardTitle>
                <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">
                  {lifePathMeanings[reading.lifePath].name}
                </Badge>
              </CardHeader>
            </Card>

            {/* Zodiac */}
            <Card className="bg-black/50 backdrop-blur-sm rounded-2xl border border-purple-500/30">
              <CardHeader className="text-center">
                <Stars className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <CardTitle className="text-cyan-300">{reading.zodiacSign.name}</CardTitle> {/* Changed text color */}
                <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30"> {/* Changed badge colors */}
                  {reading.zodiacSign.element}
                </Badge>
              </CardHeader>
            </Card>

            {/* Divination Item (Rune/Card) */}
            <Card className="bg-black/50 backdrop-blur-sm rounded-2xl border border-purple-500/30">
              <CardHeader className="text-center">
                {reading.divinationItem.deckCategory === 'runes' ? (
                  <div className="text-4xl mb-2">{reading.divinationItem.symbol}</div>
                ) : (
                  reading.divinationItem.image_url ? (
                    <img
                      src={reading.divinationItem.image_url}
                      alt={reading.divinationItem.name}
                      className={`mx-auto mb-2 rounded-lg ${isRedstoneDeckReading ? 'w-24 h-24 object-contain' : 'w-16 h-24 object-cover'}`}
                    />
                  ) : (
                    <Wand2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  )
                )}
                <CardTitle className="text-purple-300 text-sm">{reading.divinationItem.name}</CardTitle>
                <Badge className={`border ${
                  reading.divinationItem.deckCategory === 'runes' ?
                  (reading.divinationItem.orientation === 'upright' ? 'bg-green-500/20 text-green-200 border-green-500/30' :
                  reading.divinationItem.orientation === 'reversed' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
                  'bg-gray-500/20 text-gray-200 border-gray-500/30') :
                  (isRedstoneDeckReading ? 'bg-orange-500/20 text-orange-200 border-orange-500/30' :
                   reading.divinationItem.deckCategory === 'oracle' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
                   reading.divinationItem.deckCategory === 'tarot' ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' :
                   'bg-gray-500/20 text-gray-200 border-gray-500/30')
                }`}>
                  {reading.divinationItem.deckCategory === 'runes' ?
                   reading.divinationItem.orientation :
                   readingUnitName
                  }
                </Badge>
                {reading.divinationItem.deckName && (
                  <p className="text-xs text-purple-200 mt-1">{reading.divinationItem.deckName}</p>
                )}
              </CardHeader>
            </Card>
          </div>

          {/* AI Reading */}
          <Card className="bg-black/50 backdrop-blur-sm rounded-2xl border border-purple-500/30">
            <CardContent className="p-8">
              <div className="prose prose-invert prose-p:text-purple-200/90 prose-h3:text-cyan-300 prose-strong:text-cyan-200 max-w-none">
                <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300 mb-6">Your Cosmic Blueprint</h2>
                <div dangerouslySetInnerHTML={{
                  __html: reading.aiReading.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isRedstoneDeckSelected = selectedDeck?.name?.toLowerCase().includes('redstone');
  const selectedUnitNamePlural = selectedDeck?.category === 'runes' ? 'runes' : isRedstoneDeckSelected ? 'stones' : 'cards';


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-black text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto" // Adjusted max-width for the overall container
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-gray-700 text-cyan-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center gap-3">
              <Stars className="w-10 h-10 text-purple-400" />
              Cosmic Fusions
            </h1>
          </div>
          <p className="text-xl text-cyan-300/80 mb-4">
            Ancient Wisdom • Modern Insight
          </p>
          <p className="text-purple-300/70 max-w-2xl mx-auto mt-2">
            Experience a unified reading combining Numerology, Astrology, and your chosen Divination wisdom.
          </p>
        </div>

        <Card className="bg-black/50 backdrop-blur-sm rounded-2xl border border-purple-500/30"> {/* Updated Card styling */}
          <CardHeader>
            <CardTitle className="text-center text-purple-300 flex items-center justify-center gap-2"> {/* Updated CardTitle styling */}
              <Sparkles className="w-6 h-6 text-purple-400" />
              Enter Your Cosmic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-lg font-semibold text-cyan-300 mb-2 block"> {/* Using Label component */}
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-black border-purple-500/30 text-cyan-300 placeholder:text-gray-600 focus:border-purple-400" // Updated Input styling
              />
            </div>

            <div>
              <Label htmlFor="birthdate" className="text-lg font-semibold text-cyan-300 mb-2 block"> {/* Using Label component */}
                Birth Date
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-black border-purple-500/30 text-cyan-300" // Updated Input styling
              />
            </div>

            {/* Deck Selection */}
            <div className="space-y-2">
              <Label htmlFor="deck-select" className="text-lg font-semibold text-cyan-300 mb-2 block"> {/* Using Label component */}
                Select Your Divination Deck
              </Label>
              <Select value={selectedDeckId || ""} onValueChange={setSelectedDeckId} disabled={isDeckLoading}>
                <SelectTrigger id="deck-select" className="bg-black border-purple-500/30 text-cyan-300"> {/* Updated SelectTrigger styling */}
                  <SelectValue placeholder={isDeckLoading ? "Loading decks..." : "Choose your deck..."} />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-purple-700 text-cyan-300"> {/* Updated SelectContent styling */}
                  {decks.length === 0 && !isDeckLoading ? (
                    <SelectItem value="no-decks" disabled>No compatible decks found</SelectItem>
                  ) : (
                    decks.map(deck => (
                      <SelectItem key={deck.id} value={deck.id} className="hover:bg-purple-900/50"> {/* Added hover style */}
                        <div className="flex items-center gap-2">
                          {deck.category === 'oracle' && deck.name?.toLowerCase().includes('redstone') ? <Sparkles className="w-4 h-4 text-orange-400" /> :
                           deck.category === 'oracle' ? <Sparkles className="w-4 h-4 text-cyan-400" /> :
                           deck.category === 'tarot' ? <Star className="w-4 h-4 text-yellow-400" /> :
                           deck.category === 'runes' ? <Moon className="w-4 h-4 text-gray-400" /> :
                           <BookOpen className="w-4 h-4 text-purple-400" />
                          }
                          {deck.name}
                          {deck.is_public && <span className="text-xs text-amber-400">(Official)</span>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedDeck && (
                <p className="text-sm text-purple-300/80 mt-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> {/* Using BookOpen icon */}
                  {deckItems.length} {selectedUnitNamePlural} available
                </p>
              )}
            </div>

            <Button
              onClick={generateReading}
              disabled={isLoading || isDeckLoading || !name.trim() || !birthDate || !selectedDeckId || deckItems.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin mr-2" /> {/* Using Loader2 for spinner */}
                  Consulting the Cosmic Forces...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Stars className="w-5 h-5" />
                  Generate Cosmic Fusion Reading
                </div>
              )}
            </Button>
            <div className="text-center text-sm text-purple-300">
              <Crown className="w-4 h-4 inline mr-1" />
              Premium Feature • Unlimited Readings
            </div>
          </CardContent>
        </Card>

        {error && ( // General error display block
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 bg-red-900/50 border border-red-500/50 rounded-lg p-6 text-center text-red-300"
          >
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}