/**
 * Room — 多房间关卡系统中单个屏幕/房间的数据模型。
 *
 * 用法：
 *   const room = new Room(entities, {
 *     right:  { targetRoomIndex: 1, spawnX: 30,   spawnY: 80 },
 *     left:   null,   // 该方向无出口（当作实体墙处理）
 *     top:    null,
 *     bottom: null,
 *   });
 *
 * 注意事项：
 *   - entities 只放静态物件（Ground / Wall / Spike / Platform 等）
 *   - 不要把 Player / Replayer 放进 entities，它们由 Level 统一管理
 *   - 哪条边有出口，就不要在那条边放 Wall，否则玩家永远碰不到边界触发切换
 *   - exits 的 y 轴方向与 p5 坐标一致（系统已翻转 y 轴）：
 *       top    → 玩家 y + h > p.height（视觉上方）
 *       bottom → 玩家 y < 0           （视觉下方 / 掉出地面）
 *       right  → 玩家 x + w > p.width
 *       left   → 玩家 x < 0
 */
export class Room {
    /**
     * @param {Iterable} entities  — 该房间的静态实体（Set 或数组）
     * @param {Object}   exits     — 四方向出口配置，缺省 null 表示无出口
     *   每个出口格式：{ targetRoomIndex: number, spawnX: number, spawnY: number }
     */
    constructor(entities, exits = {}) {
        // 存为 Set 副本，防止外部修改影响 Room 内部状态
        this.entities = entities instanceof Set
            ? new Set(entities)
            : new Set(entities);

        this.exits = {
            right:  exits.right  ?? null,
            left:   exits.left   ?? null,
            top:    exits.top    ?? null,
            bottom: exits.bottom ?? null,
        };
    }
}
