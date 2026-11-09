# BlockMate Android companion test

Target: OnePlus 8, Android 13, Minecraft Bedrock Beta 1.21.100.23, landscape 2400×1080.

## Install

1. Build the APK from the accepted project checkpoint.
2. Install the APK on the OnePlus 8.
3. Open BlockMate and confirm Android does not request Accessibility, screen-capture, overlay, microphone, or Minecraft-control access.
4. Open Building mode and import a JSON blueprint.
5. Review dimensions and materials, mark the allotted land manually in Minecraft, and open the Side-by-side Guide.

## Manual guide test

1. Keep Minecraft open beside or behind BlockMate.
2. Move through the guide layers with the back and forward buttons.
3. Confirm the current Y-level and layer block count update.
4. Change the opacity preset.
5. Place one block manually in Minecraft and tap **MARK BLOCK PLACED**.
6. Confirm progress advances and **RESET PROGRESS** returns it to zero.
7. Close and reopen the guide. The app must not claim to have placed blocks or sent gestures.

BlockMate is intentionally a normal companion app. It does not automate Minecraft, read Minecraft screen pixels, draw over other apps, or request a Microsoft password.
