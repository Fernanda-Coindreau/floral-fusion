# 🌸 BLUEPRINT PREVIEW: FLORAL FUSION - Main Game Canvas
## Product Owner Review Required - DO NOT PROCEED TO CODE YET

---

## 1. VISUAL WIREFRAME 🎨

```
┌─────────────────────────────────────────────────────────────┐
│                    ✨ ANIMAL FOREST ✨                      │
│                                                               │
│                  💖 Score: 0        🌟 Level: 1              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│              🌲🌳 ENCHANTED FOREST 🌳🌲                      │
│                                                               │
│                                                               │
│                         🐰 ← Next Animal                     │
│                          ↓                                    │
│                                                               │
│                                                               │
│   🌲                                                    🌳   │
│                                                               │
│   🌿         🐱      🐰  🐰      🐱  🐶            🍄       │
│                                                               │
│   🌸         🐰      🐶      🐱      🐰            🌺       │
│                                                               │
│  🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸        │
│                    Forest Floor                               │
│                                                               │
│  💡 Click where you want the animal to land!                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘

VISUAL DETAILS:
• Background: Enchanted forest scene (trees, foliage, soft sunlight filtering through)
• Forest elements: Trees on sides, mushrooms, flowers, grass at bottom
• NO VISIBLE GRID - Animals float freely in forest space
• Creatures: Emoji-based forest animals positioned naturally
• Next animal preview: Shows at top center, waiting for player click
• Animations: Animals DROP from top to clicked position, gentle bounce on landing, 
              sparkle effect on merge
• Typography: Rounded, friendly font (Comic Sans MS or similar web-safe)
• Color Palette: Forest greens (#A8D5BA, #7FB069), earthy browns (#C9A66B), 
                 soft pinks for accents (#FFB6D9), sky blues (#B4D7E8)
```

---

## 2. LOGIC PSEUDOCODE 🧠

```
=== INITIALIZATION ===
ON PAGE LOAD:
  - Initialize game state:
      * score = 0
      * level = 1
      * animals = [] (array of animal objects with x, y, level)
      * nextAnimal = generate random animal (level 1-3)
      * playArea = define droppable zone (avoid trees/UI)
  - Render forest background (trees, foliage, ground)
  - Show "next animal" preview at top center
  - Wait for player click

=== CORE MERGE MECHANICS ===
CREATURE HIERARCHY (Evolution Chain - 8 Levels):
  Level 1: 🐰 Bunny      (Starting creature)
  Level 2: 🐱 Kitty      (2 Bunnies merge)
  Level 3: 🐶 Puppy      (2 Kitties merge)
  Level 4: 🦊 Fox        (2 Puppies merge)
  Level 5: 🐻 Bear       (2 Foxes merge)
  Level 6: 🦁 Lion       (2 Bears merge)
  Level 7: 🐯 Tiger      (2 Lions merge)
  Level 8: 🦄 Unicorn    (2 Tigers merge - ULTIMATE!)

MERGE RULE:
  - 2 creatures of the SAME level touching = merge into NEXT level
  - Example: Bunny + Bunny = Kitty
  - Example: Fox + Fox = Bear
  - Unicorn is the final form (level 8 - cannot merge further)

PLAYER-CONTROLLED DROP LOGIC:
  ON CLICK (anywhere in play area):
    - Get click X position
    - Take current "nextAnimal" from preview
    - Animate DROP from top to clicked X position
    - Animal falls with gravity until it hits:
        * Bottom of play area (forest floor), OR
        * Another animal below it (stacks on top)
    
    - ON LANDING:
        * Check collision with existing animals
        * IF touching same-level creature:
            - MERGE! ✨
            - Remove both creatures
            - Spawn next-level creature at merge position
            - Add points: (creature_level × 10)
            - Sparkle/pop animation with forest particles
        * IF NO merge:
            - Stay in position, gentle bounce
            - Animal settles into forest
    
    - Generate NEW "nextAnimal" for preview (70% level 1, 25% level 2, 5% level 3)
    - Show new animal at top, waiting for next click

PHYSICS & COLLISION:
  - Animals have circular collision bounds (natural, not grid-based)
  - Gravity pulls animals down until they rest on:
      * Forest floor (bottom boundary)
      * Top of another animal (stack naturally)
  - Animals can settle at ANY X position (not locked to columns)
  - Slight rolling/settling animation for natural feel

GAME OVER CHECK:
  - IF play area is full AND no space for new animal to drop:
      * Show "Game Over" modal with final score
      * Display highest creature achieved
      * Offer restart button

LEVEL PROGRESSION:
  - Game Level increases based on score milestones:
      * Level 1: 0-50 points
      * Level 2: 51-150 points
      * Level 3: 151-300 points
      * Level 4: 301-500 points
      * Level 5: 501-800 points
      * Level 6: 801-1200 points
      * Level 7: 1201-1700 points
      * Level 8: 1701+ points (MASTER LEVEL!)
  - Higher game levels = slightly faster drop animations
  - Visual changes per level (forest gets more magical/sparkly)

=== USER INTERACTIONS ===
MOUSE/TOUCH INPUT:
  - Player clicks/taps anywhere in the play area
  - Animal drops from top to that X position
  - Simple, intuitive control (no buttons needed!)
  - Preview shows what animal is coming next

=== RENDERING ===
EACH FRAME:
  - Clear canvas
  - Draw forest background:
      * Trees on left/right sides
      * Foliage/leaves scattered throughout
      * Grass/flowers at bottom (forest floor)
      * Soft dappled sunlight effect
      * Mushrooms and forest details
  - Draw all settled animals at their positions (NO GRID LINES)
      * Each animal at its natural x, y position
      * Slight idle animation (gentle breathing/bobbing)
      * If merging: sparkle effect
  - Draw "next animal" preview at top center
      * Gentle floating animation
      * Subtle glow to draw attention
  - Draw falling animal (if currently dropping)
      * Motion blur/trail effect
      * Rotation for dynamic feel
  - Update score/level display
  - Handle animations (dropping, merging, particles, sparkles)
  - NO GRID OVERLAY - pure forest aesthetic!
```

---

## 3. THE 'WHY' - AESTHETIC ALIGNMENT 💖

### How This Embodies "Cozy Whimsical Girly Pop":

**🌲 ENCHANTED FOREST VIBES:**
- Pure forest aesthetic with NO visible grid - feels organic and natural
- Natural greens and earthy tones with pastel accents
- Trees and foliage frame the play area beautifully
- Creatures feel like they're truly living in this magical woodland
- Animals settle naturally, not locked to rigid positions

**✨ PLAYFUL ENERGY:**
- Player CHOOSES where animals land - strategic and satisfying!
- Click-to-drop mechanic is intuitive and engaging
- Gravity-based physics feels natural and fun
- Bounce/sparkle animations feel alive and joyful
- Evolution chain creates "aww!" moments (bunny → unicorn!)
- Anticipation of "what animal is next?" keeps it exciting

**💕 FEMININE AESTHETIC:**
- Soft forest colors (sage green, sky blue) with pink/lavender accents
- Gentle shadows and glows (not harsh contrasts)
- Friendly, encouraging UI copy ("Click where you want the animal to land!")
- Reward-focused (sparkles, celebrations) vs. punishment-focused
- Flowers and mushrooms add whimsical touches
- Organic, flowing layout (no rigid grid)

**🎮 COZY GAMEPLAY:**
- Player-paced (drop when ready, no time pressure)
- Strategic placement creates satisfying "aha!" moments
- Clear visual feedback (sparkles on merge, gentle bounce on land)
- Progression feels rewarding, not stressful
- Forest setting is calming and inviting
- Simple controls (just click!) - accessible to everyone

**🌈 INDIE CHARM:**
- Starting with emojis = accessible, can upgrade later
- Minimalist UI (no buttons cluttering the forest!)
- Focus on feel-good moments (merges, level-ups)
- Room to grow (add sounds, seasonal forest themes, custom art)
- Unique physics-based merge mechanics
- Pure, uncluttered gameplay experience

---

## TECHNICAL STACK PROPOSAL:
- **HTML5 Canvas** for rendering (smooth animations)
- **Vanilla JavaScript** (no framework bloat, full control)
- **CSS3** for UI elements outside canvas
- **Web Audio API** for sound effects (optional phase 2)

---

## 🛑 AWAITING YOUR APPROVAL 🛑

**Product Owner, please review:**
1. Does this wireframe match your vision?
2. Is the merge mechanic clear and fun?
3. Do you love the aesthetic direction?
4. Any changes before I code?

**Reply with "Proceed" to greenlight development, or share feedback!** 🌟
