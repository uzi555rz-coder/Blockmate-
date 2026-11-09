# Play Console Data Safety worksheet

Complete these answers against the final dependency list and merged release manifest.

- Does the app collect or share data? **No**, for the current local-only feature set.
- Is data encrypted in transit? **Not applicable** for local-only blueprint analysis.
- Can users request deletion? **Yes, by uninstalling the app or clearing app storage** for local data.
- Does the app use AccessibilityService? **No.**
- Does the app use screen capture or MediaProjection? **No.**
- Does the app draw over other apps? **No.**
- Does the app access files? **Yes, user-selected JSON blueprint files**, processed locally for dimensions, material counts, and manual build guidance.
- Does the app access SMS, contacts, location, camera, microphone, phone, financial information, or health information? **No.**
- Does the app sell data? **No.**

Before submission, verify the merged release manifest contains no AccessibilityService, MediaProjection service, or related sensitive permission declarations.
