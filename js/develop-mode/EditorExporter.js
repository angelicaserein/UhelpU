/**
 * EditorExporter — Export editor-placed entities as copyable code
 * EditorExporter — 将编辑器放置的实体导出为可复制的代码
 *
 * Generated code format fully matches project's existing entity construction:
 * 生成的代码格式完全匹配项目现有的实体构造:
 *   new Ground(x, y, w, h)
 *   new Portal(x, y, w, h)
 *   new Platform(x, y, w, h)
 *   new Spike(x, y, w, h)
 */

import { EntityTool } from "./EditorConfig.js";

const DEFAULT_SPAWN = { x: 50, y: 450, w: 40, h: 40 };
const INDENT = "  ";
const ROOM_METHOD_INDENT = INDENT.repeat(2);

const NORMAL_TOOL_ORDER = [
  EntityTool.GROUND,
  EntityTool.PLATFORM,
  EntityTool.SPIKE,
  EntityTool.WALL,
  EntityTool.BOX,
  EntityTool.PORTAL,
  EntityTool.NPC,
  EntityTool.SIGNBOARD,
  EntityTool.TEXT_PROMPT,
  EntityTool.CHECKPOINT,
  EntityTool.TELEPORT_POINT,
  EntityTool.ENEMY,
];

const TOOL_LABELS = {
  [EntityTool.GROUND]: "Ground",
  [EntityTool.PLATFORM]: "Platform",
  [EntityTool.SPIKE]: "Spike",
  [EntityTool.WALL]: "Wall",
  [EntityTool.BOX]: "Box",
  [EntityTool.PORTAL]: "Portal",
  [EntityTool.NPC]: "NPCDemo2",
  [EntityTool.SIGNBOARD]: "SignboardDemo2",
  [EntityTool.TEXT_PROMPT]: "TextPrompt",
  [EntityTool.CHECKPOINT]: "CheckpointDemo2",
  [EntityTool.TELEPORT_POINT]: "TeleportPoint",
  [EntityTool.ENEMY]: "Enemy",
};

function createIndentedLines(baseIndent, lines) {
  return lines.map((line) => (line ? `${baseIndent}${line}` : ""));
}

function pushSection(target, title, lines, indent = INDENT.repeat(2)) {
  if (!lines.length) {
    return;
  }

  if (target.length > 0) {
    target.push("");
  }
  target.push(`${indent}// ${title}`);
  target.push(...lines);
}

function getEntitySize(entity, defaultW = 50, defaultH = 50) {
  return {
    w: entity?.collider?.w ?? defaultW,
    h: entity?.collider?.h ?? defaultH,
  };
}

function getSpawn(spawn) {
  return spawn ? { ...DEFAULT_SPAWN, ...spawn } : { ...DEFAULT_SPAWN };
}

function toCodeString(value) {
  return JSON.stringify(value);
}

function getTextPromptConfig(entity) {
  return {
    textKey: entity?.textKey || "todo_text_prompt",
    width: entity?._boxWidth ?? 280,
    height: entity?._boxHeight ?? 72,
    textSize: entity?._textSizeValue ?? 14,
    lineHeight: entity?._lineHeight ?? 18,
  };
}

function clampRoomIndex(index, roomCount) {
  return Math.max(0, Math.min(roomCount - 1, index));
}

function getRoomIndexFromX(x, roomCount, canvasWidth) {
  return clampRoomIndex(Math.floor(x / canvasWidth), roomCount);
}

function getLocalX(x, roomIndex, canvasWidth) {
  return x - roomIndex * canvasWidth;
}

function getEntityImportList(records) {
  const normalTools = new Set(records.map((record) => record.tool));
  const hasWirePortal = normalTools.has(EntityTool.WIRE_PORTAL);
  const hasBtnSpike = normalTools.has(EntityTool.BTN_SPIKE);
  const hasBtnPlatform = normalTools.has(EntityTool.BTN_PLATFORM);

  const imports = ["Player", "Ground", "Wall"];

  if (normalTools.has(EntityTool.SPIKE) || hasBtnSpike) {
    imports.push("Spike");
  }
  if (normalTools.has(EntityTool.PORTAL) || hasWirePortal) {
    imports.push("Portal");
  }
  if (hasWirePortal || hasBtnSpike || hasBtnPlatform) {
    imports.push("Button");
  }
  if (normalTools.has(EntityTool.PLATFORM) || hasBtnPlatform) {
    imports.push("Platform");
  }
  if (normalTools.has(EntityTool.BOX)) {
    imports.push("Box");
  }
  if (normalTools.has(EntityTool.NPC)) {
    imports.push("NPCDemo2");
  }
  if (normalTools.has(EntityTool.SIGNBOARD)) {
    imports.push("SignboardDemo2");
  }
  if (normalTools.has(EntityTool.TEXT_PROMPT)) {
    imports.push("TextPrompt");
  }
  if (normalTools.has(EntityTool.CHECKPOINT)) {
    imports.push("CheckpointDemo2");
  }
  if (normalTools.has(EntityTool.TELEPORT_POINT)) {
    imports.push("TeleportPoint");
  }
  if (normalTools.has(EntityTool.ENEMY)) {
    imports.push("Enemy");
  }
  if (hasWirePortal) {
    imports.push("WireRenderer");
  }

  return imports;
}

function getSystemImports(records) {
  const imports = [];
  const tools = new Set(records.map((record) => record.tool));

  if (tools.has(EntityTool.BTN_SPIKE)) {
    imports.push({
      name: "ButtonSpikeLinkSystem",
      path: "../../mechanism-system/demo2/ButtonSpikeLinkSystem.js",
    });
  }
  if (tools.has(EntityTool.WIRE_PORTAL)) {
    imports.push({
      name: "BtnWirePortalSystem",
      path: "../../mechanism-system/demo2/BtnWirePortalSystem.js",
    });
  }
  if (tools.has(EntityTool.BTN_PLATFORM)) {
    imports.push({
      name: "ButtonPlatformLinkSystem",
      path: "../../mechanism-system/demo2/ButtonPlatformLinkSystem.js",
    });
  }

  return imports;
}

function createNormalEntityStatement(
  record,
  scope = "this.entities",
  uniqueSuffix = "0",
) {
  const entity = record.gameEntity;

  switch (record.tool) {
    case EntityTool.GROUND:
    case EntityTool.PLATFORM:
    case EntityTool.SPIKE:
    case EntityTool.WALL:
    case EntityTool.BOX:
      return `${scope}.add(new ${TOOL_LABELS[record.tool]}(${entity.x}, ${entity.y}, ${entity.collider.w}, ${entity.collider.h}));`;

    case EntityTool.PORTAL: {
      const { w, h } = getEntitySize(entity, 50, 50);
      const portalRef = `portal_${uniqueSuffix}`;
      return [
        `const ${portalRef} = new Portal(${entity.x}, ${entity.y}, ${w}, ${h});`,
        `${portalRef}.openPortal();`,
        `${scope}.add(${portalRef});`,
      ];
    }

    case EntityTool.NPC: {
      const { w, h } = getEntitySize(entity, 40, 40);
      return `${scope}.add(new NPCDemo2(${entity.x}, ${entity.y}, ${w}, ${h}, { getPlayer: () => this._player, eventBus: this.eventBus, npcId: ${toCodeString("todo_npc_id")}, dialogueLines: [${toCodeString("todo_npc_line_1")}, ${toCodeString("todo_npc_line_2")}], exhaustedLine: ${toCodeString("todo_npc_exhausted")} }));`;
    }

    case EntityTool.SIGNBOARD: {
      const { w, h } = getEntitySize(entity, 100, 65);
      return `${scope}.add(new SignboardDemo2(${entity.x}, ${entity.y}, ${w}, ${h}, () => this._player, this.eventBus, { textKey: ${toCodeString("todo_signboard_text_key")} }));`;
    }

    case EntityTool.TEXT_PROMPT: {
      const config = getTextPromptConfig(entity);
      return `${scope}.add(new TextPrompt(${entity.x}, ${entity.y}, this, { textKey: ${toCodeString(config.textKey)}, width: ${config.width}, height: ${config.height}, textSize: ${config.textSize}, lineHeight: ${config.lineHeight} }));`;
    }

    case EntityTool.CHECKPOINT: {
      const { w, h } = getEntitySize(entity, 40, 70);
      return `${scope}.add(new CheckpointDemo2(${entity.x}, ${entity.y}, ${w}, ${h}, () => this._player));`;
    }

    case EntityTool.TELEPORT_POINT: {
      const { w, h } = getEntitySize(entity, 40, 70);
      return `${scope}.add(new TeleportPoint(${entity.x}, ${entity.y}, ${w}, ${h}, () => this._player));`;
    }

    case EntityTool.ENEMY: {
      const { w, h } = getEntitySize(entity, 40, 40);
      const speed = entity?._speed ?? 2;
      const direction = record.direction ?? entity?._direction ?? 1;
      const enemyRef = `enemy_${uniqueSuffix}`;
      return [
        `const ${enemyRef} = new Enemy(${entity.x}, ${entity.y}, ${w}, ${h}, { speed: ${speed} });`,
        `${enemyRef}._direction = ${direction};`,
        `${scope}.add(${enemyRef});`,
      ];
    }

    default:
      return null;
  }
}

function createSingleRoomNormalSections(records) {
  const sections = [];

  for (const tool of NORMAL_TOOL_ORDER) {
    const lines = [];
    records.forEach((record, index) => {
      if (record.tool !== tool) {
        return;
      }

      const statement = createNormalEntityStatement(
        record,
        "this.entities",
        String(index),
      );
      if (Array.isArray(statement)) {
        lines.push(...statement);
      } else if (statement) {
        lines.push(statement);
      }
    });

    if (lines.length > 0) {
      sections.push({ title: TOOL_LABELS[tool], lines });
    }
  }

  return sections;
}

function createSingleRoomButtonSpikeLines(records) {
  const items = records.filter(
    (record) => record.tool === EntityTool.BTN_SPIKE,
  );
  return items.flatMap((record, index) => {
    const button = record.gameEntity;
    const spike = record.spikeEntity;
    const buttonSize = getEntitySize(button, 34, 16);
    const spikeSize = getEntitySize(spike, 100, 20);
    return [
      `const bsBtn_${index} = new Button(${button.x}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
      `const bsSpike_${index} = new Spike(${spike.x}, ${spike.y}, ${spikeSize.w}, ${spikeSize.h});`,
      `this._bsSys_${index} = new ButtonSpikeLinkSystem({ button: bsBtn_${index}, spikes: [bsSpike_${index}] }, { startColorIndex: ${record.startColorIndex ?? index} });`,
      `this.entities.add(bsBtn_${index});`,
      `this.entities.add(bsSpike_${index});`,
    ];
  });
}

function createSingleRoomWirePortalLines(records) {
  const items = records.filter(
    (record) => record.tool === EntityTool.WIRE_PORTAL,
  );
  return items.flatMap((record, index) => {
    const button = record.gameEntity;
    const portal = record.portalEntity;
    const buttonSize = getEntitySize(button, 34, 16);
    const portalSize = getEntitySize(portal, 50, 50);
    return [
      `const wpBtn_${index} = new Button(${button.x}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
      `const wpPortal_${index} = new Portal(${portal.x}, ${portal.y}, ${portalSize.w}, ${portalSize.h});`,
      `this._wpSys_${index} = new BtnWirePortalSystem({ button: wpBtn_${index}, portal: wpPortal_${index} });`,
      `this.entities.add(wpBtn_${index});`,
      `this.entities.add(wpPortal_${index});`,
      `this.entities.add(new WireRenderer(this._wpSys_${index}));`,
    ];
  });
}

function createSingleRoomButtonPlatformLines(records) {
  const items = records.filter(
    (record) => record.tool === EntityTool.BTN_PLATFORM,
  );
  return items.flatMap((record, index) => {
    const button = record.gameEntity;
    const platforms = record.platformEntities || [];
    const links = record.platformLinks || [];
    const buttonSize = getEntitySize(button, 34, 16);
    const lines = [
      `const bpBtn_${index} = new Button(${button.x}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
    ];
    const platformRefs = [];

    platforms.forEach((platform, platformIndex) => {
      const size = getEntitySize(platform, 160, 30);
      const ref = `bpPlat_${index}_${platformIndex}`;
      const mode = links[platformIndex]?.mode || "disappear";
      platformRefs.push(`{ platform: ${ref}, mode: ${toCodeString(mode)} }`);
      lines.push(
        `const ${ref} = new Platform(${platform.x}, ${platform.y}, ${size.w}, ${size.h});`,
      );
    });

    lines.push(
      `this._bpSys_${index} = new ButtonPlatformLinkSystem({ button: bpBtn_${index}, platforms: [${platformRefs.join(", ")}] }, this.collisionSystem, { startColorIndex: ${record.startColorIndex ?? index} });`,
    );
    lines.push(`this.entities.add(bpBtn_${index});`);
    platforms.forEach((_platform, platformIndex) => {
      lines.push(`this.entities.add(bpPlat_${index}_${platformIndex});`);
    });
    return lines;
  });
}

function createSingleRoomConstructor(
  records,
  spawn,
  canvasWidth,
  canvasHeight,
) {
  const constructorLines = [
    'this.bgAssetKey = "bgImageDemo2Level";',
    "",
    `this.entities.add(new Wall(-100, 0, 120, ${canvasHeight}));`,
    `this.entities.add(new Wall(${canvasWidth - 20}, 0, 120, ${canvasHeight}));`,
    "this.entities.add(new Ground(0, 0, p.width, 80));",
  ];

  const normalSections = createSingleRoomNormalSections(records);
  for (const section of normalSections) {
    constructorLines.push("");
    constructorLines.push(`// ${section.title}`);
    constructorLines.push(...section.lines);
  }

  const btnSpikeLines = createSingleRoomButtonSpikeLines(records);
  if (btnSpikeLines.length > 0) {
    constructorLines.push("");
    constructorLines.push("// ButtonSpikeLinkSystem");
    constructorLines.push(...btnSpikeLines);
  }

  const wirePortalLines = createSingleRoomWirePortalLines(records);
  if (wirePortalLines.length > 0) {
    constructorLines.push("");
    constructorLines.push("// BtnWirePortalSystem");
    constructorLines.push(...wirePortalLines);
  }

  constructorLines.push("");
  constructorLines.push("// Player");
  constructorLines.push(
    `this._player = new Player(${spawn.x}, ${spawn.y}, ${spawn.w}, ${spawn.h});`,
  );
  constructorLines.push("this._player.createListeners();");
  constructorLines.push("this.entities.add(this._player);");
  constructorLines.push(
    "this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });",
  );

  const btnPlatformLines = createSingleRoomButtonPlatformLines(records);
  if (btnPlatformLines.length > 0) {
    constructorLines.push("");
    constructorLines.push("// ButtonPlatformLinkSystem");
    constructorLines.push(...btnPlatformLines);
  }

  return constructorLines;
}

function createUpdatePhysicsLines(records) {
  const tools = new Set(records.map((record) => record.tool));
  const lines = ["super.updatePhysics();"];
  let hasSystems = false;

  if (tools.has(EntityTool.BTN_SPIKE)) {
    records
      .filter((record) => record.tool === EntityTool.BTN_SPIKE)
      .forEach((_record, index) => {
        lines.push(`this._bsSys_${index}?.update();`);
        hasSystems = true;
      });
  }

  if (tools.has(EntityTool.WIRE_PORTAL)) {
    records
      .filter((record) => record.tool === EntityTool.WIRE_PORTAL)
      .forEach((_record, index) => {
        lines.push(`this._wpSys_${index}?.update();`);
        hasSystems = true;
      });
  }

  if (tools.has(EntityTool.BTN_PLATFORM)) {
    records
      .filter((record) => record.tool === EntityTool.BTN_PLATFORM)
      .forEach((_record, index) => {
        lines.push(`this._bpSys_${index}?.update();`);
        hasSystems = true;
      });
  }

  return hasSystems ? lines : [];
}

function createDrawLines(records) {
  const buttonPlatformItems = records.filter(
    (record) => record.tool === EntityTool.BTN_PLATFORM,
  );
  if (buttonPlatformItems.length === 0) {
    return [];
  }

  const lines = ["super.draw(p);"];
  buttonPlatformItems.forEach((_record, index) => {
    lines.push(`this._bpSys_${index}?.draw?.(p);`);
  });
  return lines;
}

function createRoomBucket(roomIndex) {
  return {
    roomIndex,
    preLines: [],
    entityRefs: [],
    normalRecords: [],
    wirePortalRecords: [],
    btnSpikeRecords: [],
    btnPlatformRecords: [],
  };
}

function buildRoomBuckets(records, roomCount, canvasWidth) {
  const buckets = Array.from({ length: roomCount }, (_, roomIndex) =>
    createRoomBucket(roomIndex),
  );

  records.forEach((record) => {
    const sourceEntity = record.gameEntity;
    const roomIndex = getRoomIndexFromX(sourceEntity.x, roomCount, canvasWidth);
    const bucket = buckets[roomIndex];

    if (record.tool === EntityTool.WIRE_PORTAL) {
      bucket.wirePortalRecords.push(record);
      return;
    }
    if (record.tool === EntityTool.BTN_SPIKE) {
      bucket.btnSpikeRecords.push(record);
      return;
    }
    if (record.tool === EntityTool.BTN_PLATFORM) {
      bucket.btnPlatformRecords.push(record);
      return;
    }

    bucket.normalRecords.push(record);
  });

  return buckets;
}

function createRoomEntityLines(bucket, roomCount, canvasWidth, canvasHeight) {
  const hasLeftExit = bucket.roomIndex > 0;
  const hasRightExit = bucket.roomIndex < roomCount - 1;

  if (!hasLeftExit) {
    bucket.entityRefs.push(`new Wall(-100, 0, 120, ${canvasHeight})`);
  }
  if (!hasRightExit) {
    bucket.entityRefs.push(
      `new Wall(${canvasWidth - 20}, 0, 120, ${canvasHeight})`,
    );
  }
  bucket.entityRefs.push("new Ground(0, 0, p.width, 80)");

  for (const tool of NORMAL_TOOL_ORDER) {
    for (const record of bucket.normalRecords) {
      if (record.tool !== tool) {
        continue;
      }

      const entity = record.gameEntity;
      const localX = getLocalX(entity.x, bucket.roomIndex, canvasWidth);

      switch (record.tool) {
        case EntityTool.GROUND:
        case EntityTool.PLATFORM:
        case EntityTool.SPIKE:
        case EntityTool.WALL:
        case EntityTool.BOX:
          bucket.entityRefs.push(
            `new ${TOOL_LABELS[record.tool]}(${localX}, ${entity.y}, ${entity.collider.w}, ${entity.collider.h})`,
          );
          break;

        case EntityTool.PORTAL: {
          const ref = `room${bucket.roomIndex}Portal_${bucket.entityRefs.length}`;
          const { w, h } = getEntitySize(entity, 50, 50);
          bucket.preLines.push(
            `const ${ref} = new Portal(${localX}, ${entity.y}, ${w}, ${h});`,
          );
          bucket.preLines.push(`${ref}.openPortal();`);
          bucket.entityRefs.push(ref);
          break;
        }

        case EntityTool.NPC: {
          const { w, h } = getEntitySize(entity, 40, 40);
          bucket.entityRefs.push(
            `new NPCDemo2(${localX}, ${entity.y}, ${w}, ${h}, { getPlayer: () => this._player, eventBus: this.eventBus, npcId: ${toCodeString("todo_npc_id")}, dialogueLines: [${toCodeString("todo_npc_line_1")}, ${toCodeString("todo_npc_line_2")}], exhaustedLine: ${toCodeString("todo_npc_exhausted")} })`,
          );
          break;
        }

        case EntityTool.SIGNBOARD: {
          const { w, h } = getEntitySize(entity, 100, 65);
          bucket.entityRefs.push(
            `new SignboardDemo2(${localX}, ${entity.y}, ${w}, ${h}, () => this._player, this.eventBus, { textKey: ${toCodeString("todo_signboard_text_key")} })`,
          );
          break;
        }

        case EntityTool.TEXT_PROMPT: {
          const config = getTextPromptConfig(entity);
          bucket.entityRefs.push(
            `new TextPrompt(${localX}, ${entity.y}, this, { textKey: ${toCodeString(config.textKey)}, width: ${config.width}, height: ${config.height}, textSize: ${config.textSize}, lineHeight: ${config.lineHeight} })`,
          );
          break;
        }

        case EntityTool.CHECKPOINT: {
          const { w, h } = getEntitySize(entity, 40, 70);
          bucket.entityRefs.push(
            `new CheckpointDemo2(${localX}, ${entity.y}, ${w}, ${h}, () => this._player)`,
          );
          break;
        }

        case EntityTool.TELEPORT_POINT: {
          const { w, h } = getEntitySize(entity, 40, 70);
          bucket.entityRefs.push(
            `new TeleportPoint(${localX}, ${entity.y}, ${w}, ${h}, () => this._player)`,
          );
          break;
        }

        case EntityTool.ENEMY: {
          const { w, h } = getEntitySize(entity, 40, 40);
          const speed = entity?._speed ?? 2;
          const direction = record.direction ?? entity?._direction ?? 1;
          const ref = `room${bucket.roomIndex}Enemy_${bucket.entityRefs.length}`;
          bucket.preLines.push(
            `const ${ref} = new Enemy(${localX}, ${entity.y}, ${w}, ${h}, { speed: ${speed} });`,
          );
          bucket.preLines.push(`${ref}._direction = ${direction};`);
          bucket.entityRefs.push(ref);
          break;
        }

        default:
          break;
      }
    }
  }

  bucket.btnSpikeRecords.forEach((record, indexInRoom) => {
    const globalIndex = recordsIndexByTool(
      bucket.btnSpikeRecords,
      record,
      indexInRoom,
      "bs",
    );
    const button = record.gameEntity;
    const spike = record.spikeEntity;
    const buttonSize = getEntitySize(button, 34, 16);
    const spikeSize = getEntitySize(spike, 100, 20);
    bucket.preLines.push(
      `this._bsBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
    );
    bucket.preLines.push(
      `this._bsSpike_${globalIndex} = new Spike(${getLocalX(spike.x, bucket.roomIndex, canvasWidth)}, ${spike.y}, ${spikeSize.w}, ${spikeSize.h});`,
    );
    bucket.entityRefs.push(`this._bsBtn_${globalIndex}`);
    bucket.entityRefs.push(`this._bsSpike_${globalIndex}`);
  });

  bucket.wirePortalRecords.forEach((record, indexInRoom) => {
    const globalIndex = recordsIndexByTool(
      bucket.wirePortalRecords,
      record,
      indexInRoom,
      "wp",
    );
    const button = record.gameEntity;
    const portal = record.portalEntity;
    const buttonSize = getEntitySize(button, 34, 16);
    const portalSize = getEntitySize(portal, 50, 50);
    bucket.preLines.push(
      `this._wpBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
    );
    bucket.preLines.push(
      `this._wpPortal_${globalIndex} = new Portal(${getLocalX(portal.x, bucket.roomIndex, canvasWidth)}, ${portal.y}, ${portalSize.w}, ${portalSize.h});`,
    );
    bucket.entityRefs.push(`this._wpBtn_${globalIndex}`);
    bucket.entityRefs.push(`this._wpPortal_${globalIndex}`);
  });

  bucket.btnPlatformRecords.forEach((record, indexInRoom) => {
    const globalIndex = recordsIndexByTool(
      bucket.btnPlatformRecords,
      record,
      indexInRoom,
      "bp",
    );
    const button = record.gameEntity;
    const platforms = record.platformEntities || [];
    const buttonSize = getEntitySize(button, 34, 16);
    bucket.preLines.push(
      `this._bpBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
    );
    bucket.entityRefs.push(`this._bpBtn_${globalIndex}`);

    platforms.forEach((platform, platformIndex) => {
      const size = getEntitySize(platform, 160, 30);
      bucket.preLines.push(
        `this._bpPlat_${globalIndex}_${platformIndex} = new Platform(${getLocalX(platform.x, bucket.roomIndex, canvasWidth)}, ${platform.y}, ${size.w}, ${size.h});`,
      );
      bucket.entityRefs.push(`this._bpPlat_${globalIndex}_${platformIndex}`);
    });
  });
}

function recordsIndexByTool(_records, _record, fallbackIndex, prefix) {
  return `${prefix === "bs" ? "" : ""}${fallbackIndex}`;
}

function createRoomDefinitions(records, roomCount, canvasWidth, canvasHeight) {
  const buckets = buildRoomBuckets(records, roomCount, canvasWidth);
  const btnSpikeItems = records.filter(
    (record) => record.tool === EntityTool.BTN_SPIKE,
  );
  const wirePortalItems = records.filter(
    (record) => record.tool === EntityTool.WIRE_PORTAL,
  );
  const btnPlatformItems = records.filter(
    (record) => record.tool === EntityTool.BTN_PLATFORM,
  );

  const btnSpikeIndexMap = new Map(
    btnSpikeItems.map((record, index) => [record, index]),
  );
  const wirePortalIndexMap = new Map(
    wirePortalItems.map((record, index) => [record, index]),
  );
  const btnPlatformIndexMap = new Map(
    btnPlatformItems.map((record, index) => [record, index]),
  );

  buckets.forEach((bucket) => {
    const hasLeftExit = bucket.roomIndex > 0;
    const hasRightExit = bucket.roomIndex < roomCount - 1;

    if (!hasLeftExit) {
      bucket.entityRefs.push(`new Wall(-100, 0, 120, ${canvasHeight})`);
    }
    if (!hasRightExit) {
      bucket.entityRefs.push(
        `new Wall(${canvasWidth - 20}, 0, 120, ${canvasHeight})`,
      );
    }
    bucket.entityRefs.push("new Ground(0, 0, p.width, 80)");

    for (const tool of NORMAL_TOOL_ORDER) {
      for (const record of bucket.normalRecords) {
        if (record.tool !== tool) {
          continue;
        }

        const entity = record.gameEntity;
        const localX = getLocalX(entity.x, bucket.roomIndex, canvasWidth);

        switch (record.tool) {
          case EntityTool.GROUND:
          case EntityTool.PLATFORM:
          case EntityTool.SPIKE:
          case EntityTool.WALL:
          case EntityTool.BOX:
            bucket.entityRefs.push(
              `new ${TOOL_LABELS[record.tool]}(${localX}, ${entity.y}, ${entity.collider.w}, ${entity.collider.h})`,
            );
            break;

          case EntityTool.PORTAL: {
            const ref = `room${bucket.roomIndex}Portal_${bucket.entityRefs.length}`;
            const { w, h } = getEntitySize(entity, 50, 50);
            bucket.preLines.push(
              `const ${ref} = new Portal(${localX}, ${entity.y}, ${w}, ${h});`,
            );
            bucket.preLines.push(`${ref}.openPortal();`);
            bucket.entityRefs.push(ref);
            break;
          }

          case EntityTool.NPC: {
            const { w, h } = getEntitySize(entity, 40, 40);
            bucket.entityRefs.push(
              `new NPCDemo2(${localX}, ${entity.y}, ${w}, ${h}, { getPlayer: () => this._player, eventBus: this.eventBus, npcId: ${toCodeString("todo_npc_id")}, dialogueLines: [${toCodeString("todo_npc_line_1")}, ${toCodeString("todo_npc_line_2")}], exhaustedLine: ${toCodeString("todo_npc_exhausted")} })`,
            );
            break;
          }

          case EntityTool.SIGNBOARD: {
            const { w, h } = getEntitySize(entity, 100, 65);
            bucket.entityRefs.push(
              `new SignboardDemo2(${localX}, ${entity.y}, ${w}, ${h}, () => this._player, this.eventBus, { textKey: ${toCodeString("todo_signboard_text_key")} })`,
            );
            break;
          }

          case EntityTool.TEXT_PROMPT: {
            const config = getTextPromptConfig(entity);
            bucket.entityRefs.push(
              `new TextPrompt(${localX}, ${entity.y}, this, { textKey: ${toCodeString(config.textKey)}, width: ${config.width}, height: ${config.height}, textSize: ${config.textSize}, lineHeight: ${config.lineHeight} })`,
            );
            break;
          }

          case EntityTool.CHECKPOINT: {
            const { w, h } = getEntitySize(entity, 40, 70);
            bucket.entityRefs.push(
              `new CheckpointDemo2(${localX}, ${entity.y}, ${w}, ${h}, () => this._player)`,
            );
            break;
          }

          case EntityTool.TELEPORT_POINT: {
            const { w, h } = getEntitySize(entity, 40, 70);
            bucket.entityRefs.push(
              `new TeleportPoint(${localX}, ${entity.y}, ${w}, ${h}, () => this._player)`,
            );
            break;
          }

          case EntityTool.ENEMY: {
            const { w, h } = getEntitySize(entity, 40, 40);
            const speed = entity?._speed ?? 2;
            const direction = record.direction ?? entity?._direction ?? 1;
            const ref = `room${bucket.roomIndex}Enemy_${bucket.entityRefs.length}`;
            bucket.preLines.push(
              `const ${ref} = new Enemy(${localX}, ${entity.y}, ${w}, ${h}, { speed: ${speed} });`,
            );
            bucket.preLines.push(`${ref}._direction = ${direction};`);
            bucket.entityRefs.push(ref);
            break;
          }

          default:
            break;
        }
      }
    }

    bucket.btnSpikeRecords.forEach((record) => {
      const globalIndex = btnSpikeIndexMap.get(record);
      const button = record.gameEntity;
      const spike = record.spikeEntity;
      const buttonSize = getEntitySize(button, 34, 16);
      const spikeSize = getEntitySize(spike, 100, 20);
      bucket.preLines.push(
        `this._bsBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
      );
      bucket.preLines.push(
        `this._bsSpike_${globalIndex} = new Spike(${getLocalX(spike.x, bucket.roomIndex, canvasWidth)}, ${spike.y}, ${spikeSize.w}, ${spikeSize.h});`,
      );
      bucket.entityRefs.push(`this._bsBtn_${globalIndex}`);
      bucket.entityRefs.push(`this._bsSpike_${globalIndex}`);
    });

    bucket.wirePortalRecords.forEach((record) => {
      const globalIndex = wirePortalIndexMap.get(record);
      const button = record.gameEntity;
      const portal = record.portalEntity;
      const buttonSize = getEntitySize(button, 34, 16);
      const portalSize = getEntitySize(portal, 50, 50);
      bucket.preLines.push(
        `this._wpBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
      );
      bucket.preLines.push(
        `this._wpPortal_${globalIndex} = new Portal(${getLocalX(portal.x, bucket.roomIndex, canvasWidth)}, ${portal.y}, ${portalSize.w}, ${portalSize.h});`,
      );
      bucket.entityRefs.push(`this._wpBtn_${globalIndex}`);
      bucket.entityRefs.push(`this._wpPortal_${globalIndex}`);
    });

    bucket.btnPlatformRecords.forEach((record) => {
      const globalIndex = btnPlatformIndexMap.get(record);
      const button = record.gameEntity;
      const platforms = record.platformEntities || [];
      const buttonSize = getEntitySize(button, 34, 16);
      bucket.preLines.push(
        `this._bpBtn_${globalIndex} = new Button(${getLocalX(button.x, bucket.roomIndex, canvasWidth)}, ${button.y}, ${buttonSize.w}, ${buttonSize.h});`,
      );
      bucket.entityRefs.push(`this._bpBtn_${globalIndex}`);

      platforms.forEach((platform, platformIndex) => {
        const size = getEntitySize(platform, 160, 30);
        bucket.preLines.push(
          `this._bpPlat_${globalIndex}_${platformIndex} = new Platform(${getLocalX(platform.x, bucket.roomIndex, canvasWidth)}, ${platform.y}, ${size.w}, ${size.h});`,
        );
        bucket.entityRefs.push(`this._bpPlat_${globalIndex}_${platformIndex}`);
      });
    });
  });

  return { buckets, btnSpikeItems, wirePortalItems, btnPlatformItems };
}

function createBuildRoomsMethod(records, roomCount, canvasWidth, canvasHeight) {
  const { buckets } = createRoomDefinitions(
    records,
    roomCount,
    canvasWidth,
    canvasHeight,
  );
  const lines = [];

  buckets.forEach((bucket) => {
    if (lines.length > 0) {
      lines.push("");
    }

    if (bucket.preLines.length > 0) {
      lines.push(...bucket.preLines);
      lines.push("");
    }

    lines.push(`const room${bucket.roomIndex} = new Room([`);
    bucket.entityRefs.forEach((entityRef) => {
      lines.push(`${INDENT}${entityRef},`);
    });

    const exitParts = [];
    if (bucket.roomIndex > 0) {
      exitParts.push(`left: { targetRoomIndex: ${bucket.roomIndex - 1} }`);
    }
    if (bucket.roomIndex < roomCount - 1) {
      exitParts.push(`right: { targetRoomIndex: ${bucket.roomIndex + 1} }`);
    }

    lines.push(`], { ${exitParts.join(", ")} });`);
  });

  lines.push("");
  lines.push(
    `return [${Array.from({ length: roomCount }, (_, index) => `room${index}`).join(", ")}];`,
  );
  return lines;
}

function createMultiRoomConstructor(
  records,
  spawn,
  roomCount,
  canvasWidth,
  canvasHeight,
) {
  const { buckets, btnSpikeItems, wirePortalItems, btnPlatformItems } =
    createRoomDefinitions(records, roomCount, canvasWidth, canvasHeight);
  const wirePortalIndexMap = new Map(
    wirePortalItems.map((record, index) => [record, index]),
  );

  const lines = [
    'this.bgAssetKey = "bgImageDemo2Level";',
    "this.rooms = this._buildRooms(p);",
    "this._applyWorldOffsetsToRooms(p);",
  ];

  if (btnSpikeItems.length > 0) {
    lines.push("");
    lines.push("// ButtonSpikeLinkSystem");
    btnSpikeItems.forEach((record, index) => {
      lines.push(
        `this._bsSys_${index} = new ButtonSpikeLinkSystem({ button: this._bsBtn_${index}, spikes: [this._bsSpike_${index}] }, { startColorIndex: ${record.startColorIndex ?? index} });`,
      );
    });
  }

  if (wirePortalItems.length > 0) {
    lines.push("");
    lines.push("// BtnWirePortalSystem");
    wirePortalItems.forEach((record, index) => {
      const roomIndex = buckets.findIndex((bucket) =>
        bucket.wirePortalRecords.includes(record),
      );
      lines.push(
        `this._wpSys_${index} = new BtnWirePortalSystem({ button: this._wpBtn_${index}, portal: this._wpPortal_${index} });`,
      );
      lines.push(
        `this.rooms[${roomIndex}].entities.add(new WireRenderer(this._wpSys_${index}));`,
      );
    });
  }

  lines.push("");
  lines.push("// Player");
  lines.push(
    `this._player = new Player(${spawn.x}, ${spawn.y}, ${spawn.w}, ${spawn.h});`,
  );
  lines.push("this._player.createListeners();");
  lines.push("this.entities = this._buildEntities();");
  lines.push(
    "this.initSystems(this._player, 5000, { uiClass: Demo2RecordUI });",
  );

  if (btnPlatformItems.length > 0) {
    lines.push("");
    lines.push("// ButtonPlatformLinkSystem");
    btnPlatformItems.forEach((record, index) => {
      const platformLinks = record.platformLinks || [];
      const platformRefs = (record.platformEntities || [])
        .map((_, platformIndex) => {
          const mode = platformLinks[platformIndex]?.mode || "disappear";
          return `{ platform: this._bpPlat_${index}_${platformIndex}, mode: ${toCodeString(mode)} }`;
        })
        .join(", ");
      lines.push(
        `this._bpSys_${index} = new ButtonPlatformLinkSystem({ button: this._bpBtn_${index}, platforms: [${platformRefs}] }, this.collisionSystem, { startColorIndex: ${record.startColorIndex ?? index} });`,
      );
    });
  }

  return lines;
}

function createMultiRoomMethods(records, roomCount, canvasWidth, canvasHeight) {
  return {
    buildRooms: createBuildRoomsMethod(
      records,
      roomCount,
      canvasWidth,
      canvasHeight,
    ),
    buildEntities: [
      "const entities = new Set();",
      "for (const room of this.rooms) {",
      `${INDENT}for (const entity of room.entities) {`,
      `${INDENT.repeat(2)}entities.add(entity);`,
      `${INDENT}}`,
      "}",
      "if (this._player) {",
      `${INDENT}entities.add(this._player);`,
      "}",
      "return entities;",
    ],
    applyWorldOffsets: [
      "for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {",
      `${INDENT}const offsetX = roomIndex * ${canvasWidth};`,
      `${INDENT}for (const entity of this.rooms[roomIndex].entities) {`,
      `${INDENT.repeat(2)}entity.x += offsetX;`,
      `${INDENT}}`,
      "}",
    ],
  };
}

export class EditorExporter {
  static normalizeLevelClassName(levelClassName = "LevelX") {
    let normalized = String(levelClassName || "").trim();
    if (!normalized) {
      normalized = "LevelX";
    }
    if (normalized.toLowerCase().endsWith(".js")) {
      normalized = normalized.slice(0, -3);
    }
    return normalized || "LevelX";
  }

  /**
   * Serialize editor records to user-level JSON format
   * @param {import('./EditorEntityManager.js').PlacedRecord[]} records
   * @param {number} [roomCount=1]
   * @param {number} [canvasWidth=1366]
   * @param {number} [canvasHeight=768]
   * @param {object} [spawn] - { x, y, w, h }
   * @param {object} [meta] - { title, authorName }
   * @returns {string} JSON string
   */
  static generateJSON(
    records,
    roomCount = 1,
    canvasWidth = 1366,
    canvasHeight = 768,
    spawn = null,
    meta = {},
  ) {
    const normalizedSpawn = getSpawn(spawn);
    const levelId = `level_${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Build entity array | 构建实体数组
    const entities = [];
    const entityIndexMap = new Map(); // track positions for room mapping | 追踪房间映射位置

    records.forEach((record, recordIndex) => {
      const entity = record.gameEntity;
      let entityObj = null;

      switch (record.tool) {
        case EntityTool.GROUND:
        case EntityTool.PLATFORM:
        case EntityTool.WALL:
        case EntityTool.BOX:
          entityObj = {
            type: TOOL_LABELS[record.tool],
            x: entity.x,
            y: entity.y,
            w: entity.collider.w,
            h: entity.collider.h,
          };
          break;

        case EntityTool.SPIKE:
          entityObj = {
            type: "Spike",
            x: entity.x,
            y: entity.y,
            w: entity.collider.w,
            h: entity.collider.h,
          };
          break;

        case EntityTool.PORTAL: {
          const { w, h } = getEntitySize(entity, 50, 50);
          entityObj = {
            type: "Portal",
            x: entity.x,
            y: entity.y,
            w,
            h,
            open: !!entity.isOpen,
          };
          break;
        }

        case EntityTool.CHECKPOINT: {
          const { w, h } = getEntitySize(entity, 40, 70);
          entityObj = {
            type: "Checkpoint",
            x: entity.x,
            y: entity.y,
            w,
            h,
          };
          break;
        }

        case EntityTool.TELEPORT_POINT: {
          const { w, h } = getEntitySize(entity, 40, 70);
          entityObj = {
            type: "TeleportPoint",
            x: entity.x,
            y: entity.y,
            w,
            h,
          };
          break;
        }

        case EntityTool.TEXT_PROMPT: {
          const { w, h } = getEntitySize(entity, 40, 40);
          entityObj = {
            type: "TextPrompt",
            x: entity.x,
            y: entity.y,
            w,
            h,
            text: entity.textKey || entity.text || "todo",
          };
          break;
        }

        case EntityTool.ENEMY: {
          const { w, h } = getEntitySize(entity, 40, 40);
          const speed = entity?._speed ?? 2;
          const direction = record.direction ?? entity?._direction ?? 1;
          entityObj = {
            type: "Enemy",
            x: entity.x,
            y: entity.y,
            w,
            h,
            speed,
            direction,
          };
          break;
        }

        case EntityTool.NPC: {
          const { w, h } = getEntitySize(entity, 40, 40);
          entityObj = {
            type: "NPCDemo2",
            x: entity.x,
            y: entity.y,
            w,
            h,
            npcId: "",
            dialogueLines: [],
            exhaustedLine: "",
          };
          break;
        }

        case EntityTool.SIGNBOARD: {
          const { w, h } = getEntitySize(entity, 100, 65);
          entityObj = {
            type: "SignboardDemo2",
            x: entity.x,
            y: entity.y,
            w,
            h,
            textKey: "",
          };
          break;
        }

        case EntityTool.BTN_SPIKE: {
          const button = record.gameEntity;
          const spike = record.spikeEntity;
          const buttonSize = getEntitySize(button, 34, 16);
          const spikeSize = getEntitySize(spike, 100, 20);
          entityObj = {
            type: "BtnSpike",
            button: {
              x: button.x,
              y: button.y,
              w: buttonSize.w,
              h: buttonSize.h,
            },
            spike: {
              x: spike.x,
              y: spike.y,
              w: spikeSize.w,
              h: spikeSize.h,
            },
            colorIndex: record.startColorIndex ?? recordIndex,
          };
          break;
        }

        case EntityTool.WIRE_PORTAL: {
          const button = record.gameEntity;
          const portal = record.portalEntity;
          const buttonSize = getEntitySize(button, 34, 16);
          const portalSize = getEntitySize(portal, 50, 50);
          entityObj = {
            type: "WirePortal",
            button: {
              x: button.x,
              y: button.y,
              w: buttonSize.w,
              h: buttonSize.h,
            },
            portal: {
              x: portal.x,
              y: portal.y,
              w: portalSize.w,
              h: portalSize.h,
            },
            colorIndex: record.startColorIndex ?? recordIndex,
          };
          break;
        }

        case EntityTool.BTN_PLATFORM: {
          const button = record.gameEntity;
          const platforms = record.platformEntities || [];
          const platformLinks = record.platformLinks || [];
          const buttonSize = getEntitySize(button, 34, 16);
          const platformConfigs = platforms.map((platform, platformIndex) => {
            const size = getEntitySize(platform, 160, 30);
            const mode = platformLinks[platformIndex]?.mode || "disappear";
            return {
              x: platform.x,
              y: platform.y,
              w: size.w,
              h: size.h,
              mode,
            };
          });
          entityObj = {
            type: "BtnPlatform",
            button: {
              x: button.x,
              y: button.y,
              w: buttonSize.w,
              h: buttonSize.h,
            },
            platforms: platformConfigs,
            colorIndex: record.startColorIndex ?? recordIndex,
          };
          break;
        }

        default:
          console.warn(
            `[EditorExporter.generateJSON] Unsupported tool: ${record.tool}`,
          );
          return;
      }

      if (entityObj) {
        entityIndexMap.set(recordIndex, entities.length);
        entities.push(entityObj);
      }
    });

    // Build rooms array for multi-room levels | 为多房间级别构建房间数组
    let roomsArray = null;
    if (roomCount > 1) {
      const roomBuckets = buildRoomBuckets(records, roomCount, canvasWidth);
      roomsArray = roomBuckets.map((bucket, roomIndex) => {
        const entityIndices = [];
        records.forEach((record, recordIndex) => {
          if (entityIndexMap.has(recordIndex)) {
            // Check if record belongs to this room | 检查记录是否属于此房间
            const sourceEntity = record.gameEntity;
            const recordRoomIndex = getRoomIndexFromX(
              sourceEntity.x,
              roomCount,
              canvasWidth,
            );
            if (recordRoomIndex === roomIndex) {
              entityIndices.push(entityIndexMap.get(recordIndex));
            }
          }
        });
        return { roomIndex, entityIndices };
      });
    }

    // Build final JSON structure | 构建最终 JSON 结构
    const levelData = {
      meta: {
        id: levelId,
        title: meta.title || "Untitled Level",
        authorName: meta.authorName || "Anonymous",
        createdAt,
      },
      roomCount,
      canvasWidth,
      canvasHeight,
      spawn: normalizedSpawn,
      entities,
    };

    if (roomsArray) {
      levelData.rooms = roomsArray;
    }

    return JSON.stringify(levelData, null, 2);
  }

  /**
   * Convert placement records to code string
   * @param {import('./EditorEntityManager.js').PlacedRecord[]} records
   * @returns {string}
   */
  static generateCode(
    records,
    roomCount = 2,
    canvasWidth = 800,
    canvasHeight = 600,
    spawn = null,
    levelClassName = "LevelX",
  ) {
    const levelName = EditorExporter.normalizeLevelClassName(levelClassName);
    const normalizedSpawn = getSpawn(spawn);
    const entityImports = getEntityImportList(records);
    const systemImports = getSystemImports(records);
    const updatePhysicsLines = createUpdatePhysicsLines(records);
    const drawLines = createDrawLines(records);
    const lines = [];

    lines.push("import {");
    entityImports.forEach((name) => {
      lines.push(`${INDENT}${name},`);
    });
    lines.push('} from "../../game-entity-model/index.js";');
    lines.push('import { BaseLevel } from "../BaseLevel.js";');
    lines.push(
      'import { Demo2RecordUI } from "../../record-system/Demo2RecordUI.js";',
    );
    if (roomCount > 1) {
      lines.push('import { Room } from "../Room.js";');
    }
    systemImports.forEach((item) => {
      lines.push(`import { ${item.name} } from "${item.path}";`);
    });
    lines.push("");
    lines.push(`export class ${levelName} extends BaseLevel {`);
    lines.push(`${INDENT}constructor(p, eventBus) {`);
    lines.push(`${INDENT.repeat(2)}super(p, eventBus);`);

    const constructorLines =
      roomCount > 1
        ? createMultiRoomConstructor(
            records,
            normalizedSpawn,
            roomCount,
            canvasWidth,
            canvasHeight,
          )
        : createSingleRoomConstructor(
            records,
            normalizedSpawn,
            canvasWidth,
            canvasHeight,
          );
    lines.push(...createIndentedLines(INDENT.repeat(2), constructorLines));
    lines.push(`${INDENT}}`);

    if (roomCount > 1) {
      const multiRoomMethods = createMultiRoomMethods(
        records,
        roomCount,
        canvasWidth,
        canvasHeight,
      );
      lines.push("");
      lines.push(`${INDENT}_buildRooms(p) {`);
      lines.push(
        ...createIndentedLines(INDENT.repeat(2), multiRoomMethods.buildRooms),
      );
      lines.push(`${INDENT}}`);
      lines.push("");
      lines.push(`${INDENT}_buildEntities() {`);
      lines.push(
        ...createIndentedLines(
          INDENT.repeat(2),
          multiRoomMethods.buildEntities,
        ),
      );
      lines.push(`${INDENT}}`);
      lines.push("");
      lines.push(`${INDENT}_applyWorldOffsetsToRooms(p) {`);
      lines.push(
        ...createIndentedLines(
          INDENT.repeat(2),
          multiRoomMethods.applyWorldOffsets,
        ),
      );
      lines.push(`${INDENT}}`);
    }

    if (updatePhysicsLines.length > 0) {
      lines.push("");
      lines.push(`${INDENT}updatePhysics() {`);
      lines.push(...createIndentedLines(INDENT.repeat(2), updatePhysicsLines));
      lines.push(`${INDENT}}`);
    }

    if (drawLines.length > 0) {
      lines.push("");
      lines.push(`${INDENT}draw(p) {`);
      lines.push(...createIndentedLines(INDENT.repeat(2), drawLines));
      lines.push(`${INDENT}}`);
    }

    lines.push("}");
    return `${lines.join("\n")}\n`;
  }

  /**
   * Generate code and copy to clipboard
   * @param {import('./EditorEntityManager.js').PlacedRecord[]} records
   * @returns {Promise<string>} Generated code
   */
  static async copyToClipboard(
    records,
    roomCount = 2,
    canvasWidth = 800,
    canvasHeight = 600,
    spawn = null,
    levelClassName = "LevelX",
  ) {
    const code = EditorExporter.generateCode(
      records,
      roomCount,
      canvasWidth,
      canvasHeight,
      spawn,
      levelClassName,
    );
    try {
      await navigator.clipboard.writeText(code);
    } catch (_e) {
      // Fallback: use legacy API
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    return code;
  }
}
