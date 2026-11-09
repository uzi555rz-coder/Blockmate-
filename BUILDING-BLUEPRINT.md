# BlockMate Building mode

The Building mode accepts a JSON blueprint and stages a manual side-by-side building workflow:

1. Choose a building file.
2. Analyze the blocks.
3. Show width, height, length, total blocks, required materials, and stack estimates.
4. Ask the user to mark the allotted land in Minecraft using two opposite corners.
5. Confirm the allotted land.
6. Open the manual Side-by-side Guide.
7. Navigate layers and view the next block's relative coordinates.
8. Mark blocks placed manually and track progress.

BlockMate does not place blocks, send taps, read Minecraft screen pixels, or draw over Minecraft. It is designed to remain a normal companion app with no Accessibility or screen-capture permission.

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

The analyzer accepts either direct `x`, `y`, `z` fields or a nested `position` object. It currently accepts JSON only. Bedrock `.mcstructure` support remains a future import feature.
