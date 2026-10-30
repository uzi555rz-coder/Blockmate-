# BlockMate implementation plan

## Product scope
BlockMate is a portrait-first Android companion for an unmodified Minecraft Bedrock survival world. The first prototype gives the player a safe control hub for five automation modes: farming and replanting, tree chopping, straight-tunnel mining, fishing, and repeated combat. Farming is the first active mode in this prototype; the other four modes have prepared screens and controls and are clearly marked as planned. The app does not modify Minecraft, install add-ons or behavior packs, or request a Microsoft password.

The prototype models Android Accessibility and screen-recognition capabilities through an explicit onboarding and calibration flow, a deterministic demo run loop, and safety-state UI. A later native Android service can connect the existing control surface to actual gestures and screen regions without changing the product's interaction model.

## Implementation approach
- Use the fixed Expo Router / React Native / TypeScript / NativeWind starter.
- Keep the primary screen in `app/(tabs)/index.tsx` with local state for selected mode, calibration, onboarding disclosure, run state, progress, and per-mode limits.
- Add a small `lib/blockmate.ts` module for shared mode metadata, safety rules, and typed run-state values.
- Use `components/screen-container.tsx` for safe-area handling and a compact component vocabulary in the home screen: header, status card, mode cards, safety strip, calibration modal, and run controls.
- Use a deterministic interval to simulate the farming sequence in Preview and provide usable feedback. The UI labels it as a prototype run and never claims the native Accessibility service is connected.
- Persist calibration and onboarding acknowledgement locally with AsyncStorage so the app can recover after a restart without storing credentials.
- Add native-facing permission copy that explains Accessibility access and screen capture/recognition boundaries without requesting account credentials.
- Keep the screen usable one-handed: large controls, an always-visible emergency STOP action while running, concise warnings, and high-contrast state colors.

## Project structure
- `app/(tabs)/index.tsx`: BlockMate control hub, onboarding, mode selection, calibration, and prototype run loop.
- `lib/blockmate.ts`: mode definitions, limits, safety rules, and run-state types.
- `assets/images/*`: launcher, splash, favicon, and adaptive icon assets.
- `app.config.ts`: BlockMate branding and portrait/native configuration.
- `plan.md`: implementation and design decisions.
- `TODO.md`: outcome-based acceptance criteria and progress.

## Design direction

### Candidate styles
- **Workshop Console** (0.06): utilitarian dark panels, field labels, and tactile controls inspired by a carefully built redstone control box.
- **Meadow Signal** (0.04): soft natural greens and warm paper surfaces with calm farming-tool clarity.
- **Night Watch** (0.08): near-black background, amber telemetry, and high-contrast emergency affordances for late-night sessions.

### Chosen style: Workshop Console

**Design movement:** industrial workshop instrumentation translated into a friendly survival-game companion.

**Core principles:** safety is visually louder than convenience; every control has an obvious state; information is grouped by action rather than decoration; the interface feels tactile without imitating Minecraft's copyrighted UI.

**Color philosophy:** charcoal surfaces reduce glare and make state colors legible. Moss green signals ready/active automation, sand highlights configuration and calibration, and coral is reserved for stop/danger. Small blue-gray telemetry accents keep the console technical without becoming noisy.

**Layout paradigm:** a top-down control-bench flow rather than a centered dashboard: identity and current state at the top, a horizontal mode rail below, then the active mode's field card and a fixed control shelf at the bottom.

**Signature elements:** compact uppercase field labels, a left-edge state rail on cards, and a large coral stop control that appears only when needed.

**Interaction philosophy:** taps should feel deliberate and reversible. Starting requires confirmation; pause preserves the run; stop is immediate and resets to a safe idle state. Planned modes remain explorable but never pretend to be active.

**Animation:** use restrained fades and progress movement only. The run indicator pulses slowly while active; never animate the stop button or safety warnings in a way that could look like a tap target is moving.

**Typography system:** system sans for body copy, semibold uppercase labels for telemetry, and a monospaced system face for timers/counts. Headings use large, compact weight with sentence case.

**Brand essence:** a calm safety console for getting more done in a Bedrock survival world; grounded, careful, capable.

**Brand voice:** short, direct, and reassuring. Example lines: “Calibrate once. Run carefully.” and “Automation paused. Your world is safe.”

**Wordmark & logo:** a simple block-and-shield mark: a moss-topped block nested into a protective check shape.

**Signature brand color:** `#A7D46F`, a readable moss green that belongs to the product without copying Minecraft UI colors.
