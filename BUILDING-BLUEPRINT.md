# BlockMate Building mode

The first Building mode slice accepts a JSON blueprint and stages the full user flow:

1. Choose a building file.
2. Analyze the blocks.
3. Show width, height, length, total blocks, required materials, and stack estimates.
4. Ask the user to mark the allotted land in Minecraft using two opposite corners.
5. Confirm the allotted land.
6. Prepare the layer-by-layer block order.
7. Ask for final confirmation before starting the build sequence.

## JSON format

```json
{
  "name": "Small oak house",
  "blocks": [
    { "x": 0, "y": 0, "z": 0, "block": "minecraft:oak_planks" },
    { "x": 1, "y": 0, "z": 0, "block": "minecraft:oak_planks" }
  ]
}
```

The analyzer accepts either direct `x`, `y`, `z` fields or a nested `position` object. It currently accepts JSON only. Bedrock `.mcstructure` support should be added after the JSON workflow is verified with a real user blueprint.

The native Accessibility bridge is already connected to the app's arm/stop safety path. Actual block placement still requires the calibrated screen-recognition and placement state machine: the app must know the player's camera direction, hotbar slot, target face, and whether each placement succeeded before it can safely dispatch the next block gesture.
