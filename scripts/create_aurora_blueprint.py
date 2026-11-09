import json
from collections import Counter
from pathlib import Path

blocks = []
def add(x, y, z, block):
    blocks.append({"x": x, "y": y, "z": z, "block": block})
def fill(x1, y1, z1, x2, y2, z2, block):
    for y in range(y1, y2 + 1):
        for z in range(z1, z2 + 1):
            for x in range(x1, x2 + 1):
                add(x, y, z, block)
def wall_box(x1, y1, z1, x2, y2, z2, block):
    for y in range(y1, y2 + 1):
        for z in range(z1, z2 + 1):
            for x in range(x1, x2 + 1):
                if x in (x1, x2) or z in (z1, z2) or y in (y1, y2):
                    add(x, y, z, block)

# Main underground 25 x 21 x 9 shell, north is +Z.
wall_box(-12, 0, -10, 12, 8, 10, "minecraft:deepslate_bricks")
# Obsidian blast ring around reactor core.
wall_box(-5, 1, -4, 5, 6, 4, "minecraft:obsidian")
# Control room floor, relay room floor, and reactor floor.
fill(-10, 1, -8, -2, 1, -5, "minecraft:polished_deepslate")
fill(2, 1, -8, 10, 1, -5, "minecraft:polished_deepslate")
fill(-4, 1, -3, 4, 1, 3, "minecraft:obsidian")
# Airlock divider and corridor.
fill(-1, 1, -8, 1, 5, -8, "minecraft:iron_block")
fill(-1, 1, -4, 1, 5, -4, "minecraft:iron_block")
# Control consoles and safety blocks.
for x, block in [(-9, "minecraft:lime_wool"), (-7, "minecraft:yellow_wool"), (-5, "minecraft:red_wool"), (-3, "minecraft:blue_wool")]:
    add(x, 2, -7, block)
    add(x, 2, -6, "minecraft:lever")
    add(x, 3, -6, "minecraft:redstone_lamp")
# Relay room: three isolated lanes.
for z in (-7, -6, -5):
    for x in range(2, 10):
        add(x, 2, z, "minecraft:repeater" if x in (3, 6, 9) else "minecraft:redstone_wire")
    add(10, 2, z, "minecraft:redstone_lamp")
# Core indicators and emergency flood controls.
for x, z in [(-4, -3), (4, -3), (-4, 3), (4, 3)]:
    add(x, 2, z, "minecraft:redstone_lamp")
add(-7, 2, -5, "minecraft:iron_door")
add(-8, 2, -5, "minecraft:button")
add(-9, 2, -5, "minecraft:water")
# Three fixed launch barrels north of the core, each with a solid floor and side walls.
# Profiles are represented as stepped channels so the player can follow the intended slope.
profiles = {
    "A": [(z, 1) for z in range(5, 12)],
    "B": [(z, 1 + (z-5)//2) for z in range(5, 14)],
    "C": [(z, 1 + (z-5)//1) for z in range(5, 16)],
}
xs = {"A": -7, "B": 0, "C": 7}
for name, path in profiles.items():
    x = xs[name]
    for z, y in path:
        for dx in (-1, 0, 1):
            add(x + dx, y, z, "minecraft:polished_deepslate")
        add(x - 1, y + 1, z, "minecraft:glass")
        add(x + 1, y + 1, z, "minecraft:glass")
        add(x - 1, y + 2, z, "minecraft:deepslate_bricks")
        add(x + 1, y + 2, z, "minecraft:deepslate_bricks")
        add(x, y + 1, z, "minecraft:water")
    # Back wall, one charge marker, one payload marker, and a muzzle frame.
    base_y = path[0][1]
    add(x, base_y + 1, 5, "minecraft:obsidian")
    add(x, base_y + 1, 6, "minecraft:tnt")
    add(x, base_y + 1, 7, "minecraft:tnt")
    end_z, end_y = path[-1]
    for dx in (-1, 0, 1):
        add(x + dx, end_y, end_z + 1, "minecraft:iron_block")
    add(x, end_y + 1, end_z + 1, "minecraft:target")
# Side service walkways and markers.
for z in range(5, 17):
    add(-11, 1, z, "minecraft:polished_deepslate")
    add(11, 1, z, "minecraft:polished_deepslate")
for x in (-7, 0, 7):
    add(x, 2, 4, "minecraft:lever")
    add(x, 3, 4, "minecraft:redstone_lamp")
# Surface hatch and antenna.
fill(-2, 9, -2, 2, 9, 2, "minecraft:copper_block")
for y in range(10, 14):
    add(0, y, 0, "minecraft:iron_bars")

out = {
    "name": "AURORA-09B Pocket God Cannon Mk-I",
    "format": "blockmate-blueprint-v1",
    "notes": "Vanilla Bedrock/Pocket prototype. TNT positions are placeholders; test in a copied world.",
    "dimensions": {"width": 25, "height": 14, "length": 27},
    "blocks": blocks,
    "profiles": [
        {"id": "A", "label": "Low arc", "angle": 35, "chargeTnt": 1},
        {"id": "B", "label": "Medium arc", "angle": 50, "chargeTnt": 1},
        {"id": "C", "label": "High arc", "angle": 65, "chargeTnt": 1}
    ],
    "safety": ["Build in a copied test world", "Test one TNT charge and one payload first", "Never activate two profiles together", "Stand behind the blast door when firing"]
}
Path("examples/aurora-09b-pocket-god-cannon.json").write_text(json.dumps(out, indent=2) + "\n")
summary = Counter(b["block"] for b in blocks)
Path("examples/aurora-09b-materials.json").write_text(json.dumps({"name": out["name"], "totalBlocks": len(blocks), "materials": dict(sorted(summary.items(), key=lambda kv: (-kv[1], kv[0])))}, indent=2) + "\n")
print(f"wrote {len(blocks)} blocks")
