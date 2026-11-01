import { describe, expect, it } from "vitest";
import { analyzeBlueprint, buildOrder } from "../lib/building";

describe("blueprint analysis", () => {
  it("calculates dimensions and material stacks from block coordinates", () => {
    const result = analyzeBlueprint({
      name: "Test house",
      blocks: [
        { x: 4, y: 2, z: -1, block: "minecraft:oak_planks" },
        { x: 5, y: 2, z: -1, block: "minecraft:oak_planks" },
        { x: 5, y: 3, z: 0, block: "minecraft:glass" },
      ],
    });

    expect(result.name).toBe("Test house");
    expect(result.dimensions).toEqual({ width: 2, height: 2, length: 2 });
    expect(result.totalBlocks).toBe(3);
    expect(result.materials).toEqual([
      { block: "minecraft:oak_planks", quantity: 2, stacks: 1 },
      { block: "minecraft:glass", quantity: 1, stacks: 1 },
    ]);
  });

  it("orders blocks by layer, row, then column", () => {
    const result = analyzeBlueprint({
      blocks: [
        { x: 2, y: 1, z: 0, block: "minecraft:stone" },
        { x: 0, y: 0, z: 1, block: "minecraft:stone" },
        { x: 1, y: 0, z: 0, block: "minecraft:stone" },
      ],
    });

    expect(buildOrder(result).map((block) => [block.x, block.y, block.z])).toEqual([
      [1, 0, 0],
      [0, 0, 1],
      [2, 1, 0],
    ]);
  });
});
