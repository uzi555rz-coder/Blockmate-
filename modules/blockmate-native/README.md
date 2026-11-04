# BlockMate native Android bridge

This local Expo module adds the Android AccessibilityService used to send calibrated gestures to Minecraft Bedrock.

Target device profile:

- OnePlus 8
- Android 13
- Minecraft Bedrock Beta 1.21.100.23
- Landscape reference display: 2400x1080
- Minecraft package: `com.mojang.minecraftpe`

The bridge deliberately refuses to dispatch gestures unless:

1. The Accessibility service is enabled.
2. Minecraft is the foreground package.
3. The display is landscape.
4. The bridge has been armed by the app.

Reference coordinates are mapped proportionally to the actual display size. The first device test should use `arm()` and one harmless `tapReference()` call; do not start a farming loop until the tap result is verified on the OnePlus 8.

The native code is not testable in Expo Web. Create an Android development/release build with the Expo Dashboard or a local Android-capable build environment, enable the service in Android Settings, and then run the device test.
