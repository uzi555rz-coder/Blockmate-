# BlockMate delivery checklist

## 1. Companion hub and six planning modes
- [in progress] The app provides a mode hub for farming and replanting, tree chopping, straight-tunnel mining, fishing, repeated combat, and blueprint building, with implementation status clearly shown for each mode.
- [in progress] The prototype presents prepared screens and controls for chopping, mining, fishing, and combat, clearly marked as planned or not yet active.
- [in progress] Building mode accepts a JSON building file, analyzes dimensions and required materials, asks the user to confirm the allotted land, and prepares a layer-by-layer block order before final confirmation.
- [complete] After land confirmation, the manual Build Assist view shows the current layer, a schematic footprint preview, next-block coordinates, layer navigation, opacity presets, and placed-block progress; it never sends a Minecraft action.
- [ ] Add Bedrock `.mcstructure` import after the JSON blueprint workflow is verified with a real file.

## 2. Farming prototype run
- [in progress] Farming and replanting is represented as a manual checklist and planning loop; the companion app never sends Minecraft actions.
- [complete] The Android Accessibility and MediaProjection paths were removed so the companion APK is a normal permission-free guide app.
- [ ] Build and install the normal companion APK on the OnePlus 8 running Android 13, then verify JSON import and manual guide navigation in Minecraft Bedrock Beta 1.21.100.23.
- [complete] Screenshot recognition, automatic gestures, and the continuous farming state machine are excluded from this permission-free product scope.
- [ ] Complete the physical APK/device procedure in `DEVICE-TEST.md`; the sandbox cannot claim this device-only result without the OnePlus 8 test.
- [complete] Building mode imports a JSON blueprint, calculates dimensions and material quantities, confirms allotted land, and presents a manual block order. Automatic placement is intentionally outside the companion scope.

## 3. Calibration and permissions
- [in progress] The app includes a manual setup flow for matching BlockMate's guide to the phone's Minecraft Bedrock orientation, build area, and relevant screen regions.
- [complete] Onboarding explains that BlockMate is a normal companion app with no Accessibility access, screen recognition, Minecraft modification, or Microsoft account password requirement.

## 4. Safety-first controls and run state
- [in progress] The app includes large Start and Pause controls plus a highly prominent emergency STOP control designed for quick one-handed use.
- [in progress] Each mode exposes configurable limits such as maximum run time, action count, distance, or repetitions, with safe defaults.
- [in progress] The app models automatic safety stopping when recognized health is low, inventory appears full, or the visible game screen changes unexpectedly.
- [in progress] Run-state feedback shows whether the manual guide is idle, prepared, running, paused, or stopped.
- [in progress] The interface is portrait-first with large touch targets, concise warnings, confirmation before a manual guide begins, and easy recovery after a stop.
