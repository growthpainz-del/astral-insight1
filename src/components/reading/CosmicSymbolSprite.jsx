import React from 'react';

const SYMBOL_ORDER = [
  "Sun", "Moon", "Star", "Comet", "New Moon", "Crescent Moon", "Full Moon", "Waning Moon",
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Moonstone", "Amethyst", "Citrine",
  "Lapis Lazuli", "Rose Quartz", "Clear Quartz", "Nebula", "Galaxy", "Aurora", "Black Hole", "Constellation"
];

const WATER_SYMBOL_ORDER = [
  "Wave", "Tide", "Depths", "Current", "Shore", "Sand", "Shell", "Driftwood",
  "__dup_shore", "__dup_sand", "__dup_shell", "__dup_driftwood", "Ripple", "Mist", "Cascade", "Pool",
  "Dolphin", "Seagull", "Turtle", "Jellyfish", "Saltwater", "Coral", "Breeze", "Horizon"
];

const ELEMENTAL_MAP = {
  // Fire
  "Flame": { x: 48, y: 16 },
  "Ember": { x: 68, y: 16 },
  "Inferno": { x: 87, y: 16 },
  "Phoenix": { x: 106, y: 16 },
  "Spark": { x: 68, y: 16 }, // Fallback to Ember
  // Wind
  "Gust": { x: 48, y: 50 },
  "Breeze": { x: 68, y: 50 },
  "Whirlwind": { x: 87, y: 50 },
  "Feather": { x: 106, y: 50 },
  "Sky": { x: 68, y: 50 }, // Fallback to Breeze
  // Earth
  "Mountain": { x: 48, y: 86 },
  "Tree": { x: 68, y: 86 },
  "Stone": { x: 87, y: 86 },
  "Seed": { x: 106, y: 86 },
  "Soil": { x: 106, y: 86 }, // Fallback to Seed
};

export default function CosmicSymbolSprite({ name, className = "w-16 h-16" }) {
  if (!name) return null;

  const elementalKey = Object.keys(ELEMENTAL_MAP).find(k => k.toLowerCase() === name.toLowerCase());
  if (elementalKey) {
    const pos = ELEMENTAL_MAP[elementalKey];
    return (
      <div 
        className={`inline-block rounded-full ${className}`} 
        title={name}
        style={{
          backgroundImage: `url(https://media.base44.com/images/public/68d2a300021f94d0f312c039/166426d46_30AA78D8-58C5-4F34-9397-0481786F0F20.jpg)`,
          backgroundSize: '750%',
          backgroundPosition: `${pos.x}% ${pos.y}%`,
          filter: 'invert(1) drop-shadow(0px 0px 6px rgba(255, 150, 50, 0.4))',
          backgroundColor: '#000'
        }}
      />
    );
  }
  
  let isWater = false;
  let index = SYMBOL_ORDER.findIndex(s => s.toLowerCase() === name.toLowerCase());
  
  if (index === -1) {
    index = WATER_SYMBOL_ORDER.findIndex(s => s.toLowerCase() === name.toLowerCase());
    if (index !== -1) {
      isWater = true;
    }
  }
  
  if (index === -1) {
    return null;
  }

  // 3 rows, 8 columns
  const col = index % 8;
  const row = Math.floor(index / 8);

  const imgSrc = isWater 
    ? "https://media.base44.com/images/public/68d2a300021f94d0f312c039/26b0dc627_image.png" 
    : "https://media.base44.com/images/public/68d2a300021f94d0f312c039/ae87939d9_IMG_8393.png";

  return (
    <div 
      className={`relative inline-block overflow-hidden rounded-md ${className}`} 
      title={name}
    >
      <img 
        src={imgSrc}
        alt={name}
        className="absolute max-w-none"
        style={{
          width: '800%',
          left: `${col * -100}%`,
          top: 0,
          transform: `translateY(-${row * 33.33333}%)`,
          filter: isWater ? 'invert(1) drop-shadow(0px 0px 6px rgba(56, 189, 248, 0.4))' : 'invert(1) drop-shadow(0px 0px 6px rgba(0, 255, 255, 0.4))'
        }}
      />
    </div>
  );
}