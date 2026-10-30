# BlockMate delivery checklist

## 1. Control hub and five automation modes
- [in progress] The app provides a mode hub for farming and replanting, tree chopping, straight-tunnel mining, fishing, and repeated combat, with implementation status clearly shown for each mode.
- [in progress] The prototype presents prepared screens and controls for chopping, mining, fishing, and combat, clearly marked as planned or not yet active.

## 2. Farming prototype run
- [in progress] Farming and replanting is the first functional automation mode and uses a calibrated interaction sequence in the prototype run loop.
- [ ] The Android native Accessibility gesture and screen-recognition bridge is connected for real device automation; the current Expo prototype intentionally keeps the bridge boundary explicit.

## 3. Calibration and permissions
- [in progress] The app includes a guided calibration flow for matching BlockMate to the phone's Minecraft Bedrock control layout, touch targets, orientation, and relevant screen regions.
- [in progress] Onboarding explains Accessibility access, screen capture or recognition requirements, privacy boundaries, and that no Minecraft modification or Microsoft account password is required.

## 4. Safety-first controls and run state
- [in progress] The app includes large Start and Pause controls plus a highly prominent emergency STOP control designed for quick one-handed use.
- [in progress] Each mode exposes configurable limits such as maximum run time, action count, distance, or repetitions, with safe defaults.
- [in progress] The app models automatic safety stopping when recognized health is low, inventory appears full, or the visible game screen changes unexpectedly.
- [in progress] Run-state feedback shows whether automation is idle, calibrated, running, paused, stopped, or halted by a safety condition.
- [in progress] The interface is portrait-first with large touch targets, concise warnings, confirmation before automation begins, and easy recovery after a stop.
