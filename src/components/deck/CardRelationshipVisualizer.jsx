import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Network,
  Grid3x3,
  Sparkles,
  Star,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  Zap,
  Check,
  X as XIcon
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Analyze visual similarities between two card images using AI
async function analyzeImageSimilarity(card1, card2) {
  if (!card1.image_url || !card2.image_url) {
    return { similarity: 0, reasons: [] };
  }

  try {
    console.log(`🖼️ Analyzing image similarity: ${card1.name} ↔ ${card2.name}`);

    const prompt = [
      "You are analyzing two oracle/tarot card images to detect visual relationships.",
      "",
      `Card 1: "${card1.name}"`,
      `Card 2: "${card2.name}"`,
      "",
      "Analyze these images and identify ANY visual connections:",
      "- Similar color palettes or dominant colors",
      "- Shared symbols, objects, or imagery (animals, celestial bodies, elements, tools, etc.)",
      "- Similar composition or layout",
      "- Matching visual themes or moods",
      "- Contrasting visual elements that create meaningful opposition",
      "",
      "Return JSON with:",
      "- similarity: number 0-1 (0=no connection, 1=very similar)",
      "- shared_visual_elements: array of specific shared elements you observe",
      "- visual_theme: brief description of the shared or contrasting visual theme",
      "- notes: any other visual observations"
    ].join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          similarity: { type: "number" },
          shared_visual_elements: { type: "array", items: { type: "string" } },
          visual_theme: { type: "string" },
          notes: { type: "string" }
        }
      },
      file_urls: [card1.image_url, card2.image_url]
    });

    const data = response || {};
    const similarity = Math.max(0, Math.min(1, data.similarity || 0));
    const elements = Array.isArray(data.shared_visual_elements) ? data.shared_visual_elements : [];

    const reasons = [];
    if (elements.length > 0) {
      reasons.push(`Visual: ${elements.slice(0, 3).join(', ')}`);
    }
    if (data.visual_theme) {
      reasons.push(`Theme: ${data.visual_theme}`);
    }

    console.log(`  ✓ Image similarity: ${similarity.toFixed(2)} - ${reasons.join('; ')}`);

    return {
      similarity,
      reasons,
      visualElements: elements,
      theme: data.visual_theme
    };
  } catch (error) {
    console.error(`  ✗ Image analysis failed:`, error.message);
    return { similarity: 0, reasons: [] };
  }
}

// Analyze semantic similarities in meanings using AI
async function analyzeMeaningSimilarity(card1, card2) {
  try {
    console.log(`📝 Analyzing meaning similarity: ${card1.name} ↔ ${card2.name}`);

    const card1Meanings = [
      card1.overall_meaning,
      card1.upright_meaning,
      card1.reversed_meaning
    ].filter(Boolean).join('\n\n');

    const card2Meanings = [
      card2.overall_meaning,
      card2.upright_meaning,
      card2.reversed_meaning
    ].filter(Boolean).join('\n\n');

    if (!card1Meanings.trim() || !card2Meanings.trim()) {
      return { similarity: 0, reasons: [] };
    }

    const prompt = [
      "You are analyzing the meanings of two divination cards to detect thematic relationships.",
      "",
      `Card 1: "${card1.name}"`,
      `Meanings: ${card1Meanings.slice(0, 500)}`,
      "",
      `Card 2: "${card2.name}"`,
      `Meanings: ${card2Meanings.slice(0, 500)}`,
      "",
      "Detect ANY meaningful connections:",
      "- Shared spiritual/emotional themes",
      "- Complementary energies (cards that work well together)",
      "- Contrasting or opposing concepts",
      "- Similar life situations or questions they address",
      "- Sequential journey or progression",
      "",
      "Return JSON with:",
      "- similarity: number 0-1 (0=unrelated, 1=deeply connected)",
      "- connection_type: 'complement' | 'contrast' | 'progression' | 'parallel' | 'cause_effect'",
      "- shared_themes: array of specific themes both cards address",
      "- relationship_note: brief explanation of how they relate"
    ].join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          similarity: { type: "number" },
          connection_type: { type: "string" },
          shared_themes: { type: "array", items: { type: "string" } },
          relationship_note: { type: "string" }
        }
      }
    });

    const data = response || {};
    const similarity = Math.max(0, Math.min(1, data.similarity || 0));
    const themes = Array.isArray(data.shared_themes) ? data.shared_themes : [];

    const reasons = [];
    if (themes.length > 0) {
      reasons.push(`Themes: ${themes.slice(0, 3).join(', ')}`);
    }
    if (data.relationship_note) {
      reasons.push(data.relationship_note);
    }

    console.log(`  ✓ Meaning similarity: ${similarity.toFixed(2)} - ${reasons.join('; ')}`);

    return {
      similarity,
      reasons,
      connectionType: data.connection_type,
      themes
    };
  } catch (error) {
    console.error(`  ✗ Meaning analysis failed:`, error.message);
    return { similarity: 0, reasons: [] };
  }
}

// Detect upright/reversed meaning contrasts
function detectUprightReversedRelationships(card1, card2) {
  const reasons = [];
  let strength = 0;

  // Check if one card's upright meaning relates to another's reversed meaning
  const u1 = (card1.upright_meaning || '').toLowerCase();
  const r1 = (card1.reversed_meaning || '').toLowerCase();
  const u2 = (card2.upright_meaning || '').toLowerCase();
  const r2 = (card2.reversed_meaning || '').toLowerCase();

  if (u1 && r2 && u1.length > 50 && r2.length > 50) {
    // Look for contrasting pairs
    const contrastWords = ['opposite', 'contrary', 'reverse', 'lack', 'excess', 'imbalance'];
    const hasContrast = contrastWords.some(word => r2.includes(word));

    if (hasContrast) {
      reasons.push(`Upright/reversed contrast: ${card1.name} upright ↔ ${card2.name} reversed`);
      strength += 0.2;
    }
  }

  if (u2 && r1 && u2.length > 50 && r1.length > 50) {
    const contrastWords = ['opposite', 'contrary', 'reverse', 'lack', 'excess', 'imbalance'];
    const hasContrast = contrastWords.some(word => r1.includes(word));

    if (hasContrast) {
      reasons.push(`Upright/reversed contrast: ${card2.name} upright ↔ ${card1.name} reversed`);
      strength += 0.2;
    }
  }

  return { strength, reasons };
}

// Detect relationships between cards automatically
async function detectRelationships(cards, options = {}) {
  const {
    includeImageAnalysis = false,
    includeMeaningAnalysis = false,
    maxImagePairs = 10, // Limit image analysis pairs to avoid rate limits
    onProgress
  } = options;

  if (!cards || cards.length < 2) {
    console.log('⚠️ Not enough cards for relationship detection');
    return [];
  }

  console.log(`🔍 Detecting relationships for ${cards.length} cards...`);
  console.log(`📊 Options: imageAnalysis=${includeImageAnalysis}, meaningAnalysis=${includeMeaningAnalysis}`);

  const relationships = [];
  const totalPairs = (cards.length * (cards.length - 1)) / 2;
  let processedPairs = 0;
  let imagePairsAnalyzed = 0;

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const card1 = cards[i];
      const card2 = cards[j];

      if (!card1 || !card2 || !card1.id || !card2.id) {
        console.log('⚠️ Skipping invalid cards');
        continue;
      }

      processedPairs++;
      if (onProgress) {
        onProgress({ current: processedPairs, total: totalPairs });
      }

      const detection = {
        card1,
        card2,
        reasons: [],
        sharedKeywords: [],
        strength: 0,
        type: null,
        elementRelation: 'none',
        visualElements: [],
        semanticThemes: []
      };

      // Check shared keywords (case-insensitive)
      const keywords1 = Array.isArray(card1.keywords) ? card1.keywords.map(k => String(k).toLowerCase().trim()) : [];
      const keywords2 = Array.isArray(card2.keywords) ? card2.keywords.map(k => String(k).toLowerCase().trim()) : [];
      const shared = keywords1.filter(k => k && keywords2.includes(k));

      if (shared.length > 0) {
        detection.sharedKeywords = shared;
        detection.reasons.push(`${shared.length} shared keyword${shared.length > 1 ? 's' : ''}: ${shared.slice(0, 3).join(', ')}`);
        detection.strength += shared.length * 0.2;
        detection.type = 'thematic';
        console.log(`  ✓ ${card1.name} ↔ ${card2.name}: ${shared.length} shared keywords`);
      }

      // Check elemental relationship
      const elem1 = card1.element?.toLowerCase?.()?.trim();
      const elem2 = card2.element?.toLowerCase?.()?.trim();

      if (elem1 && elem2 && elem1 !== 'none' && elem2 !== 'none') {
        if (elem1 === elem2) {
          detection.reasons.push(`Same element: ${elem1}`);
          detection.strength += 0.4;
          detection.type = 'elemental';
          detection.elementRelation = 'same';
          console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Same element (${elem1})`);
        } else {
          const complements = { 'fire': 'air', 'air': 'fire', 'water': 'earth', 'earth': 'water' };
          if (complements[elem1] === elem2) {
            detection.reasons.push(`Complementary elements: ${elem1} & ${elem2}`);
            detection.strength += 0.3;
            detection.type = 'elemental';
            detection.elementRelation = 'complementary';
            console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Complementary elements`);
          } else {
            const opposites = { 'fire': 'water', 'water': 'fire', 'air': 'earth', 'earth': 'air' };
            if (opposites[elem1] === elem2) {
              detection.reasons.push(`Opposing elements: ${elem1} vs ${elem2}`);
              detection.strength += 0.25;
              detection.type = 'contrast';
              detection.elementRelation = 'opposing';
              console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Opposing elements`);
            }
          }
        }
      }

      // Check sequential numbers
      const num1 = Number(card1.number);
      const num2 = Number(card2.number);
      if (Number.isFinite(num1) && Number.isFinite(num2)) {
        const diff = Math.abs(num1 - num2);
        if (diff === 1) {
          detection.reasons.push(`Sequential cards: #${num1} and #${num2}`);
          detection.strength += 0.35;
          detection.type = 'sequence';
          console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Sequential numbers`);
        } else if (diff <= 3) {
          detection.reasons.push(`Nearby cards: #${num1} and #${num2}`);
          detection.strength += 0.15;
          if (!detection.type) detection.type = 'sequence';
          console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Nearby numbers`);
        }
      }

      // Check thematic similarity in meanings (expanded word list)
      const meaning1 = (card1.overall_meaning || card1.upright_meaning || '').toLowerCase();
      const meaning2 = (card2.overall_meaning || card2.upright_meaning || '').toLowerCase();

      const thematicWords = [
        'love', 'wisdom', 'growth', 'transformation', 'power', 'balance', 'harmony', 'change',
        'strength', 'courage', 'clarity', 'intuition', 'healing', 'guidance', 'protection',
        'abundance', 'prosperity', 'success', 'challenge', 'conflict', 'peace', 'joy',
        'sorrow', 'fear', 'hope', 'faith', 'trust', 'betrayal', 'truth', 'deception',
        'beginning', 'ending', 'journey', 'destiny', 'choice', 'decision', 'action',
        'patience', 'perseverance', 'victory', 'defeat', 'loss', 'gain', 'sacrifice'
      ];

      const themes1 = thematicWords.filter(w => meaning1.includes(w));
      const themes2 = thematicWords.filter(w => meaning2.includes(w));
      const sharedThemes = themes1.filter(t => themes2.includes(t));

      if (sharedThemes.length > 0) {
        detection.reasons.push(`Shared themes: ${sharedThemes.slice(0, 3).join(', ')}`);
        detection.strength += sharedThemes.length * 0.15;
        if (!detection.type) detection.type = 'thematic';
        console.log(`  ✓ ${card1.name} ↔ ${card2.name}: ${sharedThemes.length} shared themes`);
      }

      // NEW: Detect upright/reversed contrasts
      const uprightReversedAnalysis = detectUprightReversedRelationships(card1, card2);
      if (uprightReversedAnalysis.strength > 0) {
        detection.reasons.push(...uprightReversedAnalysis.reasons);
        detection.strength += uprightReversedAnalysis.strength;
        if (!detection.type) detection.type = 'contrast';
        console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Upright/reversed contrast`);
      }

      // Check name similarity
      const name1Words = (card1.name || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const name2Words = (card2.name || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const sharedNameWords = name1Words.filter(w => name2Words.includes(w));

      if (sharedNameWords.length > 0) {
        detection.reasons.push(`Similar names: "${sharedNameWords.join(', ')}"`);
        detection.strength += sharedNameWords.length * 0.1;
        if (!detection.type) detection.type = 'thematic';
        console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Similar name words`);
      }

      // NEW: Deep meaning analysis using AI
      if (includeMeaningAnalysis && (meaning1.length > 50 || meaning2.length > 50)) {
        try {
          const meaningAnalysis = await analyzeMeaningSimilarity(card1, card2);
          if (meaningAnalysis.similarity > 0.3) {
            detection.reasons.push(...meaningAnalysis.reasons);
            detection.strength += meaningAnalysis.similarity * 0.4; // Weight semantic analysis heavily
            detection.semanticThemes = meaningAnalysis.themes || [];

            if (meaningAnalysis.connectionType === 'contrast' && detection.type !== 'contrast') {
              detection.type = 'contrast';
            } else if (meaningAnalysis.connectionType === 'progression' && !detection.type) {
              detection.type = 'sequence';
            } else if (!detection.type) {
              detection.type = 'thematic';
            }

            console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Semantic analysis (${meaningAnalysis.similarity.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Meaning analysis for ${card1.name} ↔ ${card2.name} skipped due to error:`, error.message);
        }
      }

      // NEW: Image similarity analysis using AI (limited to avoid rate limits)
      if (includeImageAnalysis &&
          imagePairsAnalyzed < maxImagePairs &&
          card1.image_url &&
          card2.image_url) {

        try {
          imagePairsAnalyzed++;
          const imageAnalysis = await analyzeImageSimilarity(card1, card2);

          if (imageAnalysis.similarity > 0.3) {
            detection.reasons.push(...imageAnalysis.reasons);
            detection.strength += imageAnalysis.similarity * 0.35; // Weight visual similarity
            detection.visualElements = imageAnalysis.visualElements || [];

            if (!detection.type) detection.type = 'thematic';
            console.log(`  ✓ ${card1.name} ↔ ${card2.name}: Visual similarity (${imageAnalysis.similarity.toFixed(2)})`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Image analysis for ${card1.name} ↔ ${card2.name} skipped due to error:`, error.message);
        }
      }

      // Only include if there's some connection - LOWERED THRESHOLD
      if (detection.strength > 0.05) {
        detection.strength = Math.min(1, detection.strength);
        relationships.push(detection);
        console.log(`  💫 Relationship added: ${card1.name} ↔ ${card2.name} (strength: ${detection.strength.toFixed(2)})`);
      }
    }
  }

  const sorted = relationships.sort((a, b) => b.strength - a.strength);
  console.log(`✅ Found ${sorted.length} relationships (${imagePairsAnalyzed} image pairs analyzed)`);

  // Log top 5 relationships for debugging
  sorted.slice(0, 5).forEach((rel, i) => {
    console.log(`  ${i+1}. ${rel.card1.name} ↔ ${rel.card2.name} (${rel.type}, strength: ${rel.strength.toFixed(2)})`);
    console.log(`     Reasons: ${rel.reasons.join(', ')}`);
  });

  return sorted;
}

// Graph visualization component
function GraphView({ cards, relationships, selectedCards, onCardClick, onRelationshipClick }) {
  const containerRef = React.useRef(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [positions, setPositions] = React.useState([]);
  const [isSimulating, setIsSimulating] = React.useState(true);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(() => updateDimensions());
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Initial circle layout
  React.useEffect(() => {
    if (dimensions.width === 0 || cards.length === 0) return;
    
    setPositions((prev) => {
      if (prev.length === cards.length) return prev;
      
      const angleStep = (2 * Math.PI) / cards.length;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      return cards.map((card, i) => {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        return {
          id: card.id,
          card,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          vx: 0,
          vy: 0
        };
      });
    });
  }, [cards, dimensions]);

  // Simple force-directed layout simulation
  React.useEffect(() => {
    if (!isSimulating) return;
    
    let animationFrame;
    const K = 0.05; // Spring constant
    const REPULSION = 20000; // Repulsion constant
    const DAMPING = 0.85; // Damping
    
    const simulate = () => {
      setPositions(prev => {
        const next = prev.map(p => ({ ...p }));
        
        for (let i = 0; i < next.length; i++) {
          const node1 = next[i];
          let fx = 0, fy = 0;
          
          // Repulsion
          for (let j = 0; j < next.length; j++) {
            if (i === j) continue;
            const node2 = next[j];
            const dx = node1.x - node2.x;
            const dy = node1.y - node2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = REPULSION / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
          
          // Attraction (Springs along relationships)
          relationships.forEach(rel => {
            if (rel.card1.id === node1.id || rel.card2.id === node1.id) {
              const otherId = rel.card1.id === node1.id ? rel.card2.id : rel.card1.id;
              const node2 = next.find(n => n.id === otherId);
              if (node2) {
                const dx = node2.x - node1.x;
                const dy = node2.y - node1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const targetDist = 150; // Ideal distance
                const force = K * (dist - targetDist) * rel.strength;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
              }
            }
          });
          
          // Center gravity
          const dx = dimensions.width / 2 - node1.x;
          const dy = dimensions.height / 2 - node1.y;
          fx += dx * 0.02;
          fy += dy * 0.02;
          
          node1.vx = (node1.vx + fx) * DAMPING;
          node1.vy = (node1.vy + fy) * DAMPING;
          
          node1.x += node1.vx;
          node1.y += node1.vy;
          
          // Boundaries
          node1.x = Math.max(40, Math.min(dimensions.width - 40, node1.x));
          node1.y = Math.max(60, Math.min(dimensions.height - 60, node1.y));
        }
        
        // Stop if settled
        const totalVelocity = next.reduce((sum, n) => sum + Math.abs(n.vx) + Math.abs(n.vy), 0);
        if (totalVelocity < 0.5) {
          setIsSimulating(false);
        }
        
        return next;
      });
      
      if (isSimulating) {
        animationFrame = requestAnimationFrame(simulate);
      }
    };
    
    animationFrame = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isSimulating, relationships, dimensions]);

  const handlePan = (id, event, info) => {
    setPositions(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, x: p.x + info.delta.x, y: p.y + info.delta.y };
      }
      return p;
    }));
  };

  const isCardSelected = (cardId) => selectedCards.some(c => c.id === cardId);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] bg-slate-900/50 rounded-xl border border-purple-500/20 overflow-hidden">
      <Button 
        onClick={() => setIsSimulating(!isSimulating)} 
        size="sm" 
        variant="outline" 
        className="absolute top-4 left-4 z-30 border-purple-500/30 bg-slate-900/80 text-purple-300"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isSimulating ? "Stop Layout" : "Auto Layout"}
      </Button>

      <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
        {/* Draw relationship lines */}
        {relationships.map((rel, idx) => {
          const pos1 = positions.find(p => p.id === rel.card1.id);
          const pos2 = positions.find(p => p.id === rel.card2.id);

          if (!pos1 || !pos2) return null;

          const isHighlighted = isCardSelected(rel.card1.id) || isCardSelected(rel.card2.id);
          const opacity = isHighlighted ? 0.8 : 0.2;

          const color = rel.type === 'elemental' ? '#a855f7' :
                       rel.type === 'sequence' ? '#3b82f6' :
                       rel.type === 'contrast' ? '#f59e0b' :
                       '#ec4899';

          return (
            <g key={idx} className="pointer-events-auto">
              <line
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke={color}
                strokeWidth={Math.max(1, rel.strength * 4)}
                strokeOpacity={opacity}
                className="transition-all duration-100 cursor-pointer hover:stroke-opacity-100"
                onClick={() => onRelationshipClick(rel)}
              />
              {isHighlighted && (
                <circle
                  cx={(pos1.x + pos2.x) / 2}
                  cy={(pos1.y + pos2.y) / 2}
                  r="4"
                  fill={color}
                  className="cursor-pointer"
                  onClick={() => onRelationshipClick(rel)}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Draw cards */}
      {positions.map(({ card, x, y, id }) => {
        const selected = isCardSelected(card.id);

        return (
          <motion.div
            key={id}
            onPan={(e, info) => handlePan(id, e, info)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group ${
              selected ? 'z-20' : 'z-10'
            }`}
            style={{ left: x, top: y }}
            onClick={() => onCardClick(card)}
            whileHover={{ scale: 1.1 }}
            animate={selected ? { scale: 1.15, zIndex: 20 } : { scale: 1, zIndex: 10 }}
          >
            <div className={`relative w-16 h-24 rounded-lg overflow-hidden border-2 transition-all ${
              selected ? 'border-purple-400 shadow-lg shadow-purple-500/50' : 'border-white/20 group-hover:border-purple-400/50'
            }`}>
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center pointer-events-none">
                  <span className="text-white text-[8px] text-center px-1">{card.name}</span>
                </div>
              )}
              {selected && (
                <div className="absolute inset-0 bg-purple-500/20 backdrop-blur-[1px] pointer-events-none" />
              )}
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none w-20 flex justify-center">
              <Badge className="bg-purple-900/95 border-purple-500/50 text-white text-[9px] px-1.5 py-0.5 whitespace-normal text-center leading-[1.15] shadow-lg shadow-black/60 inline-block w-full">
                {card.number ? `#${card.number} ${card.name}` : card.name}
              </Badge>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Matrix view component
function MatrixView({ cards, relationships, onRelationshipClick }) {
  return (
    <ScrollArea className="h-[600px]">
      <div className="p-4">
        <div className="inline-block">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-white/10 bg-slate-900/50 sticky left-0 z-10"></th>
                {cards.map(card => (
                  <th key={card.id} className="p-2 border border-white/10 bg-slate-900/50 text-white text-xs w-12">
                    <div className="transform -rotate-45 whitespace-nowrap">
                      {card.number || card.name.slice(0, 3)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card1, i) => (
                <tr key={card1.id}>
                  <td className="p-2 border border-white/10 bg-slate-900/50 text-white text-xs font-semibold sticky left-0 z-10 whitespace-nowrap">
                    {card1.number ? `#${card1.number}` : card1.name.slice(0, 10)}
                  </td>
                  {cards.map((card2, j) => {
                    if (i >= j) {
                      return (
                        <td key={card2.id} className="p-2 border border-white/10 bg-slate-800/30"></td>
                      );
                    }

                    const rel = relationships.find(r =>
                      (r.card1.id === card1.id && r.card2.id === card2.id) ||
                      (r.card1.id === card2.id && r.card2.id === card1.id)
                    );

                    const strength = rel ? rel.strength : 0;
                    const color = rel ? (
                      rel.type === 'elemental' ? 'bg-purple-500' :
                      rel.type === 'sequence' ? 'bg-blue-500' :
                      rel.type === 'contrast' ? 'bg-amber-500' :
                      'bg-pink-500'
                    ) : 'bg-slate-700';

                    return (
                      <td
                        key={card2.id}
                        className={`p-2 border border-white/10 cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                        style={{ opacity: rel ? strength * 0.7 + 0.3 : 0.1 }}
                        onClick={() => rel && onRelationshipClick(rel)}
                        title={rel ? rel.reasons.join(', ') : 'No connection'}
                      ></td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}

// AI Suggestion Modal
function AISuggestionModal({ card1, card2, deckId, onClose, onApply }) {
  const [loading, setLoading] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await base44.functions.invoke('suggestCardRelationships', {
          card_id_1: card1.id,
          card_id_2: card2.id
        });

        // Assuming response.data is an array of suggestions or has a 'suggestions' property
        const fetchedSuggestions = response.data?.suggestions || response.data || [];
        setSuggestions(fetchedSuggestions);
      } catch (err) {
        console.error('Failed to load AI suggestions:', err);
        setError(err.message || 'Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [card1, card2]);

  const handleApplySuggestion = async (suggestion) => {
    try {
      const relationshipKey = [card1.id, card2.id].sort().join('|');

      const data = {
        deck_id: deckId,
        card_id_1: card1.id,
        card_id_2: card2.id,
        relationship_key: relationshipKey,
        relationship_type: suggestion.relationship_type,
        strength: suggestion.strength || 0.7, // Provide a default strength if not given
        custom_notes: suggestion.explanation,
        shared_themes: suggestion.shared_themes || [],
        element_relationship: suggestion.element_relationship || 'none',
        auto_detected: false // Mark as manually applied from AI suggestion
      };

      await base44.entities.CardRelationship.create(data);
      onApply(); // Callback to refresh relationships and close modal
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
      alert('Failed to save relationship');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-purple-500/30 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI Relationship Suggestions
          </h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <ScrollArea className="flex-1 p-6">
          {/* Card previews */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="w-24 h-36 rounded-lg overflow-hidden border border-white/20 mb-2">
                {card1.image_url ? (
                  <img src={card1.image_url} alt={card1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-white text-xs p-2">
                    {card1.name}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold text-sm">{card1.name}</p>
            </div>

            <LinkIcon className="w-8 h-8 text-purple-400" />

            <div className="text-center">
              <div className="w-24 h-36 rounded-lg overflow-hidden border border-white/20 mb-2">
                {card2.image_url ? (
                  <img src={card2.image_url} alt={card2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-white text-xs p-2">
                    {card2.name}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold text-sm">{card2.name}</p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
              <p className="text-white/60">Analyzing card relationships with AI...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200">No strong relationships detected between these cards by the AI.</p>
            </div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <div className="space-y-4">
              <p className="text-white/80 text-sm mb-4">
                The AI has analyzed these cards and suggests the following relationships:
              </p>

              {suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className="capitalize bg-purple-600">
                        {suggestion.relationship_type}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(suggestion.strength || 0.5) * 100}%` }}
                          />
                        </div>
                        <span className="text-white/60 text-xs">
                          {Math.round((suggestion.strength || 0.5) * 100)}%
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>

                  <p className="text-white/80 text-sm mb-2">{suggestion.explanation}</p>

                  {suggestion.shared_themes && suggestion.shared_themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.shared_themes.map((theme, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-purple-400/30 text-purple-300">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {suggestion.element_relationship && suggestion.element_relationship !== 'none' && (
                    <p className="text-xs text-white/50 mt-2">
                      Elements: {suggestion.element_relationship}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="bg-slate-900 border-t border-white/10 p-4 flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-white/20 text-white">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Relationship editor modal
function RelationshipEditor({ card1, card2, existingRelationship, deckId, onSave, onClose }) {
  const [notes, setNotes] = React.useState(existingRelationship?.custom_notes || '');
  const [type, setType] = React.useState(existingRelationship?.relationship_type || 'custom');
  const [isFavorite, setIsFavorite] = React.useState(existingRelationship?.is_favorite || false);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const relationshipKey = [card1.id, card2.id].sort().join('|');

      const data = {
        deck_id: deckId,
        card_id_1: card1.id,
        card_id_2: card2.id,
        relationship_key: relationshipKey,
        relationship_type: type,
        custom_notes: notes,
        is_favorite: isFavorite,
        auto_detected: false
      };

      if (existingRelationship?.id) {
        await base44.entities.CardRelationship.update(existingRelationship.id, data);
      } else {
        await base44.entities.CardRelationship.create(data);
      }

      onSave();
    } catch (err) {
      console.error('Failed to save relationship:', err);
      alert('Failed to save relationship');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-purple-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Edit Card Relationship</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <Trash2 className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Card previews */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-32 h-48 rounded-lg overflow-hidden border border-white/20 mb-2">
                {card1.image_url ? (
                  <img src={card1.image_url} alt={card1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-white text-xs p-2">
                    {card1.name}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold">{card1.name}</p>
            </div>

            <LinkIcon className="w-8 h-8 text-purple-400" />

            <div className="text-center">
              <div className="w-32 h-48 rounded-lg overflow-hidden border border-white/20 mb-2">
                {card2.image_url ? (
                  <img src={card2.image_url} alt={card2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-white text-xs p-2">
                    {card2.name}
                  </div>
                )}
              </div>
              <p className="text-white font-semibold">{card2.name}</p>
            </div>
          </div>

          {/* Relationship type */}
          <div>
            <Label className="text-white mb-2 block">Relationship Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-black/30 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 text-white">
                <SelectItem value="complement">Complement - Cards that enhance each other</SelectItem>
                <SelectItem value="contrast">Contrast - Cards that show opposite energies</SelectItem>
                <SelectItem value="sequence">Sequence - Cards in a progression</SelectItem>
                <SelectItem value="elemental">Elemental - Connected by element</SelectItem>
                <SelectItem value="thematic">Thematic - Share common themes</SelectItem>
                <SelectItem value="custom">Custom - Your own interpretation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom notes */}
          <div>
            <Label className="text-white mb-2 block">Your Notes on This Relationship</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe how these cards relate to each other in your readings..."
              className="bg-black/30 border-white/20 text-white min-h-[120px]"
            />
          </div>

          {/* Favorite toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="favorite" className="text-white cursor-pointer flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Mark as important relationship
            </Label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-6 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/20 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Relationship'
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CardRelationshipVisualizer({ deckId, cards: providedCards, selectedCards: initialSelected = [] }) {
  const [cards, setCards] = React.useState(providedCards || []);
  const [selectedCards, setSelectedCards] = React.useState(initialSelected);
  const [relationships, setRelationships] = React.useState([]);
  const [savedRelationships, setSavedRelationships] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [detectionProgress, setDetectionProgress] = React.useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = React.useState('graph');
  const [selectedRelationship, setSelectedRelationship] = React.useState(null);
  const [editingRelationship, setEditingRelationship] = React.useState(null);
  const [showAutoDetected, setShowAutoDetected] = React.useState(true);
  const [showAISuggestion, setShowAISuggestion] = React.useState(false);

  // NEW: Advanced detection options
  const [includeImageAnalysis, setIncludeImageAnalysis] = React.useState(false);
  const [includeMeaningAnalysis, setIncludeMeaningAnalysis] = React.useState(false);

  // Load cards if not provided
  React.useEffect(() => {
    if (!providedCards && deckId) {
      setLoading(true);
      console.log('📚 Loading cards for deck:', deckId);
      base44.entities.Card.filter({ deck_id: deckId })
        .then(loadedCards => {
          console.log(`✅ Loaded ${loadedCards.length} cards`);
          setCards(loadedCards);
        })
        .catch(err => {
          console.error('❌ Failed to load cards:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [deckId, providedCards]);

  // Load saved relationships
  React.useEffect(() => {
    if (!deckId) return;

    console.log('📖 Loading saved relationships for deck:', deckId);
    base44.entities.CardRelationship.filter({ deck_id: deckId })
      .then(saved => {
        console.log(`✅ Loaded ${saved.length} saved relationships`);
        setSavedRelationships(saved);
      })
      .catch(err => {
        console.error('❌ Failed to load saved relationships:', err);
        setSavedRelationships([]);
      });
  }, [deckId]);

  // Detect relationships when cards change or options change
  React.useEffect(() => {
    if (cards.length < 2) {
      console.log('⚠️ Not enough cards for detection (need at least 2)');
      setRelationships([]);
      return;
    }

    const runDetection = async () => {
      setDetecting(true);
      console.log(`🔍 Starting auto-detection for ${cards.length} cards...`);
      console.log(`🎨 Image analysis: ${includeImageAnalysis ? 'ON' : 'OFF'}`);
      console.log(`📖 Meaning analysis: ${includeMeaningAnalysis ? 'ON' : 'OFF'}`);

      try {
        const detected = await detectRelationships(cards, {
          includeImageAnalysis,
          includeMeaningAnalysis,
          maxImagePairs: 15, // Limit to 15 image pairs to avoid rate limits
          onProgress: setDetectionProgress
        });
        setRelationships(detected);
      } catch (error) {
        console.error('❌ Detection failed:', error);
        setRelationships([]);
      } finally {
        setDetecting(false);
        setDetectionProgress({ current: 0, total: 0 });
      }
    };

    runDetection();
  }, [cards, includeImageAnalysis, includeMeaningAnalysis]);

  // Combine auto-detected and saved relationships
  const displayedRelationships = React.useMemo(() => {
    const combined = [];

    console.log('🔄 Combining relationships:', {
      saved: savedRelationships.length,
      autoDetected: relationships.length,
      showAutoDetected
    });

    // Add saved relationships
    savedRelationships.forEach(saved => {
      const card1 = cards.find(c => c.id === saved.card_id_1);
      const card2 = cards.find(c => c.id === saved.card_id_2);

      if (card1 && card2) {
        combined.push({
          card1,
          card2,
          type: saved.relationship_type,
          strength: saved.strength || 0.8,
          reasons: saved.detection_reasons || [saved.custom_notes].filter(Boolean),
          saved: true,
          savedData: saved
        });
      }
    });

    // Add auto-detected if enabled and not already saved
    if (showAutoDetected) {
      relationships.forEach(rel => {
        const alreadySaved = savedRelationships.some(s =>
          (s.card_id_1 === rel.card1.id && s.card_id_2 === rel.card2.id) ||
          (s.card_id_1 === rel.card2.id && s.card_id_2 === rel.card1.id)
        );

        if (!alreadySaved) {
          combined.push(rel);
        }
      });
    }

    console.log(`✅ Combined ${combined.length} total relationships`);
    return combined;
  }, [relationships, savedRelationships, cards, showAutoDetected]);

  const handleCardClick = (card) => {
    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      } else {
        // Only allow selecting up to 2 cards
        if (prev.length < 2) {
          return [...prev, card];
        } else {
          // If 2 cards are already selected, deselect the first one and select the new one
          return [prev[1], card];
        }
      }
    });
  };

  const handleRelationshipClick = (relationship) => {
    setSelectedRelationship(relationship);
  };

  const handleAISuggest = () => {
    if (selectedCards.length !== 2) {
      alert('Please select exactly 2 cards to get AI suggestions.');
      return;
    }

    setShowAISuggestion(true);
  };

  const handleAddRelationship = () => {
    if (selectedCards.length !== 2) {
      alert('Please select exactly 2 cards to create a relationship.');
      return;
    }

    setEditingRelationship({
      card1: selectedCards[0],
      card2: selectedCards[1]
    });
  };

  const handleSaveRelationship = () => {
    // Reload saved relationships
    base44.entities.CardRelationship.filter({ deck_id: deckId })
      .then(setSavedRelationships)
      .catch(err => console.error('Failed to reload relationships:', err));

    setEditingRelationship(null);
    setShowAISuggestion(false); // Close AI suggestion modal if open
    setSelectedCards([]); // Clear selected cards after saving
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (cards.length < 2) {
    return (
      <div className="text-center p-12 bg-amber-900/20 border border-amber-500/30 rounded-xl">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Not Enough Cards</h3>
        <p className="text-amber-200">You need at least 2 cards to visualize relationships.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-purple-400" />
            Card Relationships
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Discover and document connections between cards
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => {
              console.log('🔄 Toggling auto-detect:', !showAutoDetected);
              setShowAutoDetected(!showAutoDetected);
            }}
            variant={showAutoDetected ? "default" : "outline"}
            size="sm"
            className={showAutoDetected ? "bg-purple-600" : "border-white/20 text-white"}
            disabled={detecting}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Detect {showAutoDetected && !detecting && `(${relationships.length})`}
            {detecting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </Button>

          <Button
            onClick={handleAISuggest}
            disabled={selectedCards.length !== 2 || detecting}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            AI Suggest
          </Button>

          <Button
            onClick={handleAddRelationship}
            disabled={selectedCards.length !== 2}
            size="sm"
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Relationship
          </Button>
        </div>
      </div>

      {/* NEW: Advanced Detection Options */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Advanced Detection Options</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/10">
            <div>
              <div className="text-sm font-medium text-white">🖼️ Image Analysis</div>
              <div className="text-xs text-white/60">Detect visual similarities in card artwork</div>
            </div>
            <input
              type="checkbox"
              checked={includeImageAnalysis}
              onChange={(e) => setIncludeImageAnalysis(e.target.checked)}
              disabled={detecting}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-white/10">
            <div>
              <div className="text-sm font-medium text-white">📖 Deep Meaning Analysis</div>
              <div className="text-xs text-white/60">AI analyzes upright/reversed meanings</div>
            </div>
            <input
              type="checkbox"
              checked={includeMeaningAnalysis}
              onChange={(e) => setIncludeMeaningAnalysis(e.target.checked)}
              disabled={detecting}
              className="w-4 h-4"
            />
          </div>
        </div>

        {(includeImageAnalysis || includeMeaningAnalysis) && (
          <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Note:</strong> Advanced detection uses AI and may take 30-60 seconds for large decks.
              {includeImageAnalysis && " Image analysis is limited to 15 card pairs to avoid rate limits."}
            </p>
          </div>
        )}

        {detecting && detectionProgress.total > 0 && (
          <div className="mt-3 bg-black/30 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-white mb-2">
              <span>Analyzing relationships...</span>
              <span>{detectionProgress.current} / {detectionProgress.total}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(detectionProgress.current / detectionProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Debug info when no relationships found */}
      {showAutoDetected && relationships.length === 0 && !detecting && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-2">No automatic relationships detected</p>
              <p className="mb-2">For basic auto-detection to work, your cards need:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-200/80">
                <li>Keywords (at least some cards sharing keywords)</li>
                <li>Elements (fire, water, air, earth, spirit)</li>
                <li>Sequential card numbers (1, 2, 3...)</li>
                <li>Similar meanings or themes in descriptions</li>
              </ul>
              <p className="mt-2">💡 <strong>Try enabling:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-yellow-200/80 ml-4">
                <li><strong>Image Analysis</strong> - Detects visual similarities, shared colors, symbols</li>
                <li><strong>Deep Meaning Analysis</strong> - AI analyzes upright/reversed meanings semantically</li>
              </ul>
              <p className="mt-2">You can still add custom relationships manually by selecting 2 cards and clicking "Add Relationship".</p>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">How to use:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-200/80">
            <li>Click cards to select them (up to 2)</li>
            <li>Click relationship lines to view details</li>
            <li>Add custom notes to document your insights</li>
            <li>Auto-detect finds connections based on keywords, elements, and themes</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-white/60 text-sm">Total Cards</div>
          <div className="text-2xl font-bold text-white">{cards.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-white/60 text-sm">Relationships</div>
          <div className="text-2xl font-bold text-white">{displayedRelationships.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-white/60 text-sm">Your Notes</div>
          <div className="text-2xl font-bold text-white">{savedRelationships.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-white/60 text-sm">Selected</div>
          <div className="text-2xl font-bold text-white">{selectedCards.length}</div>
        </div>
      </div>

      {/* View tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="bg-slate-900/50 border border-white/10">
          <TabsTrigger value="graph" className="data-[state=active]:bg-purple-600">
            <Network className="w-4 h-4 mr-2" />
            Graph View
          </TabsTrigger>
          <TabsTrigger value="matrix" className="data-[state=active]:bg-purple-600">
            <Grid3x3 className="w-4 h-4 mr-2" />
            Matrix View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="mt-4">
          <GraphView
            cards={cards}
            relationships={displayedRelationships}
            selectedCards={selectedCards}
            onCardClick={handleCardClick}
            onRelationshipClick={handleRelationshipClick}
          />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <MatrixView
            cards={cards}
            relationships={displayedRelationships}
            onRelationshipClick={handleRelationshipClick}
          />
        </TabsContent>
      </Tabs>

      {/* Selected relationship details */}
      <AnimatePresence>
        {selectedRelationship && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white/5 border border-purple-500/30 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-400" />
                Relationship Details
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingRelationship({
                    card1: selectedRelationship.card1,
                    card2: selectedRelationship.card2,
                    existing: selectedRelationship.savedData
                  })}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <button
                  onClick={() => setSelectedRelationship(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2">{selectedRelationship.card1.name}</h4>
                {selectedRelationship.card1.keywords && selectedRelationship.card1.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedRelationship.card1.keywords.slice(0, 5).map((kw, i) => (
                      <Badge key={i} className="bg-purple-600/20 text-purple-200 text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">{selectedRelationship.card2.name}</h4>
                {selectedRelationship.card2.keywords && selectedRelationship.card2.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedRelationship.card2.keywords.slice(0, 5).map((kw, i) => (
                      <Badge key={i} className="bg-purple-600/20 text-purple-200 text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-white/60 text-sm">Type: </span>
                <Badge className="ml-2 capitalize">{selectedRelationship.type}</Badge>
                <span className="text-white/60 text-sm ml-3">Strength: </span>
                <span className="text-white font-semibold">
                  {Math.round(selectedRelationship.strength * 100)}%
                </span>
              </div>

              {selectedRelationship.reasons && selectedRelationship.reasons.length > 0 && (
                <div>
                  <div className="text-white/60 text-sm mb-2">Connections:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedRelationship.reasons.map((reason, i) => (
                      <li key={i} className="text-white/80 text-sm">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRelationship.savedData?.custom_notes && (
                <div>
                  <div className="text-white/60 text-sm mb-2">Your Notes:</div>
                  <p className="text-white/90 text-sm italic bg-black/20 p-3 rounded-lg">
                    {selectedRelationship.savedData.custom_notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship editor modal */}
      <AnimatePresence>
        {editingRelationship && (
          <RelationshipEditor
            card1={editingRelationship.card1}
            card2={editingRelationship.card2}
            existingRelationship={editingRelationship.existing}
            deckId={deckId}
            onSave={handleSaveRelationship}
            onClose={() => setEditingRelationship(null)}
          />
        )}
      </AnimatePresence>

      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {showAISuggestion && selectedCards.length === 2 && (
          <AISuggestionModal
            card1={selectedCards[0]}
            card2={selectedCards[1]}
            deckId={deckId}
            onClose={() => setShowAISuggestion(false)}
            onApply={handleSaveRelationship}
          />
        )}
      </AnimatePresence>
    </div>
  );
}