# BlockMate Android screen recognition

The APK now includes an explicit Android MediaProjection flow for one-frame Minecraft capture. The user opens Calibration and taps **CAPTURE ONE FRAME**. Android shows its own screen-capture consent prompt. If approved, BlockMate starts a short-lived foreground media-projection service, saves one PNG frame in the app cache, reports the captured width and height, and stops the service.

The Accessibility bridge remains separate. Accessibility is used for user-started calibrated gestures and Minecraft foreground gating; MediaProjection is used for the user-approved screen frame. Neither feature uploads screen content. The screen-capture notification and Android capture indicator are expected.

The current milestone is a capture and recognition-input foundation, not a complete computer-vision classifier. It does not yet claim to detect health, hunger, hotbar slots, crops, trees, ores, or building faces automatically. Those detectors should be implemented and tested against real OnePlus 8 Minecraft screenshots before enabling any safety-critical automation decisions.

The APK requires the user to approve screen capture each time Android requests it. The user can cancel the prompt or stop capture. The Android manifest declares `FOREGROUND_SERVICE_MEDIA_PROJECTION` and a non-exported media-projection foreground service.
