# Dice

Dice is an interactive generative audiovisual experiment built with `Three.js`, `TypeScript`, and `Vite`. It renders a responsive field of 3D dice, lets the viewer shift between orderly and chaotic motion, and pairs those visual states with mode-based procedural music.

The project is designed as a browser experience rather than a traditional UI app. Visual rhythm, motion timing, hover behavior, autoplay patterns, and musical tone all work together as part of the piece.

## Features

- Responsive 3D dice grid rendered with `Three.js`
- Two motion states: `order` and `chaos`
- Manual and autoplay interaction modes
- Music modes with distinct scale, weighting, and octave behavior: `soft`, `crisp`, `manic`, and `mute`
- Mobile-aware HUD controls and layout handling
- Standalone documentation page for the music code excerpts

## Tech Stack

- `TypeScript`
- `Vite`
- `Three.js`

## Project Structure

- [index.html](/Users/alexcruz/Projects/dev/dice/index.html) boots the experience and defines the HUD shell
- [src/main.ts](/Users/alexcruz/Projects/dev/dice/src/main.ts) wires the scene, interaction, autoplay, and UI state together
- [src/die.ts](/Users/alexcruz/Projects/dev/dice/src/die.ts) builds and manages the die meshes
- [src/audio.ts](/Users/alexcruz/Projects/dev/dice/src/audio.ts) contains the procedural music engine
- [src/style.css](/Users/alexcruz/Projects/dev/dice/src/style.css) defines the visual look of the scene and HUD

## Getting Started

### Install

```bash
npm install
```

### Run the local dev server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Interaction Model

The interface exposes five main control groups:

- `grid scale` changes the density and visual footprint of the dice field
- `rotation mode` switches between structured and chaotic movement
- `line mode` toggles line visibility
- `play mode` changes between manual interaction and autoplay
- `music mode` selects the active sound profile or silences audio

On smaller screens, the HUD switches to a mobile-oriented control layout.

## Music System

The music engine lives in [src/audio.ts](/Users/alexcruz/Projects/dev/dice/src/audio.ts). Each mode combines:

- A scale definition using semitone offsets
- Weighted degree selection to bias melodic choices
- Weighted octave offsets to shape pitch range
- A mode-specific synthesis and effects profile

For a presentation-friendly view of the core music logic, open [docs/music-code-showcase.html](/Users/alexcruz/Projects/dev/dice/docs/music-code-showcase.html).

## Repository Notes

- This project uses `vite` for local development and bundling.
- The generated production output is written to `dist/`.
- Audio playback depends on browser audio permissions and usually starts after user interaction.
