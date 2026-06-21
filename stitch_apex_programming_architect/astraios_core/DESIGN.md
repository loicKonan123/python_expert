---
name: Astraios Core
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#f8f6ff'
  on-tertiary: '#2b3040'
  tertiary-container: '#d6daf0'
  on-tertiary-container: '#5a5f71'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#dee1f7'
  tertiary-fixed-dim: '#c2c6db'
  on-tertiary-fixed: '#161b2b'
  on-tertiary-fixed-variant: '#414658'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '450'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style

This design system establishes a "Command Center" aesthetic for elite software engineering. It is a high-fidelity, audacious environment that prioritizes deep focus and technical mastery. The personality is precise, futuristic, and authoritative.

The visual style is a fusion of **Glassmorphism** and **High-Contrast Minimalism**. It utilizes semi-transparent surfaces to imply layered complexity without clutter, while maintaining "sharp-as-a-scalpel" edges for functional clarity. The goal is to make the developer feel like they are operating a sophisticated piece of aerospace instrumentation, where every data point is clear and every action is impactful.

Key stylistic markers include:
- **Translucency:** Subtle backdrop blurs (20px+) on overlays and sidebars.
- **Luminosity:** Strategic use of glowing gradients to highlight state changes or primary actions.
- **Precision:** Fine-line borders (1px) and monospaced accents to emphasize the tool's programmatic nature.

## Colors

The palette is rooted in the "Deep Cosmic" spectrum. The background is not a flat black, but a rich, layered navy (`#0A0F1E`) that provides better depth for glass effects.

- **Primary (Cyan):** Used for critical data, active cursor states, and "success" syntax. It represents the light of a star.
- **Secondary (Violet):** Used for decorative accents, complex logic flows, and brand-building gradients.
- **The Gradient:** A linear 135-degree blend from Violet to Cyan is reserved for high-level calls to action and "Command" level headings.
- **Code Syntax:** High-contrast vibrance. Strings in emerald, functions in primary cyan, and keywords in soft violet.
- **Surface Tints:** Containers use a 40% opaque version of the tertiary color with a subtle white inner glow to simulate glass.

## Typography

Typography is used to distinguish between "Content" and "System." 

**Inter** handles all human-readable content with tight tracking and heavy weights for headlines to maintain the audacious feel. **JetBrains Mono** is utilized for all system metadata, labels, and code blocks, reinforcing the developer-centric nature of the design system.

For large display headings, use a "mask" effect with the Violet-to-Cyan gradient to create a focal point. Ensure body text maintains high legibility by using a slightly increased line-height (1.6) to prevent fatigue during long coding sessions.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the main command panels, ensuring toolbars and sidebars remain in predictable positions—crucial for muscle memory.

- **The Workbench:** A 12-column grid with a fixed left sidebar (280px) and a fluid main editor area.
- **Rhythm:** All spacing is based on an 8px base unit. Component internal padding should be `16px` (2 units), while section vertical spacing should be `80px` (10 units).
- **Responsive Behavior:** On mobile, sidebars collapse into a bottom-anchored "Command Bar." The 12-column desktop grid reflows to a single-column stack with 16px side margins.

## Elevation & Depth

Depth is achieved through **Tonal Stacking** and **Backdrop Blurs** rather than traditional drop shadows.

- **Level 0 (Background):** Deepest navy, matte texture.
- **Level 1 (Panels):** Slightly lighter navy, sharp 1px border (`rgba(255,255,255,0.1)`).
- **Level 2 (Overlays/Modals):** Glassmorphic surfaces with `backdrop-filter: blur(24px)`. These should have a subtle outer glow using the primary cyan at 5% opacity.
- **Interactive State:** When an element is focused, its border transitions from muted grey to a vibrant primary cyan or gradient.

## Shapes

The shape language is "Technical-Soft." We avoid sharp 90-degree corners to keep the UI from feeling hostile, but we keep the radii small (`4px` to `8px`) to maintain a sense of precision.

- **Standard Elements:** 4px radius (Soft).
- **Large Cards/Modals:** 12px radius (Rounded-LG).
- **Input Fields:** 6px radius.
- **Interactive Tags:** Pill-shaped (100px radius) to distinguish them from functional buttons.

## Components

### Buttons
- **Primary:** Gradient background (Violet to Cyan), white text, no border. Subtle outer glow on hover.
- **Ghost:** 1px border (`#FFFFFF20`), transparent background. Becomes solid on hover.
- **Icon-only:** Square with 4px radius, used for editor actions.

### Code Blocks
- **Container:** Darker than the panel background (`#05070A`). 
- **Header:** Features the filename in `label-caps` and a "Copy" button that only appears on hover.
- **Syntax:** High-vibrancy tokens against the dark void.

### Input Fields
- Underlined style or subtle box. On focus, the bottom border expands and glows.
- Use `JetBrains Mono` for all input text to match the "Command" feel.

### Chips/Tags
- Small, uppercase labels with a low-opacity background color corresponding to their status (e.g., green for 'Passed', red for 'Error').

### Cards
- Use for documentation snippets or dashboard widgets. Features a 1px top-border that is 10% brighter than the rest of the frame to catch the "ceiling light."