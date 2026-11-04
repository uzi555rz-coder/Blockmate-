# Why Play Protect blocks the sideloaded APK

Google’s official developer guidance says the message “This app can request access to sensitive data. This can increase the risk of identity theft or financial fraud” is used for internet-sideloaded apps that declare sensitive permissions, including `ACCESSIBILITY`. The guidance explains that Google may automatically block installation in select markets. It recommends using only the minimum permissions needed and using accessibility APIs only for their intended purpose with explicit user consent.

BlockMate declares an Android AccessibilityService because its core purpose is to control Minecraft on the user’s device. It does not request SMS or notification-listener permissions, but the AccessibilityService declaration alone can trigger this protection when installed from a browser or file manager.

Google’s user guidance recommends keeping Play Protect enabled. It says users may send an unknown app for Google scanning, and developers whose legitimate app is incorrectly blocked can appeal the Play Protect action.

Sources:
- https://developers.google.com/android/play-protect/warning-dev-guidance
- https://support.google.com/android/answer/2812853?hl=en
- https://developers.google.com/android/play-protect
