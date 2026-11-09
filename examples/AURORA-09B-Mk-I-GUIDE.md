# AURORA-09B Pocket God Cannon Mk-I

This package is a **BlockMate blueprint**, not a finished `.mcworld` save. It describes an underground armored reactor and three fixed launch profiles for a vanilla Bedrock/Pocket prototype.

## What is included

- `aurora-09b-pocket-god-cannon.json`: 2,515 block placements, dimensions, three profile records, and safety notes.
- `aurora-09b-materials.json`: exact block counts calculated from the blueprint.
- `create_aurora_blueprint.py`: reproducible generator used to create the blueprint.

## Import into BlockMate

1. Copy the JSON file to the phone.
2. Open BlockMate and select **Building**.
3. Import `aurora-09b-pocket-god-cannon.json`.
4. Review dimensions and materials.
5. Choose an empty, level test area at least 40 blocks wide and 40 blocks long.
6. Keep the in-app building mode in manual/confirm mode until every redstone section has been checked.

The current BlockMate prototype analyses the file and produces a build order. It does not yet inject blocks into Minecraft, and the JSON cannot be opened by Minecraft as a world save by itself.

## Construction order in Minecraft

1. Make a copy of the survival world or use a separate creative test world.
2. Mark a 25 × 27 rectangle. The blueprint's north direction is positive Z.
3. Excavate the 15 × 21 × 9 underground chamber and build the deepslate shell.
4. Build the obsidian reactor ring before placing any TNT.
5. Build the control room, airlock, relay lanes, lamps, and profile levers.
6. Build the three stepped barrel channels A, B, and C. Keep each channel physically separate.
7. Fill each water channel and check that the water does not flow into the redstone room.
8. Test all redstone with no TNT present.
9. Place one charge and one payload manually in profile A. Fire only from behind the blast door.
10. Repeat the test three times and record range and damage. Do not add extra charge TNT until the result is stable.
11. Calibrate profiles B and C separately. Beta updates can change behavior.
12. Only after the mechanism is reliable should you add the surface hatch, antenna, decorative ring, or reload storage room.

## Safety rules

- Never test in the only copy of a survival world.
- Never activate two profile lanes together.
- Do not stand behind or in front of a loaded barrel.
- Do not automate TNT loading during the first tests.
- Treat the two TNT blocks in the blueprint as placeholders, not as permission to use a multi-charge shot immediately.
- A water channel reduces some blast damage but does not make a failed TNT launch safe.

## Important limitation

A vanilla Bedrock world save requires Minecraft's internal LevelDB region/chunk data and version-specific metadata. This package intentionally does not claim to be a valid `.mcworld` import. It is a precise, inspectable blueprint that BlockMate can analyse and that a player can build in a copied world. A tested `.mcworld` would need to be generated or exported by Minecraft/Bedrock-compatible world tooling and then verified in the user's exact beta build.
