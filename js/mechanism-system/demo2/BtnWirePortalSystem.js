// BtnWirePortalSystem.js | 按鹁-电线-传送游機联动系统
// Button-wire-portal linkage system
// 按鹁-电线-传送游機联动系统
// Hold button to charge → electric current propagates from button (start) to portal (end) → gate opens
// 按住按鹁充电 → 电流从按鹁（起点）传播到传送游機（终点） → 门打开
// Release button to discharge → electric current disappears from button end, retreats towards gate → gate closes after discharge completes
// 松开按鹁放电 → 电流从按鹁端开始消失，向传送游機方向退去 → 放电完成后门关闭

export class BtnWirePortalSystem {
  /** 推荐按钮尺寸 */
  static BUTTON_W = 34;
  static BUTTON_H = 16;

  /** Button color scheme: unpressed dark purple, pressed light blue | 按鹁配色方案：未按下深紫色，按下浅蓝色 */
  static BUTTON_COLOR = {
    unpressed: [154, 123, 154], // 深紫色
    pressed: [135, 206, 250], // 浅蓝色
  };

  /**
   * @param {Object} config
   * @param {Button}   config.button     - button entity (need isPressed property) | 按鹁实体（需要 isPressed 属性）
   * @param {Portal}   config.portal     - portal entity (need openPortal / isOpen) | 传送游機实体（需要 openPortal / isOpen）
   * @param {Array<{x:number,y:number}>} [config.wirePath] - optional, manually specify wire path; omit to auto-calculate based on button/gate position | 可选，手动指定电线路径；省略时自动根据按鹁/门位置计算
   * @param {Object}  [config.options]
   * @param {number}  [config.options.chargeSpeed=0.04]    - per-frame charge progress increment (0~1) | 每帧充电进度增量 (0~1)
   * @param {number}  [config.options.dischargeSpeed=0.025] - per-frame discharge progress increment (0~1) | 每帧放电进度增量 (0~1)
   * @param {number}  [config.options.wireMargin=50] - wire corner point pixel distance from top of higher entity | 电线拐点距较高实体顶部的像素距离
   */
  constructor({ button, portal, wirePath, options = {} }) {
    this._button = button;
    this._portal = portal;

    // Auto-apply system-exclusive button color scheme | 自动应用系统专属按鹁配色
    this._button.color = BtnWirePortalSystem.BUTTON_COLOR;
    this._button.isWirePortalButton = true;

    // Auto-calculate wire path (or use manually specified) | 自动计算电线路径（或使用手动指定的）
    this._wirePath =
      wirePath || this._buildAutoWirePath(options.wireMargin ?? 50);

    this._chargeSpeed = options.chargeSpeed ?? 0.04;
    this._dischargeSpeed = options.dischargeSpeed ?? 0.025;

    // Dual-progress model | 双进度模型
    this._headProgress = 0; // Electric current front end (0~1) | 电流前端 (0~1)
    this._tailProgress = 0; // Electric current tail (0~1) | 电流尾部 (0~1)

    // State machine: idle / charging / charged / discharging | 状态机：idle / charging / charged / discharging
    this._state = "idle";

    // Animation frame counter | 动画帧计数器
    this._frame = 0;

    // Pre-calculate path total length | 预计算路径总长度
    this._totalLen = 0;
    this._segLens = [];
    const wp = this._wirePath;
    for (let i = 1; i < wp.length; i++) {
      const dx = wp[i].x - wp[i - 1].x;
      const dy = wp[i].y - wp[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      this._segLens.push(len);
      this._totalLen += len;
    }
  }

  // ── 每帧逻辑 ─────────────────────────────────────────────────

  update() {
    const pressed = this._button.isPressed;

    switch (this._state) {
      case "idle":
        if (pressed) {
          this._state = "charging";
          this._tailProgress = 0;
        }
        break;

      case "charging":
        if (pressed) {
          this._headProgress = Math.min(
            1,
            this._headProgress + this._chargeSpeed,
          );
          if (this._headProgress >= 1) {
            this._state = "charged";
            this._openPortal();
          }
        } else {
          // Not fully charged, release button → start discharging (tail disappears from button end) | 整没充满就松开 → 开始放电（尾部从按鹁端开始消失）
          this._state = "discharging";
        }
        break;

      case "charged":
        if (!pressed) {
          // Release → start discharging | 松开 → 开始放电
          this._state = "discharging";
        }
        // 按住期间保持满电、门保持打开
        break;

      case "discharging":
        if (pressed) {
          // Re-press during discharge → resume charging | 放电中途再次按下 → 重新充电
          // Set current tail as new charging start point: reset head=tail, tail=0 | 将当前尾部作为新的充电起点：重置 head=tail, tail=0
          this._headProgress = this._tailProgress;
          this._tailProgress = 0;
          this._state = "charging";
          break;
        }
        this._tailProgress = Math.min(
          this._headProgress,
          this._tailProgress + this._dischargeSpeed,
        );
        if (this._tailProgress >= this._headProgress) {
          // Discharge complete → close gate | 放电完成 → 关办
          this._headProgress = 0;
          this._tailProgress = 0;
          this._state = "idle";
          this._closePortal();
        }
        break;
    }
  }

  // ── 每帧绘制 ─────────────────────────────────────────────────

  draw(p) {
    this._frame++;
    this._drawWire(p);
  }

  // ── Portal 控制 ──────────────────────────────────────────────
  /**
   * 自动计算电线路径：
   * 按钮顶部中心 → 上到拐点高度 → 水平到传送门上方 → 下到传送门顶部中心
   * 拐点高度 = 较高实体的顶部 + margin
   */
  _buildAutoWirePath(margin) {
    const btn = this._button;
    const ptl = this._portal;
    const bx = btn.x + btn.collider.w / 2;
    const by = btn.y + btn.collider.h; // 按钮顶部
    const px = ptl.x + ptl.collider.w / 2;
    const py = ptl.y + ptl.collider.h; // 传送门顶部
    const topY = Math.max(by, py) + margin;
    return [
      { x: bx, y: by },
      { x: bx, y: topY },
      { x: px, y: topY },
      { x: px, y: py },
    ];
  }
  _openPortal() {
    this._portal.isOpen = true;
  }

  _closePortal() {
    this._portal.isOpen = false;
  }

  // ── 重置 ─────────────────────────────────────────────────────

  reset() {
    this._headProgress = 0;
    this._tailProgress = 0;
    this._state = "idle";
    this._portal.isOpen = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // 电线渲染
  // ═══════════════════════════════════════════════════════════════

  _drawWire(p) {
    const path = this._wirePath;
    const head = this._headProgress;
    const tail = this._tailProgress;
    const hasWire = head > tail;

    p.push();
    p.noFill();

    // 1) 底层：静态电缆底色（始终显示整条线路）
    p.strokeWeight(2);
    p.stroke(45, 45, 65);
    this._drawPolyline(p, path);

    // 2) 有电时绘制 [tail, head] 区间的电流
    if (hasWire) {
      const partial = this._slicePolylineRange(path, tail, head);
      const ex = partial.endX;
      const ey = partial.endY;

      // 外层辉光
      p.stroke(20, 90, 255, 55);
      p.strokeWeight(9);
      this._drawPolyline(p, partial.points);

      // 中层辉光
      p.stroke(70, 150, 255, 110);
      p.strokeWeight(4);
      this._drawPolyline(p, partial.points);

      // 核心电弧（带抖动动画）
      p.stroke(190, 235, 255, 230);
      p.strokeWeight(1.5);
      this._drawArcPolyline(p, partial.points);

      // 电流前端光球（仅充电时显示，放电时不显示）
      if (this._state === "charging") {
        p.noStroke();
        p.fill(80, 160, 255, 130);
        p.ellipse(ex, ey, 14, 14);
        p.fill(240, 250, 255);
        p.ellipse(ex, ey, 5, 5);
      }
    }

    p.pop();
  }

  // ═══════════════════════════════════════════════════════════════
  // 折线工具方法
  // ═══════════════════════════════════════════════════════════════

  /**
   * 绘制完整折线
   */
  _drawPolyline(p, points) {
    if (!points || points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      p.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
  }

  /**
   * 绘制带电弧抖动的折线
   */
  _drawArcPolyline(p, points) {
    if (!points || points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      this._drawArcSegment(
        p,
        points[i - 1].x,
        points[i - 1].y,
        points[i].x,
        points[i].y,
      );
    }
  }

  /**
   * 单段电弧线（锯齿抖动效果）
   */
  _drawArcSegment(p, x1, y1, x2, y2) {
    const segs = 10;
    const jitter = 3.5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    p.beginShape();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      let vx = p.lerp(x1, x2, t);
      let vy = p.lerp(y1, y2, t);
      if (i > 0 && i < segs) {
        const offset = Math.sin(this._frame * 0.38 + i * 1.85) * jitter;
        vx += nx * offset;
        vy += ny * offset;
      }
      p.vertex(vx, vy);
    }
    p.endShape();
  }

  /**
   * 截取折线的 [startProg, endProg] 区间部分
   * @param {Array<{x,y}>} path
   * @param {number} startProg - 起始进度 (0~1)
   * @param {number} endProg   - 结束进度 (0~1)
   * @returns {{ points: Array<{x,y}>, endX: number, endY: number }}
   */
  _slicePolylineRange(path, startProg, endProg) {
    if (
      !path ||
      path.length === 0 ||
      this._totalLen <= 0 ||
      endProg <= startProg
    ) {
      return { points: [], endX: 0, endY: 0 };
    }

    const startDist = Math.min(1, startProg) * this._totalLen;
    const endDist = Math.min(1, endProg) * this._totalLen;

    const result = [];
    let acc = 0;
    let started = false;

    // 插入起点
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      const segLen = this._segLens[i - 1];
      const nextAcc = acc + segLen;

      // 找到起点所在线段
      if (!started) {
        if (startDist <= nextAcc) {
          const remain = Math.max(0, startDist - acc);
          const t = segLen > 0 ? remain / segLen : 0;
          result.push({
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          });
          started = true;
        }
      }

      // 已进入可见区间
      if (started) {
        if (endDist <= nextAcc) {
          // 终点在这个线段内
          const remain = Math.max(0, endDist - acc);
          const t = segLen > 0 ? remain / segLen : 0;
          const ex = from.x + (to.x - from.x) * t;
          const ey = from.y + (to.y - from.y) * t;
          result.push({ x: ex, y: ey });
          return { points: result, endX: ex, endY: ey };
        }
        // 终点在更后面，把这个线段终点加入
        result.push({ x: to.x, y: to.y });
      }

      acc = nextAcc;
    }

    const last =
      result.length > 0 ? result[result.length - 1] : path[path.length - 1];
    return { points: result, endX: last.x, endY: last.y };
  }
}
