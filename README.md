# SEREN — Luxury Island Resort

Awwwards-level cinematic scroll experience for **SEREN**, a luxury seaside island resort in Motu Tevairoa, Bora Bora, French Polynesia.

Built with **Vite**, **GSAP + ScrollTrigger**, **Lenis**, **SplitType**, and **Three.js**.

---

## ✦ Features & Architecture

1. **Cinematic 900vh Scrubbed Scroll Sequence**
   - High-definition WebP frame extraction from `seren.mp4` at 24fps (1440w desktop, 800w mobile).
   - Canvas cover-fit rendering scrubbed frame-by-frame via GSAP ScrollTrigger and Lenis smooth scrolling.
   - User cannot skip the sequence via wheel flicks, trackpad, mobile swipe, or keyboard navigation (`Space`, `PageDown`, `End`).
   - Seamlessly releases into the Villas section upon completion without jumps or dead space.

2. **Dynamic 4-Phase Color Grading & Atmospheric Effects**
   - **0% – 30% (Daylight Lagoon)**: Bright, warm ambient grading with editorial typography.
   - **30% – 37% (Water Entry)**: Subtle 300ms camera shake, white splash flash, and sudden particle burst.
   - **37% – 65% (Underwater Coral Reef)**: Deep teal color grade, gently rising refractive bubble particles, low-poly 3D floating jellyfish and marine life in Three.js with organic swimming pulses and mouse parallax, and 4 horizontal underwater immersion cards with parallax images and caustic light shimmer.
   - **65% – 73% (Ascent)**: Camera breaks water surface, transitioning from oceanic teal to warm evening sky.
   - **73% – 100% (Sunset Horizon)**: Rich golden-orange twilight grade, animated time counter (04:10 PM to 06:42 PM), and word-by-word SplitType headline reveal.

3. **Pinned 3D Sanctuary Villas (1200px Perspective)**
   - 3D card deck with active scaling, inactive blur/dimming, and scroll-driven focal transitions.
   - Interactive mouse hover tilt in 3D space (`transformPerspective(1200)`).
   - Zero nested scrollbars or inner overflow; completely driven by master page scroll.
   - Strictly optimized to fit within `100svh` on screens from 1366x768 up to 4K.

4. **Interactive WebGL Water Ripple Reservation Section**
   - Three.js WebGL displacement shader reacting dynamically to mouse movement and cursor interaction over luxury sunset photography.
   - Line-by-line masked reveal of *"Book your tide."*.
   - Styled reservation date and guest controls with magnetic coral CTA button.

5. **Adaptive Header & WCAG AA Contrast System**
   - Automatic theme switching between `.nav--on-dark` (frosted glass, cream typography) and `.nav--on-light` (light tint, dark navy typography) based on underlying section brightness.
   - Smooth 0.3s synchronized color transition for logo, nav links, buttons, and mobile hamburger.

6. **Luxury Custom Cursor & Magnetic Interactions**
   - Trailing cursor dot and smooth lerp outer ring with magnetic attraction on buttons and links.
   - Automatic fallback to standard pointer on touch/coarse devices and `@media (prefers-reduced-motion)`.

---

## ✦ Folder Structure

```
serenwebsite/
├── public/
│   ├── frames/                 # 360 Desktop WebP frames (1440w, 24fps)
│   ├── frames-mobile/          # 120 Mobile WebP frames (800w, 8fps)
│   └── images/                 # High-resolution resort assets
│       ├── coral-reef.jpg
│       ├── night-diving.jpg
│       ├── ocean-spa.jpg
│       ├── sea-dining.jpg
│       ├── overwater-villa.jpg
│       ├── beach-villa.jpg
│       ├── cliff-villa.jpg
│       └── sunset-bg.jpg
├── src/
│   ├── modules/
│   │   ├── cursor.js           # Custom cursor & magnetic buttons
│   │   ├── preloader.js        # Asset preloader & progress bar
│   │   ├── scrollSequence.js   # 900vh GSAP ScrollTrigger canvas sequence
│   │   ├── bubbles.js          # Interactive canvas bubble physics
│   │   ├── underwaterThree.js  # Three.js 3D floating marine life
│   │   ├── villas.js           # Pinned 3D villa card showcase
│   │   ├── waterRipple.js      # WebGL water ripple shader
│   │   └── navbar.js           # Adaptive theme navbar & mobile menu
│   ├── styles/
│   │   └── main.css            # Single source of truth CSS tokens & styles
│   └── main.js                 # Lenis + GSAP synchronization & app bootstrap
├── extract-frames.py           # Automated ffmpeg frame extraction script
├── download-images.js          # Template asset downloader
├── index.html                  # Semantic, accessible HTML markup
├── package.json                # Project dependencies and scripts
└── vite.config.js              # Vite configuration
```

---

## ✦ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Preview at `http://localhost:5173/`.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## ✦ How to Replace Assets & Content

### Replacing the Video & Frames
1. Place your new video as `seren.mp4` in the project root.
2. Re-run the automated extraction script:
   ```bash
   python extract-frames.py
   ```
   This will automatically generate:
   - Desktop: `public/frames/frame_%04d.webp` (24fps, 1440w, WebP quality 70)
   - Mobile: `public/frames-mobile/frame_%04d.webp` (8fps, 800w, WebP quality 70)
3. If your video has different timings for splash or sunset, adjust the progress markers in `src/modules/scrollSequence.js`:
   - `0.00 – 0.30`: Sky / Aerial Lagoon
   - `0.30 – 0.37`: Splash / Water Entry
   - `0.37 – 0.65`: Underwater Coral Reef
   - `0.65 – 0.73`: Water Exit / Horizon
   - `0.73 – 1.00`: Sunset

### Replacing Images
- Replace files directly in `public/images/`:
  - `coral-reef.jpg`, `night-diving.jpg`, `ocean-spa.jpg`, `sea-dining.jpg`
  - `overwater-villa.jpg`, `beach-villa.jpg`, `cliff-villa.jpg`, `sunset-bg.jpg`

### Customizing Text & Fonts
- **Typography Tokens**: Defined exclusively in `src/styles/main.css` via CSS variables:
  - `--font-display: 'Cormorant Garamond', Georgia, serif;`
  - `--font-body: 'Inter', sans-serif;`
- **Text Content**: Edit semantic copy directly in `index.html`.
