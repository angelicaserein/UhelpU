/**
 * WireRenderer 鈥?handles electric-wire state, drawing, and portal indicator lights.
 * Extracted from Level2 to keep level files focused on layout/design.
 */
export class WireRenderer {
    /**
     * @param {object} config
     * @param {object} config.button1      - right button entity
     * @param {object} config.button2      - left button entity
     * @param {object} config.portal       - portal entity
     * @param {object} config.rightPlatform - platform used for wire routing
     * @param {number} [config.wireSpeed=0.05] - per-frame progress increment
     */
    constructor({ button1, button2, portal, rightPlatform, wireSpeed = 0.05 }) {
        this._button1 = button1;
        this._button2 = button2;
        this._portal = portal;
        this._rightPlatform = rightPlatform;
        this._wireSpeed = wireSpeed;

        this._wire1Progress = 0;
        this._wire2Progress = 0;
        this._leftIndicatorOn = false;
        this._rightIndicatorOn = false;
        this._portalUnlocked = false;
        this._wireFrame = 0;
    }

    // 鈹€鈹€ State update (call after collision) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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
        const platformLeftX = this._rightPlatform.x;
        const platformY = this._rightPlatform.y + this._rightPlatform.collider.h;
        const gateX = this._portal.x + this._portal.collider.w / 2;

        const wire1Path = [
            { x: b1x, y: b1y },
            { x: platformLeftX, y: b1y },
            { x: platformLeftX, y: platformY },
            { x: gateX, y: platformY },
        ];
        const wire2Path = [
            { x: b2x, y: b2y },
            { x: platformLeftX, y: b2y },
            { x: platformLeftX, y: platformY },
            { x: gateX, y: platformY },
        ];

        this._drawOneWire(p, wire1Path, this._wire1Progress);
        this._drawOneWire(p, wire2Path, this._wire2Progress);
    }

    _drawOneWire(p, path, progress) {
        p.push();
        p.noFill();

        // Static cable base colour
        p.strokeWeight(2);
        p.stroke(45, 45, 65);
        this._drawPolylineLine(p, path);

        if (progress > 0) {
            const partial = this._slicePolylineByProgress(path, progress);
            const ex = partial.endX;
            const ey = partial.endY;

            // Outer glow
            p.stroke(20, 90, 255, 55);
            p.strokeWeight(9);
            this._drawPolylineLine(p, partial.points);

            // Middle glow
            p.stroke(70, 150, 255, 110);
            p.strokeWeight(4);
            this._drawPolylineLine(p, partial.points);

            // Arc core (jitter animation)
            p.stroke(190, 235, 255, 230);
            p.strokeWeight(1.5);
            this._drawPolylineArc(p, partial.points);

            // Spark head: outer orb
            p.noStroke();
            p.fill(80, 160, 255, 130);
            p.ellipse(ex, ey, 14, 14);
            // Spark head: bright core
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

        this._drawIndicatorLight(p, leftX, indicatorY, this._leftIndicatorOn, "left");
        this._drawIndicatorLight(p, rightX, indicatorY, this._rightIndicatorOn, "right");
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
            this._drawArcLine(p, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
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
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;

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
