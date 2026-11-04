# BlockMate native bridge plan

## Target

Implement real Android gesture control for Minecraft Bedrock Beta 1.21.100.23 on a OnePlus 8 running Android 13. Minecraft runs on the same device as BlockMate, in landscape at a 2400x1080 reference resolution.

## Current milestone

The local Expo module `modules/blockmate-native` declares `BlockMateAccessibilityService` and `BlockMateModule`. It exposes Accessibility Settings, service status, foreground package gating, arm/stop, reference-coordinate taps, and reference-coordinate swipes.

## Safety contract

The service will not dispatch a gesture unless Accessibility is enabled, Minecraft is foreground, the display is landscape, and the bridge has been armed. The app retains an immediate stop method. This milestone does not yet implement screenshot recognition, AI planning, or a continuous farming routine.

## Next milestone

Add Android screenshot capture and screen-region checks, then connect the React Native calibration screen to the native bridge. Only after a harmless tap and joystick swipe are verified on the OnePlus 8 should the fixed farming state machine be enabled.
