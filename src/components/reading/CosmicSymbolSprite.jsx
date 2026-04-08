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

const FIRE_URL = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/3d2aef139_2D416EFE-59DD-4AF7-9F78-41BBAD40DBD5.jpg";
const EARTH_URL = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/dbc2870e2_6316F7F4-A8D5-4DF1-804E-2456112D7D2E.jpg";
const WIND_URL = "https://media.base44.com/images/public/68d2a300021f94d0f312c039/413c41ba2_D91B387A-78B7-4CC3-A954-4BA5AF23FBA1.jpg";

const ELEMENTAL_MAP = {
  // Fire
  "Flame": { url: FIRE_URL, x: 2, color: 'rgba(255, 100, 50, 0.6)' },
  "Ember": { url: FIRE_URL, x: 26, color: 'rgba(255, 100, 50, 0.6)' },
  "Inferno": { url: FIRE_URL, x: 50, color: 'rgba(255, 100, 50, 0.6)' },
  "Spark": { url: FIRE_URL, x: 74, color: 'rgba(255, 100, 50, 0.6)' },
  "Phoenix": { url: FIRE_URL, x: 98, color: 'rgba(255, 100, 50, 0.6)' },
  // Wind
  "Gust": { url: WIND_URL, x: 2, color: 'rgba(200, 200, 255, 0.6)' },
  "Breeze": { url: WIND_URL, x: 26, color: 'rgba(200, 200, 255, 0.6)' },
  "Whirlwind": { url: WIND_URL, x: 50, color: 'rgba(200, 200, 255, 0.6)' },
  "Feather": { url: WIND_URL, x: 74, color: 'rgba(200, 200, 255, 0.6)' },
  "Sky": { url: WIND_URL, x: 98, color: 'rgba(200, 200, 255, 0.6)' },
  // Earth
  "Mountain": { url: EARTH_URL, x: 2, color: 'rgba(100, 255, 100, 0.6)' },
  "Tree": { url: EARTH_URL, x: 26, color: 'rgba(100, 255, 100, 0.6)' },
  "Stone": { url: EARTH_URL, x: 50, color: 'rgba(100, 255, 100, 0.6)' },
  "Seed": { url: EARTH_URL, x: 74, color: 'rgba(100, 255, 100, 0.6)' },
  "Soil": { url: EARTH_URL, x: 98, color: 'rgba(100, 255, 100, 0.6)' },
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
          backgroundImage: `url(${pos.url})`,
          backgroundSize: '530%',
          backgroundPosition: `${pos.x}% 40%`,
          filter: `drop-shadow(0px 0px 6px ${pos.color})`,
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