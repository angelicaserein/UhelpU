/**
 * WireRenderer — handles electric-wire state, drawing, and portal indicator lights.
 * 电线游染器 — 处理电线状态、绘制和传送游機指示灯
 * Extracted from Level2 to keep level files focused on layout/design.
 * 从 Level2 提取以业保持关卡文件专注于布局/设计
 *
 * Automatically detects platforms between each button and the portal
 * 自动检测每个按鹁与传送游機之间的平台
 * to create routing waypoints. If no platform lies in the path,
 * 来创建路由中继点。如果路径中没有平台，
 * the wire connects directly.
 * 电线会直接连接。
 */
export class WireRenderer {
  /**
   * @param {object} config
   * @param {object} config.button1      - right button entity | 右按鹁实体
   * @param {object} config.button2      - left button entity | 左按鹁实体
   * @param {object} config.portal       - portal entity | 传送游機实体
   * @param {Set|Array} config.entities  - all level entities (used to find platforms for routing) | 所有关卡实体（用于阅找用于路由的平台）
   * @param {number} [config.wireSpeed=0.05] - per-frame progress increment | 每帧进度增量
   */
  constructor({ button1, button2, portal, entities, wireSpeed = 0.05 }) {
    this._button1 = button1;
    this._button2 = button2;
    this._portal = portal;
    this._wireSpeed = wireSpeed;

    // Collect platform entities (type "ground" that are NOT full-width floors) | 收集平台实体（类型“ground”但不是满幅序列）
    this._platforms = [];
    if (entities) {
      for (const e of entities) {
        if (e.type === "ground" && e.collider) {
          this._platforms.push(e);
        }
      }
    }

    this._wire1Progress = 0;
    this._wire2Progress = 0;
    this._leftIndicatorOn = false;
    this._rightIndicatorOn = false;
    this._portalUnlocked = false;
    this._wireFrame = 0;
  }

  // Update wire progress based on button states, and unlock portal when both wires complete
  // 根据按鹁状态更新电线进度，两条电线都完成时解锁传送游機

  update() {
    if (this._button1.isPressed) {
      this._wire1Progress = Math.min(1, this._wire1Progress + this._wireSpeed);
    } else {
      this._wire1Progress = 0;
    }
    if (this._button2.isPressed) {
      this._wire2Progress = Math.min(1, this._wire2Progress + this._wireSpeed);
    } else {
      this._wire2Progress = 0;
    }

    const rightArrived = this._wire1Progress >= 1.0;
    const leftArrived = this._wire2Progress >= 1.0;

    this._leftIndicatorOn = leftArrived;
    this._rightIndicatorOn = rightArrived;

    if (!this._portalUnlocked && leftArrived && rightArrived) {
      this._portalUnlocked = true;
      this._portal.openPortal();
    }

    if (this._portalUnlocked) {
      this._leftIndicatorOn = true;
      this._rightIndicatorOn = true;
    }
  }

  // 鈹€鈹€ Drawing 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  draw(p) {
    this._wireFrame++;
    this._drawWires(p);
    this._drawPortalIndicators(p);
  }

  _drawWires(p) {
    const b1x = this._button1.x + this._button1.collider.w / 2;
    const b1y = this._button1.y + this._button1.collider.h;
    const b2x = this._button2.x + this._button2.collider.w / 2;
    const b2y = this._button2.y + this._button2.collider.h;
    const gateX = this._portal.x + this._portal.collider.w / 2;
    const gateY = this._portal.y;

    const wire1Path = this._buildWirePath(b1x, b1y, gateX, gateY);
    const wire2Path = this._buildWirePath(b2x, b2y, gateX, gateY);

    this._drawOneWire(p, wire1Path, this._wire1Progress);
    this._drawOneWire(p, wire2Path, this._wire2Progress);
  }

  /**
   * Build a wire path from (sx,sy) to (ex,ey).
   * 从 (sx,sy) 到 (ex,ey) 构建电线路径。
   * Finds the best platform whose top surface lies vertically between
   * 找到最优平台，其顶面垂直摆布于按鹁与传送游機之间，
   * the button and portal, and uses its edge as a routing waypoint.
   * 并使用其边缘作为路由中继点。
   * If no suitable platform exists, connects directly via an L-shaped path.
   * 如果没有适用平台，直接通过 L 形路径连接。
   */
  _buildWirePath(sx, sy, ex, ey) {
    const route = this._findRoutePlatform(sx, sy, ex, ey);
    if (route) {
      return [
        { x: sx, y: sy },
        { x: route.x, y: sy },
        { x: route.x, y: route.y },
        { x: ex, y: route.y },
      ];
    }
    // No platform in the way — L-shaped direct connection | 路羄中没有平台 — L 形直接连接
    return [
      { x: sx, y: sy },
      { x: ex, y: sy },
      { x: ex, y: ey },
    ];
  }

  /**
   * Find the best platform to route a wire through.
   * 找到电线路由的最优平台。
   * A platform qualifies if its bounding box overlaps with the rectangular
   * 平台符合条件是它的边界框与按鹁和传送游機之间的矩形路径重叠。
   * corridor between the button and the portal (i.e. the platform is "in the way").
   * （即平台“按路羄上”）。
   * Returns { x, y } routing point (platform edge), or null if none qualifies.
   * 返回 { x, y } 路由点（平台边缘），如果不符合条件则为 null。
   */
  _findRoutePlatform(sx, sy, ex, ey) {
    const minX = Math.min(sx, ex);
    const maxX = Math.max(sx, ex);
    const minY = Math.min(sy, ey);
    const maxY = Math.max(sy, ey);

    let best = null;
    let bestDist = Infinity;

    for (const plat of this._platforms) {
      const platLeft = plat.x;
      const platRight = plat.x + plat.collider.w;
      const platBottom = plat.y;
      const platTop = plat.y + plat.collider.h;

      // AABB overlap: platform vertical range must overlap wire vertical range | AABB 重叠：平台纵向范围必须与电线纵向范围重叠
      if (platTop < minY || platBottom > maxY) continue;

      // Platform horizontal range must overlap wire horizontal range | 平台水平范围必须与电线水平范围重叠
      if (platRight < minX || platLeft > maxX) continue;

      // Use the platform edge closest to the start as routing x, | 使用最接近起点的平台边缘作为路由 x，
      // and platform top as routing y | 平台顶部作为路由 y
      const routeX = Math.max(platLeft, Math.min(platRight, sx));
      const routeY = platTop;

      const dist = Math.abs(routeX - sx) + Math.abs(routeY - sy);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: routeX, y: routeY };
      }
    }

    return best;
  }

  _drawOneWire(p, path, progress) {
    p.push();
    p.noFill();

    // Static cable base colour | 静态电缆基础颜色
    p.strokeWeight(2);
    p.stroke(45, 45, 65);
    this._drawPolylineLine(p, path);

    if (progress > 0) {
      const partial = this._slicePolylineByProgress(path, progress);
      const ex = partial.endX;
      const ey = partial.endY;

      // Outer glow | 外层辉光
      p.stroke(20, 90, 255, 55);
      p.strokeWeight(9);
      this._drawPolylineLine(p, partial.points);

      // Middle glow | 中层辉光
      p.stroke(70, 150, 255, 110);
      p.strokeWeight(4);
      this._drawPolylineLine(p, partial.points);

      // Arc core (jitter animation) | 电弧核心（护动动画）
      p.stroke(190, 235, 255, 230);
      p.strokeWeight(1.5);
      this._drawPolylineArc(p, partial.points);

      // Spark head: outer orb | 电祫头：外型球
      p.noStroke();
      p.fill(80, 160, 255, 130);
      p.ellipse(ex, ey, 14, 14);
      // Spark head: bright core | 电祫头：亮色核心
      p.fill(240, 250, 255);
      p.ellipse(ex, ey, 5, 5);
    }

    p.pop();
  }

  _drawPortalIndicators(p) {
    const px = this._portal.x;
    const py = this._portal.y;
    const pw = this._portal.collider.w;
    const ph = this._portal.collider.h;

    const indicatorY = py + ph + 14;
    const leftX = px + pw * 0.28;
    const rightX = px + pw * 0.72;

    this._drawIndicatorLight(
      p,
      leftX,
      indicatorY,
      this._leftIndicatorOn,
      "left",
    );
    this._drawIndicatorLight(
      p,
      rightX,
      indicatorY,
      this._rightIndicatorOn,
      "right",
    );
  }

  _drawIndicatorLight(p, x, y, isOn, side) {
    p.push();

    if (isOn) {
      if (side === "left") {
        p.fill(120, 230, 255, 110);
      } else {
        p.fill(140, 255, 170, 110);
      }
      p.noStroke();
      p.ellipse(x, y, 18, 18);

      if (side === "left") {
        p.fill(170, 245, 255, 240);
      } else {
        p.fill(180, 255, 200, 240);
      }
      p.ellipse(x, y, 9, 9);
    } else {
      p.fill(55, 60, 70, 210);
      p.stroke(125, 130, 145, 220);
      p.strokeWeight(1.5);
      p.ellipse(x, y, 10, 10);
    }

    p.pop();
  }

  // 鈹€鈹€ Polyline utilities 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

  _drawPolylineLine(p, points) {
    if (!points || points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      p.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
  }

  _drawPolylineArc(p, points) {
    if (!points || points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      this._drawArcLine(
        p,
        points[i - 1].x,
        points[i - 1].y,
        points[i].x,
        points[i].y,
      );
    }
  }

  _slicePolylineByProgress(points, progress) {
    if (!points || points.length === 0) {
      return { points: [], endX: 0, endY: 0 };
    }
    if (points.length === 1 || progress <= 0) {
      return {
        points: [points[0]],
        endX: points[0].x,
        endY: points[0].y,
      };
    }

    const segmentLens = [];
    let totalLen = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segmentLens.push(len);
      totalLen += len;
    }

    if (totalLen <= 0) {
      const start = points[0];
      return { points: [start], endX: start.x, endY: start.y };
    }

    const target = Math.min(1, progress) * totalLen;
    let acc = 0;
    const partialPoints = [{ x: points[0].x, y: points[0].y }];

    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      const segLen = segmentLens[i - 1];
      const nextAcc = acc + segLen;

      if (target >= nextAcc) {
        partialPoints.push({ x: to.x, y: to.y });
        acc = nextAcc;
        continue;
      }

      const remain = Math.max(0, target - acc);
      const t = segLen > 0 ? remain / segLen : 0;
      const endX = from.x + (to.x - from.x) * t;
      const endY = from.y + (to.y - from.y) * t;
      partialPoints.push({ x: endX, y: endY });
      return { points: partialPoints, endX, endY };
    }

    const last = points[points.length - 1];
    return { points: partialPoints, endX: last.x, endY: last.y };
  }

  // Jittered zig-zag arc line (per-frame animation)
  _drawArcLine(p, x1, y1, x2, y2) {
    const segs = 10;
    const jitter = 3.5;
    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len,
      ny = dx / len;

    p.beginShape();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      let vx = p.lerp(x1, x2, t);
      let vy = p.lerp(y1, y2, t);
      if (i > 0 && i < segs) {
        const offset = Math.sin(this._wireFrame * 0.38 + i * 1.85) * jitter;
        vx += nx * offset;
        vy += ny * offset;
      }
      p.vertex(vx, vy);
    }
    p.endShape();
  }
}
