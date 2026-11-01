# BlockMate delivery checklist

## 1. Control hub and five automation modes
- [in progress] The app provides a mode hub for farming and replanting, tree chopping, straight-tunnel mining, fishing, repeated combat, and blueprint building, with implementation status clearly shown for each mode.
- [in progress] The prototype presents prepared screens and controls for chopping, mining, fishing, and combat, clearly marked as planned or not yet active.
- [in progress] Building mode accepts a JSON building file, analyzes dimensions and required materials, asks the user to confirm the allotted land, and prepares a layer-by-layer block order before final confirmation.
- [ ] Add Bedrock `.mcstructure` import after the JSON blueprint workflow is verified with a real file.

## 2. Farming prototype run
- [in progress] Farming and replanting is the first functional automation mode and uses a calibrated interaction sequence in the prototype run loop.
- [in progress] The Android native Accessibility gesture bridge is integrated as a local Expo module with service status, Accessibility Settings, arm/stop, Minecraft foreground gating, and 2400x1080 reference-coordinate taps and swipes; the app's Start, Pause, Resume, and emergency STOP controls call the bridge when running in the custom APK.
- [ ] The Android APK is built and installed on the OnePlus 8 running Android 13, Accessibility is enabled, and one harmless tap plus one joystick swipe are verified in Minecraft Bedrock Beta 1.21.100.23.
- [ ] Screenshot recognition and the fixed farming state machine are connected after the harmless gesture test succeeds; AI planning remains constrained to user-selected actions and safety rules.
- [ ] Complete the physical APK/device procedure in `DEVICE-TEST.md`; the sandbox cannot claim this native-only result without the OnePlus 8 test.
- [ ] Connect the prepared Building block order to screenshot-recognized hotbar selection, target-face placement, success verification, and safe progression through the native gesture bridge.

## 3. Calibration and permissions
- [in progress] The app includes a guided calibration flow for matching BlockMate to the phone's Minecraft Bedrock control layout, touch targets, orientation, and relevant screen regions.
- [in progress] Onboarding explains Accessibility access, screen capture or recognition requirements, privacy boundaries, and that no Minecraft modification or Microsoft account password is required.

## 4. Safety-first controls and run state
- [in progress] The app includes large Start and Pause controls plus a highly prominent emergency STOP control designed for quick one-handed use.
- [in progress] Each mode exposes configurable limits such as maximum run time, action count, distance, or repetitions, with safe defaults.
- [in progress] The app models automatic safety stopping when recognized health is low, inventory appears full, or the visible game screen changes unexpectedly.
- [in progress] Run-state feedback shows whether automation is idle, calibrated, running, paused, stopped, or halted by a safety condition.
- [in progress] The interface is portrait-first with large touch targets, concise warnings, confirmation before automation begins, and easy recovery after a stop.
