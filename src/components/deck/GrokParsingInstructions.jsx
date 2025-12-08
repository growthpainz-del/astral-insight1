export const GROK_PARSING_INSTRUCTIONS = `
You are parsing divination card data from a structured text format into JSON objects.

**INPUT FORMAT:**
Cards are listed with the card name on its own line, followed by bullet points for each field.

Example:
SELENA
  - number: 28
  - element: Water
  - keywords: Reflection, light, guidance
  - upright_meaning: Follow your inner light, trusting the moon's gentle guidance.
  - reversed_meaning: Confusion, disconnection from ignoring intuition.
  - history: Greek moon goddess, driving a silver chariot, illuminating the night.

ARTEMIS
  - number: 3
  - element: Air
  - keywords: Instinct, independence, focus
  - upright_meaning: Trust instincts in pursuit of goals.
  - reversed_meaning: Isolation, scattered energy from avoiding commitment.
  - history: Greek goddess of the hunt, fierce and independent.

**PARSING RULES:**
1. Card name appears on its own line (no bullet)
2. Each field is on a new line starting with a bullet (-, *, or similar)
3. Format: field_name: value
4. Empty lines between cards are optional
5. Keywords should be split by commas into an array
6. Number should be converted to an integer

**VALID FIELDS:**
Core fields (map directly to Card entity):
- number (integer)
- element (string: air, fire, water, earth, spirit, or none)
- keywords (array of strings)
- upright_meaning (string)
- reversed_meaning (string)
- overall_meaning (string)
- upright_insight (string)
- upright_action (string)
- reversed_insight (string)
- reversed_action (string)
- history (string)
- ancient_wisdom (string)
- interaction (string)
- musician_quote (string)
- facedown_meaning (string)

**OUTPUT FORMAT:**
Return a JSON array of card objects:
[
  {
    "name": "SELENA",
    "number": 28,
    "element": "water",
    "keywords": ["Reflection", "light", "guidance"],
    "upright_meaning": "Follow your inner light, trusting the moon's gentle guidance.",
    "reversed_meaning": "Confusion, disconnection from ignoring intuition.",
    "history": "Greek moon goddess, driving a silver chariot, illuminating the night."
  },
  {
    "name": "ARTEMIS",
    "number": 3,
    "element": "air",
    "keywords": ["Instinct", "independence", "focus"],
    "upright_meaning": "Trust instincts in pursuit of goals.",
    "reversed_meaning": "Isolation, scattered energy from avoiding commitment.",
    "history": "Greek goddess of the hunt, fierce and independent."
  }
]

**IMPORTANT:**
- Element values should be lowercase
- Ignore any unknown fields
- If a field is missing, omit it from the output (don't include null values)
- Preserve the exact text of descriptions
- Card names should remain in their original case

Parse the following card data and return ONLY the JSON array:
`;

export default GROK_PARSING_INSTRUCTIONS;