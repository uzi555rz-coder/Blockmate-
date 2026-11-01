export type BlueprintBlock = {
  x: number;
  y: number;
  z: number;
  block: string;
};

export type BlueprintAnalysis = {
  name: string;
  blocks: BlueprintBlock[];
  dimensions: { width: number; height: number; length: number };
  origin: { x: number; y: number; z: number };
  materials: Array<{ block: string; quantity: number; stacks: number }>;
  totalBlocks: number;
};

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function readBlockName(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name.trim();
  }
  return "minecraft:unknown";
}

function normalizeBlock(value: unknown): BlueprintBlock | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const position = item.position && typeof item.position === "object" ? item.position as Record<string, unknown> : item;
  const block = readBlockName(item.block ?? item.blockName ?? item.name ?? item.state);
  if (block === "minecraft:unknown") return null;
  return {
    x: numberValue(position.x),
    y: numberValue(position.y),
    z: numberValue(position.z),
    block,
  };
}

export function analyzeBlueprint(input: unknown, fallbackName = "Imported build") : BlueprintAnalysis {
  if (!input || typeof input !== "object") throw new Error("Blueprint must be a JSON object.");
  const root = input as Record<string, unknown>;
  const rawBlocks = Array.isArray(root.blocks) ? root.blocks : [];
  const blocks = rawBlocks.map(normalizeBlock).filter((block): block is BlueprintBlock => block !== null);
  if (!blocks.length) throw new Error("No supported blocks were found. Use blocks with x, y, z, and block fields.");

  const xs = blocks.map((block) => block.x);
  const ys = blocks.map((block) => block.y);
  const zs = blocks.map((block) => block.z);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const minZ = Math.min(...zs);
  const materials = new Map<string, number>();
  for (const block of blocks) materials.set(block.block, (materials.get(block.block) ?? 0) + 1);

  return {
    name: typeof root.name === "string" && root.name.trim() ? root.name.trim() : fallbackName,
    blocks,
    dimensions: {
      width: Math.max(...xs) - minX + 1,
      height: Math.max(...ys) - minY + 1,
      length: Math.max(...zs) - minZ + 1,
    },
    origin: { x: minX, y: minY, z: minZ },
    materials: Array.from(materials.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([block, quantity]) => ({ block, quantity, stacks: Math.ceil(quantity / 64) })),
    totalBlocks: blocks.length,
  };
}

export function buildOrder(analysis: BlueprintAnalysis) {
  return [...analysis.blocks].sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
}

export const BLUEPRINT_JSON_EXAMPLE = `{
  "name": "Small oak house",
  "blocks": [
    { "x": 0, "y": 0, "z": 0, "block": "minecraft:oak_planks" },
    { "x": 1, "y": 0, "z": 0, "block": "minecraft:oak_planks" }
  ]
}`;
