# BlockMate Android completion test

Target: OnePlus 8, Android 13, Minecraft Bedrock Beta 1.21.100.23, landscape 2400×1080.

## Build

Use the project Dashboard Android build action to create an APK from the accepted checkpoint. The sandbox does not run Expo/EAS release builds.

## Install and permission setup

1. Install the APK on the OnePlus 8.
2. Open BlockMate once.
3. Open the calibration sheet and tap **OPEN SETTINGS**.
4. Enable **BlockMate Minecraft controls** under Android Accessibility settings.
5. Return to BlockMate and tap **REFRESH**. The status should show the Accessibility service as detected.
6. Open Minecraft Bedrock Beta and enter a disposable copy of the survival world in landscape.

## Safe gesture test

1. Keep the player away from a cliff, lava, mobs, and valuable redstone.
2. Set a low farming action limit.
3. Complete the three calibration checks.
4. Start the farming prototype.
5. Confirm that the status reports Minecraft in the foreground.
6. Verify only one harmless calibrated gesture, then press **STOP**.
7. Background Minecraft or open another app. The service must stop accepting gestures when Minecraft leaves the foreground.
8. Confirm that Pause calls the native stop path and Resume requires Minecraft to be foreground again.

Do not enable a continuous farming routine until the harmless tap and joystick swipe have been confirmed on the physical device.
