# Design System Strategy: Liquid Glass & Editorial Depth

## 1. Overview & Creative North Star: "The Ethereal Workspace"
The Creative North Star for this system is **The Ethereal Workspace**. We are moving away from the rigid, boxed-in layouts of traditional productivity tools and toward a high-end editorial experience that feels fluid, immersive, and premium. 

This system breaks the "template" look by treating the screen as a deep, three-dimensional space rather than a flat canvas. By utilizing heavy backdrop blurs, intentional asymmetry, and a "Liquid Glass" philosophy, we create an interface that feels like a physical object made of light and frosted crystal. The goal is to make the user feel like a curator of their own time, not a data entry clerk.

## 2. Colors & Surface Philosophy
The palette is rooted in the tension between the deep `#131313` (Night) and the high-energy `#Dd0426` (Primary Red), softened by a sophisticated spectrum of translucent layers.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through:
- **Background Color Shifts:** Use `surface-container-low` against a `surface` background.
- **Tonal Transitions:** Use subtle color bleeding to imply edges.
- **Negative Space:** Use the Spacing Scale (specifically `8` and `10`) to create breathing room that acts as a natural separator.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of fine, frosted glass.
- **Base Layer:** `surface` (#131313).
- **Secondary Sections:** `surface-container-low`.
- **Interactive Elements:** `surface-container-high` or `surface-container-highest`.
Nesting should feel organic. An inner container should always use a slightly higher tier than its parent to create a "lifted" sensation without needing a drop shadow.

### The "Glass & Gradient" Rule
To achieve the "Liquid Glass" look:
- **Floating Elements:** Must use `surface-variant` at 40-60% opacity with a `backdrop-filter: blur(24px)`.
- **Signature Textures:** Incorporate a subtle radial gradient in the background—transitioning from `surface` to a very dim `primary_container` (#dd0426 at 5% opacity) in the top right corner. This provides "visual soul" and prevents the dark mode from feeling "dead."

## 3. Typography: Editorial Authority
We use **Epilogue** across the entire scale. The hierarchy is designed to feel like a high-end magazine, using dramatic size contrasts to guide the eye.

- **Display (lg/md):** Reserved for high-level "Welcome" states or project titles. These should have a tight letter-spacing (-0.02em) to feel authoritative.
- **Headline (sm/md):** Used for section headers. Always pair these with significant white space above (`spacing-12`) to create an "Airy" feel.
- **Body (lg/md):** High readability. Use `on-surface-variant` (#e7bcb9) for secondary body text to reduce visual noise.
- **Label (md/sm):** Used exclusively for functional metadata.

The typographic hierarchy communicates the brand’s identity: Bold, precise, and unencumbered.

## 4. Elevation & Depth: Tonal Layering
We reject traditional Material Design drop shadows in favor of **Tonal Layering** and **Ambient Light**.

- **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card inside a `surface-container-low` section to create a "recessed" look.
- **Ambient Shadows:** For floating glass elements, use a shadow color tinted with the `primary` (#ffb3ae) at 4% opacity with a 40px blur. This mimics how light interacts with colored glass.
- **The "Ghost Border" Fallback:** If a container requires an edge for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque borders.
- **Glassmorphism:** The floating bottom navigation bar must be the hero of this principle. It uses `surface-container-highest` at 50% opacity with a heavy blur, making the content underneath feel like a "liquid" flowing behind the glass.

## 5. Components

### Floating Bottom Navigation
The signature component of the system.
- **Body:** A wide, pill-shaped container (`roundedness-xl`) using Glassmorphism.
- **Central Action:** The central '+' button for project creation uses `primary_container` (#dd0426) with a subtle outer glow of the same color. It should sit slightly higher in the Z-index than the rest of the bar.
- **Icons:** Use `on-surface` for inactive states and `primary` for active states. No text labels; use `label-sm` tooltips only on long-press.

### Buttons
- **Primary:** Gradient-filled from `primary` to `primary_container`. No borders. `roundedness-md`.
- **Secondary:** Transparent background with a "Ghost Border" (`outline-variant` at 20%).
- **Tertiary:** Pure text using `primary` color, reserved for low-emphasis actions.

### Cards & Lists
- **Rule:** Forbid divider lines. 
- **Execution:** Use vertical white space (`spacing-4`) or a subtle shift to `surface-container-low` on hover. Cards should have a `roundedness-lg` to maintain the soft, liquid aesthetic.

### Input Fields
- **Styling:** "Bottom-line" only or fully filled `surface-container-lowest`. 
- **States:** On focus, the bottom border or container glow should transition to `primary` (#ffb3ae). 

## 6. Do’s and Don’ts

### Do:
- **Embrace Asymmetry:** Align headings to the left while keeping functional chips or filters to the right to create an editorial flow.
- **Use "Air":** If you think there is enough padding, add `spacing-2` more. The "Liquid Glass" look requires room to breathe.
- **Layer Textures:** Let background gradients bleed through your glass components.

### Don't:
- **Don't use 1px Solid Lines:** They break the "Liquid" illusion and make the UI look "templated."
- **Don't use Pure White:** Use `on-surface` (#e5e2e1) for text to prevent harsh contrast vibrating against the deep night background.
- **Don't Over-Saturate:** Red is a high-energy color. Use it for "moments" (CTAs, Active States, Plus Button), not for large background surfaces.

### Accessibility Note:
While we use glass and blurs, ensure that the `on-surface` text against `surface-container` tiers maintains a minimum contrast ratio of 4.5:1. Use the `outline` token at higher opacities if a user enables "High Contrast" mode.