# BlockMate permission-free companion plan

## Product scope

BlockMate is a portrait-first Android companion for an unmodified Minecraft Bedrock survival world on a OnePlus 8 running Android 13. It analyzes user-selected JSON blueprints locally and helps the player follow a manual side-by-side build guide. The app does not automate Minecraft, capture the screen, draw over other apps, request Accessibility, or ask for account credentials.

## Product behavior

The app provides the six-mode hub, local blueprint analysis, dimensions and material counts, allotted-land confirmation, layer navigation, next-block coordinates, opacity presets for the guide preview, and manual placed-block progress. Farming and other automation modes remain local prototype planning loops and do not send device actions.

## Design direction

The visual direction is a calm survival-console interface: deep forest surfaces, moss-green safety signals, warm sand actions, and coral emergency controls. Layouts use stacked cards and horizontal rails for one-handed portrait use. Copy is direct and safety-first, with explicit statements that the app never edits or controls Minecraft.

## Project structure

- `app/`: Expo Router screens and the BlockMate companion UI.
- `lib/building.ts`: JSON blueprint validation, analysis, material aggregation, and build ordering.
- `examples/`: sample AURORA-09B blueprint and material manifests.
- `components/`: shared React Native presentation components.
- `TODO.md`: current delivery outcomes and device-test requirements.

## Out of scope

AccessibilityService, MediaProjection, screen recognition, overlay windows, automatic block placement, gesture dispatch, Minecraft package gating, commands, add-ons, and mods are intentionally excluded from this product version.
