---
name: Astraios Core (Light Mode)
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3c494e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6c797f'
  outline-variant: '#bbc9cf'
  surface-tint: '#00677f'
  primary: '#00677f'
  on-primary: '#ffffff'
  primary-container: '#00d1ff'
  on-primary-container: '#00566a'
  inverse-primary: '#4cd6ff'
  secondary: '#731be5'
  on-secondary: '#ffffff'
  secondary-container: '#8d42ff'
  on-secondary-container: '#fdf6ff'
  tertiary: '#006d3c'
  on-tertiary: '#ffffff'
  tertiary-container: '#00dc7f'
  on-tertiary-container: '#005b31'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b7eaff'
  primary-fixed-dim: '#4cd6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d4bbff'
  on-secondary-fixed: '#270058'
  on-secondary-fixed-variant: '#5d00c2'
  tertiary-fixed: '#5bffa1'
  tertiary-fixed-dim: '#00e383'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#00522c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1440px
---

## Brand & Style
This design system translates a high-tech, aerospace-inspired aesthetic into a crisp, light-mode environment. The brand personality is precise, innovative, and authoritative, evoking the feeling of a clean-room laboratory or a modern mission control center. 

The visual style is **Modern High-Contrast** with heavy influences from **Glassmorphism**. It utilizes stark white surfaces, precision-engineered borders, and vibrant "electric" accents to maintain a technical edge without the heaviness of a dark UI. The emotional response should be one of clarity, high performance, and reliability.

## Colors
The palette shifts from deep space to atmospheric clarity. 
- **Primary (Electric Cyan):** Used for primary actions, active states, and critical data visualizations. 
- **Secondary (Vivid Violet):** Used for secondary highlights and categorized data.
- **Surface Strategy:** The background is a pure `#FFFFFF`, while containers use a very light `#F8FAFC` to create subtle structural differentiation.
- **Typography:** Headlines use a deep slate-black for maximum contrast, ensuring the high-tech aesthetic remains readable.
- **Accents:** High-saturation tones are used sparingly against the white backdrop to signify "energy" and "state."

## Typography
The typography system relies on **Inter** for its systematic, utilitarian nature. To enhance the "tech" feel, **JetBrains Mono** is introduced for labels, captions, and data points, mimicking code and instrumentation.
- **Weight Strategy:** Headlines use Extra Bold/Bold weights to provide the "Bold" aesthetic requested, creating a strong hierarchy against the minimalist background.
- **Letter Spacing:** Headlines utilize slight negative tracking for a tighter, more modern look, while mono labels use increased tracking for legibility and a mechanical feel.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop (12 columns) and a **Fluid Grid** on mobile (4 columns). 
- **Rhythm:** A strict 4px base unit ensures mathematical precision in all component sizing.
- **Density:** The system favors a medium-to-high density to reflect data-rich environments, but uses generous outer margins to maintain a premium, "airy" feel.
- **Alignment:** All technical labels and data points must align to the baseline grid to maintain the "engineered" aesthetic.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and soft, technical shadows rather than heavy fills.
- **Surface 1 (Base):** Pure `#FFFFFF`.
- **Surface 2 (Glass):** White with 70% opacity, applying a `20px` backdrop-blur. This is used for navigation bars and floating panels.
- **Outer Glows:** Instead of traditional black shadows, use very low-opacity shadows tinted with the primary cyan color (`rgba(0, 209, 255, 0.1)`) to suggest light emission from the UI elements.
- **Borders:** Use thin (1px) semi-transparent borders (`rgba(15, 23, 42, 0.08)`) to define edges on white backgrounds without adding visual weight.

## Shapes
The shape language is "Soft-Technical." We avoid the playfulness of fully rounded pills in favor of professional, geometric precision. 
- **Corner Radius:** A standard `4px` (0.25rem) radius is used for small components (inputs, buttons).
- **Large Containers:** Cards and modals use an `8px` or `12px` radius to feel modern but structured.
- **Interactive States:** On hover, certain interactive elements may "sharpen" their appearance (visualized by border-color shifts) to indicate precision.

## Components
- **Buttons:** Primary buttons use a solid Electric Cyan fill with white text. Secondary buttons use a "Ghost" style with a 1px Slate border and Cyan text.
- **Chips/Badges:** Use a "Light-Wash" style—10% opacity of the accent color as a background with 100% opacity text for the label.
- **Input Fields:** Crisp white backgrounds with a subtle 1px border. Focus states trigger a 2px Cyan "Inner Glow" and a 1px Cyan border. Use JetBrains Mono for placeholder text.
- **Cards:** Utilize the Glassmorphism effect for cards overlaying data visualizations. Otherwise, use a thin border with a very subtle drop shadow (Blur: 10px, Y: 4px, Opacity: 4%).
- **Segmented Controls:** Use a "Recessed" look where the active segment is a slightly elevated white card against a light gray track.
- **Data Tables:** High-density, no vertical borders. Use horizontal dividers with a 0.5px weight for a clean, technical appearance.