export type AutomationModeId = "farm" | "trees" | "mine" | "fish" | "combat" | "build";

export type RunState = "idle" | "calibrated" | "running" | "paused" | "stopped" | "safety_stop";

export type ModeStatus = "active" | "planned";

export type BlockMateMode = {
  id: AutomationModeId;
  label: string;
  shortLabel: string;
  description: string;
  status: ModeStatus;
  icon: string;
  accent: string;
  limitLabel: string;
  unit: string;
  defaultLimit: number;
  minLimit: number;
  maxLimit: number;
  step: number;
};

export const BLOCKMATE_MODES: BlockMateMode[] = [
  {
    id: "farm",
    label: "Farming & replanting",
    shortLabel: "Farm",
    description: "Harvest a prepared plot, replant, and stop before the next row.",
    status: "active",
    icon: "leaf-outline",
    accent: "#A7D46F",
    limitLabel: "Actions",
    unit: "actions",
    defaultLimit: 12,
    minLimit: 4,
    maxLimit: 40,
    step: 4,
  },
  {
    id: "trees",
    label: "Tree chopping",
    shortLabel: "Trees",
    description: "A planned loop for marked trees and a safe return path.",
    status: "planned",
    icon: "git-branch-outline",
    accent: "#C7A66A",
    limitLabel: "Trees",
    unit: "trees",
    defaultLimit: 3,
    minLimit: 1,
    maxLimit: 12,
    step: 1,
  },
  {
    id: "mine",
    label: "Straight-tunnel mining",
    shortLabel: "Mine",
    description: "A planned tunnel pattern with tool and light checks.",
    status: "planned",
    icon: "hammer-outline",
    accent: "#8FB3C8",
    limitLabel: "Blocks",
    unit: "blocks",
    defaultLimit: 24,
    minLimit: 8,
    maxLimit: 96,
    step: 8,
  },
  {
    id: "fish",
    label: "Fishing",
    shortLabel: "Fish",
    description: "A planned cast, bite detection, reel, and recast cycle.",
    status: "planned",
    icon: "water-outline",
    accent: "#7FC4C8",
    limitLabel: "Catches",
    unit: "catches",
    defaultLimit: 5,
    minLimit: 1,
    maxLimit: 20,
    step: 1,
  },
  {
    id: "combat",
    label: "Repeated combat",
    shortLabel: "Combat",
    description: "A planned short-range pattern with health and retreat checks.",
    status: "planned",
    icon: "shield-outline",
    accent: "#F07862",
    limitLabel: "Rounds",
    unit: "rounds",
    defaultLimit: 2,
    minLimit: 1,
    maxLimit: 8,
    step: 1,
  },
  {
    id: "build",
    label: "Blueprint building",
    shortLabel: "Build",
    description: "Study a blueprint, calculate materials and dimensions, confirm the allotted land, then prepare the block-by-block build order.",
    status: "active",
    icon: "business-outline",
    accent: "#D9A86C",
    limitLabel: "Blocks",
    unit: "blocks",
    defaultLimit: 64,
    minLimit: 1,
    maxLimit: 2048,
    step: 16,
  },
];

export const SAFETY_RULES = [
  { label: "Health", value: "100%", detail: "stop below 30%", color: "#A7D46F" },
  { label: "Inventory", value: "36%", detail: "stop when full", color: "#E6C88E" },
  { label: "Screen", value: "Stable", detail: "stop on change", color: "#8FB3C8" },
];

export function getMode(id: AutomationModeId) {
  return BLOCKMATE_MODES.find((mode) => mode.id === id) ?? BLOCKMATE_MODES[0];
}
