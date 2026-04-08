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

export default function CosmicSymbolSprite({ name, className = "w-16 h-16" }) {
  if (!name) return null;
  
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