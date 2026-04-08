export const QUESTION_CATEGORIES = [
  {
    name: "Love",
    description: "romance, relationships, attraction, emotional bonds",
    example_questions: [
      "How can I attract a healthy partner?",
      "What does my current relationship need?"
    ]
  },
  {
    name: "Work",
    description: "career, purpose, professional growth, daily tasks",
    example_questions: [
      "What career path should I pursue?",
      "How do I handle this work challenge?"
    ]
  },
  {
    name: "Money",
    description: "finances, abundance, prosperity, material flow",
    example_questions: [
      "What blocks my financial growth?",
      "Is this investment wise right now?"
    ]
  },
  {
    name: "Intuition",
    description: "inner guidance, psychic senses, subconscious messages",
    example_questions: [
      "What is my intuition trying to tell me?",
      "How can I strengthen my inner knowing?"
    ]
  },
  {
    name: "Personal Growth",
    description: "self-development, healing, evolution, life lessons",
    example_questions: [
      "What do I need to release for growth?",
      "How can I become my best self?"
    ]
  },
  {
    name: "Family",
    description: "home life, relatives, ancestry, domestic harmony",
    example_questions: [
      "How can I improve family dynamics?",
      "What ancestral pattern needs healing?"
    ]
  },
  {
    name: "Conflict",
    description: "disagreements, tension, resolution, boundaries",
    example_questions: [
      "How do I resolve this argument?",
      "What is the root of this conflict?"
    ]
  },
  {
    name: "Lust",
    description: "passion, desire, sensuality, physical attraction",
    example_questions: [
      "What fuels my passion right now?",
      "How can I express healthy desire?"
    ]
  }
];

export const COSMIC_SYMBOLS = {
  categories: [
    {
      name: "Celestial Bodies",
      description: "light, power, visibility",
      symbols: [
        { name: "Sun", number: 2824, meaning: "Vitality, conscious clarity, outward success" },
        { name: "Moon", number: 1409, meaning: "Intuition, emotional tides, inner rhythms" },
        { name: "Star", number: 5506, meaning: "Hope, distant guidance, unique spark" },
        { name: "Comet", number: 5012, meaning: "Sudden insight, swift opportunity, fleeting message" }
      ]
    },
    {
      name: "Lunar Phases",
      description: "cycles, timing, emotional flow",
      symbols: [
        { name: "New Moon", number: 4657, meaning: "Fresh beginnings, hidden potential, intention setting" },
        { name: "Crescent Moon", number: 3286, meaning: "Building growth, subtle emergence" },
        { name: "Full Moon", number: 2679, meaning: "Peak illumination, culmination, emotional height" },
        { name: "Waning Moon", number: 9935, meaning: "Release, reflection, gentle closure" }
      ]
    },
    {
      name: "Planetary Forces",
      description: "core drives, influences",
      symbols: [
        { name: "Mercury", number: 2424, meaning: "Quick thought, communication, agile mind" },
        { name: "Venus", number: 7912, meaning: "Harmony, attraction, heart connections" },
        { name: "Mars", number: 1520, meaning: "Courage, drive, focused action" },
        { name: "Jupiter", number: 1488, meaning: "Expansion, opportunity, broader view" },
        { name: "Saturn", number: 2535, meaning: "Structure, endurance, karmic lessons" }
      ]
    },
    {
      name: "Crystals & Gems",
      description: "vibrational anchors, energetic tones",
      symbols: [
        { name: "Moonstone", number: 4582, meaning: "Gentle intuition, emotional flow, feminine rhythms" },
        { name: "Amethyst", number: 4811, meaning: "Calm clarity, spiritual protection, higher awareness" },
        { name: "Citrine", number: 9279, meaning: "Joyful expansion, personal power, bright abundance" },
        { name: "Lapis Lazuli", number: 1434, meaning: "Truthful vision, ancient wisdom, clear expression" },
        { name: "Rose Quartz", number: 4257, meaning: "Heart softening, compassionate connection, unconditional love" },
        { name: "Clear Quartz", number: 9928, meaning: "Pure amplification, focused energy, universal clarity" }
      ]
    },
    {
      name: "Astral Phenomena & Ether",
      description: "mystery, vastness, wonder",
      symbols: [
        { name: "Nebula", number: 7873, meaning: "Creative birth, swirling potential, cosmic clouds" },
        { name: "Galaxy", number: 4611, meaning: "Interconnected destiny, vast patterns, collective story" },
        { name: "Aurora", number: 8359, meaning: "Ethereal dance, shifting beauty, wonder in motion" },
        { name: "Black Hole", number: 5557, meaning: "Deep pull, transformation, surrender to unknown" },
        { name: "Constellation", number: 1106, meaning: "Soul mapping, pattern recognition, guiding stories" }
      ]
    }
  ]
};

export const WATER_SYMBOLS = {
  purpose: "Universal water-themed cosmic symbols suitable for any deck manual or oracle reading engine",
  description: "Flexible, broad meanings focused on flow, emotion, intuition, and coastal energy. Designed to layer over any specific card meanings without conflict.",
  categories: [
    {
      name: "Ocean Depths",
      description: "emotion, mystery, subconscious flow",
      symbols: [
        { name: "Wave", number: 3741, meaning: "Natural rhythm, emotional movement, going with the current" },
        { name: "Tide", number: 6298, meaning: "Ebb and flow, timing, pull of unseen forces" },
        { name: "Depths", number: 1853, meaning: "Hidden truths below surface, deep calm or pressure" },
        { name: "Current", number: 7462, meaning: "Invisible direction, gentle guidance or strong pull" }
      ]
    },
    {
      name: "Coastal Elements",
      description: "shoreline, transition, relaxation",
      symbols: [
        { name: "Shore", number: 9127, meaning: "Meeting point of worlds, grounding after flow, gentle arrival" },
        { name: "Sand", number: 4839, meaning: "Shifting foundation, time passing, building then releasing" },
        { name: "Shell", number: 2574, meaning: "Protective beauty, inner wisdom revealed, simple treasures" },
        { name: "Driftwood", number: 6381, meaning: "What the sea shapes and delivers, resilient surrender" }
      ]
    },
    {
      name: "Water Forms",
      description: "states of being, adaptability",
      symbols: [
        { name: "Ripple", number: 1946, meaning: "Small actions creating big change, subtle influence" },
        { name: "Mist", number: 8205, meaning: "Soft mystery, diffused clarity, gentle intuition" },
        { name: "Cascade", number: 3659, meaning: "Refreshing release, waterfall energy, cleansing drop" },
        { name: "Pool", number: 5712, meaning: "Still reflection, quiet gathering, inner peace" }
      ]
    },
    {
      name: "Sea Life",
      description: "playful spirit, instinct, freedom",
      symbols: [
        { name: "Dolphin", number: 4398, meaning: "Joyful flow, community, leaping through waves" },
        { name: "Seagull", number: 7064, meaning: "Free perspective, soaring above, opportunistic wisdom" },
        { name: "Turtle", number: 1289, meaning: "Slow steady journey, ancient protection, patient navigation" },
        { name: "Jellyfish", number: 5837, meaning: "Graceful drift, soft boundaries, translucent presence" }
      ]
    },
    {
      name: "Aquatic Essence",
      description: "healing, essence, cosmic water",
      symbols: [
        { name: "Saltwater", number: 9472, meaning: "Cleansing bite, healing sting, purifying tears of the sea" },
        { name: "Coral", number: 3126, meaning: "Building community, fragile strength, underwater garden" },
        { name: "Breeze", number: 6740, meaning: "Sea wind carrying change, light refreshment over water" },
        { name: "Horizon", number: 2195, meaning: "Endless possibility, where sea meets sky, open future" }
      ]
    }
  ]
};