# Play Console Data Safety worksheet

Complete these answers against the final dependency list and the final published privacy policy.

- Does the app collect or share data? **No**, for the current local-only feature set.
- Is data encrypted in transit? **Not applicable** for local-only data. If a hosted service is enabled later, update this answer.
- Can users request deletion? **Yes, by uninstalling the app or clearing app storage** for local data.
- Does the app use AccessibilityService? **Yes.** Explain that it is the core feature for user-started calibrated gestures in Minecraft Bedrock, restricted to `com.mojang.minecraftpe`, with prominent disclosure and explicit user enablement.
- Does the app access files? **Yes, user-selected JSON blueprint files**, processed locally for dimensions and material counts.
- Does the app access SMS, contacts, location, camera, phone, financial information, or health information? **No.**
- Does the app use screen content for advertising or profiling? **No.**
- Does the app sell data? **No.**

Before submission, remove unused Expo modules and verify the merged release manifest so the declared permissions match this worksheet.
