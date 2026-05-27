---
name: Python Expert
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c1c7d0'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8b919a'
  outline-variant: '#41474f'
  surface-tint: '#98cbff'
  primary: '#98cbff'
  on-primary: '#003354'
  primary-container: '#3776ab'
  on-primary-container: '#f5f8ff'
  inverse-primary: '#1d6296'
  secondary: '#efc52b'
  on-secondary: '#3c2f00'
  secondary-container: '#d1aa00'
  on-secondary-container: '#504000'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#63738a'
  on-tertiary-container: '#f6f8ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cfe5ff'
  primary-fixed-dim: '#98cbff'
  on-primary-fixed: '#001d33'
  on-primary-fixed-variant: '#004a77'
  secondary-fixed: '#ffe082'
  secondary-fixed-dim: '#ecc228'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#564500'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  chat-max-width: 800px
  gutter: 1.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is built to facilitate a deep-focus learning environment for developers. It bridges the gap between academic rigor and modern software engineering aesthetics. The personality is authoritative yet approachable, mimicking the feel of a premium Integrated Development Environment (IDE) while maintaining the clarity of a high-end educational platform.

The visual style is **Corporate / Modern** with a strong leaning toward **Minimalism**. It prioritizes content hierarchy and readability, using subtle borders and intentional whitespace to separate logic from conversation. By utilizing a "Developer-First" aesthetic, the design system evokes a sense of technical competence and professional growth.

## Colors

The palette is rooted in the identity of the Python ecosystem but refined for a high-end UI. 

- **Primary (#3776AB):** Used for primary actions, active navigation states, and branding accents.
- **Secondary (#FFD43B):** Used sparingly as an "insight" or "warning" color, highlighting key learning takeaways or syntax alerts.
- **Neutral / Background (#0F172A):** A deep slate navy that reduces eye strain during long coding sessions. 
- **Surface Scale:** For dark mode, use a scale of slate grays (Slate-800 to Slate-900) to create depth without relying on pure black. In light mode, transition to a crisp white background with Slate-50 surfaces.

Success, Error, and Info states should use standard semantic colors (Emerald, Rose, Sky) but desaturated to match the professional tone of the design system.

## Typography

This design system utilizes **Geist** for its UI and body copy due to its exceptional clarity and technical "Swiss" feel. Typography is structured to support long-form reading in the curriculum and rapid-fire interaction in the chat.

**JetBrains Mono** is reserved for code snippets, citations, and metadata labels. This distinction helps the user mentally switch between "reading instructions" and "reviewing code." 

- **Headlines:** Should be tight and bold.
- **Body:** Uses a generous line-height (1.6) to ensure educational content is accessible.
- **Monospace:** Should always be rendered with subpixel antialiasing for maximum legibility on dark backgrounds.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the navigation and a **Centered Fluid** model for the content area.

1.  **Sidebar:** A fixed 280px navigation rail on the left holds the curriculum hierarchy. On mobile, this transitions to a hidden drawer.
2.  **Main Content:** The central chat and tutor area has a max-width of 800px to keep line lengths optimal for reading.
3.  **Spacing Rhythm:** A base-8 unit system (4px, 8px, 16px, 24px, 32px, 64px) is strictly enforced to maintain a rhythmic, systematic feel.

Margins are generous (24px+) to prevent the technical content from feeling claustrophobic.

## Elevation & Depth

Visual hierarchy is established primarily through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** The base Slate-950 (#0F172A).
- **Level 1 (Cards/Sidebar):** A slightly lighter Slate-900.
- **Level 2 (Chat Bubbles/Popovers):** Slate-800 with a subtle 1px border (#334155).

Shadows are used sparingly. When necessary, use "Ambient Shadows"—large blur (20px+), very low opacity (10%), and no offset—to make elements like citations or code-copy tooltips appear to float subtly above the workspace.

## Shapes

The design system uses **Soft** roundedness (4px - 12px) to maintain a professional, engineered appearance.

- **4px (rounded-sm):** Used for checkboxes, small code tags, and inline elements.
- **8px (Default):** Used for buttons, input fields, and chat bubbles.
- **12px (rounded-lg):** Used for main containers like code editors and sidebar segments.

Avoid pill-shapes or fully rounded circles except for user avatars.

## Components

### Chat Bubbles
- **User:** Right-aligned, no background, subtle Slate-700 border. Typography in Geist.
- **AI (Tutor):** Left-aligned, Slate-900 background. Primary (#3776AB) vertical accent line on the left to indicate the "source" of the response.

### Code Containers (Monaco-Style)
- **Structure:** Header bar containing the filename (left) and "Copy Code" (right) in JetBrains Mono.
- **Body:** Dark background (#010409 style), syntax highlighting following the "One Dark" or "GitHub Dark" theme.
- **Interactions:** Line highlighting for the AI to point out specific errors.

### Source Citations
- **Style:** Small, collapsible chips at the bottom of AI responses.
- **Content:** When expanded, they show a snippet of the local documentation with a low-opacity primary background.

### Inputs
- **Chat Input:** A fixed-bottom container with a subtle glassmorphism effect (backdrop-blur). The input field itself is a multi-line text area that grows with content.

### Sidebar Navigation
- **Hierarchy:** Use a nested list structure. Active lessons are indicated by a primary-colored vertical indicator and a bold font weight.