# BlockMate Google Play review packet

## Product description

BlockMate is a Minecraft Bedrock companion for a user’s own survival world. It helps the user prepare repeatable farming tasks and analyze JSON building blueprints. The app can send calibrated touch gestures to Minecraft only after the user explicitly enables BlockMate’s AccessibilityService, starts a selected task, and keeps Minecraft in the foreground.

## Accessibility declaration

BlockMate uses Android AccessibilityService only for its core user-requested function: sending the user’s calibrated touch gestures to Minecraft Bedrock for repetitive survival-world tasks. The service is restricted to the Minecraft package `com.mojang.minecraftpe`, does not read credentials, does not collect passwords, does not read SMS, and does not control banking or financial apps. The app shows a prominent disclosure before setup and requires the user to enable the service manually in Android Settings. The user can stop the task at any time with the in-app STOP control or by disabling the service.

The service reads only the Minecraft window state needed for foreground safety checks. It does not upload screen content to a server. Gesture coordinates are based on the user’s calibrated 2400×1080 landscape layout and are used only while a selected task is running.

## Core feature and permission mapping

`BIND_ACCESSIBILITY_SERVICE` is required for the calibrated touch gestures and Minecraft foreground safety check. `INTERNET` supports the normal Expo application runtime. Microphone, storage, overlay, and media-related permissions come from bundled Expo modules and should be removed from the production variant if the final product does not use those modules. BlockMate does not request SMS, contacts, phone, location, camera, or notification-listener access.

## Reviewer test steps

Install the release APK, open BlockMate, read and accept the disclosure, open Calibration, and tap Open Settings. Enable “BlockMate Minecraft controls.” Return to BlockMate, complete the three calibration checks, and confirm the status panel reports the service. Open Minecraft Bedrock, enter a test world, select Farming, and use the smallest action limit. Confirm that Start requires Minecraft to be in the foreground, that Pause stops further gestures, and that STOP immediately disarms the bridge. Disable BlockMate from Android Accessibility settings and confirm that the app refuses to arm the bridge.

## Data safety summary

BlockMate does not sell or share personal data. It does not collect account credentials, SMS, contacts, financial information, precise location, or browsing history. The selected blueprint file is read locally to calculate dimensions, block counts, material quantities, and build order. The app does not upload Minecraft screen content. Any standard third-party runtime data collection disclosures should be completed against the final dependency and hosting configuration before submission.

## Privacy policy hosting requirement

Google Play requires a publicly accessible privacy-policy URL. Publish `PRIVACY-POLICY.md` at a stable HTTPS URL and enter that URL in Play Console. A local repository file alone is not a valid public policy URL.
