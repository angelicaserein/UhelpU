// WireIndicatorSystem.js
// 通用“按钮-电线-指示灯-机关”机制系统

export class WireIndicatorSystem {
    /**
     * @param {Array} buttonList - 按钮对象数组（需有 isPressed 属性）
     * @param {Array} wirePaths - 每路电线的路径点数组 [[{x,y},...], ...]
     * @param {Array} indicatorPoints - 指示灯坐标数组 [{x,y}, ...]
     * @param {Function} onAllArrived - 全部到达时的回调
     * @param {Object} [options] - 可选项：wireSpeed, indicatorColors
     */
    constructor(buttonList, wirePaths, indicatorPoints, onAllArrived, options = {}) {
        this.buttons = buttonList;
        this.wirePaths = wirePaths;
        this.indicatorPoints = indicatorPoints;
        this.onAllArrived = onAllArrived;
        this.wireSpeed = options.wireSpeed || 0.05;
        this.indicatorColors = options.indicatorColors || [
            { on: [120,230,255], off: [55,60,70] },
            { on: [140,255,170], off: [55,60,70] }
        ];
        this._wireProgress = new Array(buttonList.length).fill(0);
        this._indicatorOn = new Array(buttonList.length).fill(false);
        this._locked = false;
        this._frame = 0;
    }

    update() {
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].isPressed) {
                this._wireProgress[i] = Math.min(1, this._wireProgress[i] + this.wireSpeed);
            } else if (!this._locked) {
                this._wireProgress[i] = 0;
            }
        }
        // 指示灯状态
        for (let i = 0; i < this._indicatorOn.length; i++) {
            this._indicatorOn[i] = this._wireProgress[i] >= 1.0 || this._locked;
        }
        // 全部到达且未锁存时，触发回调
        if (!this._locked && this._wireProgress.every(p => p >= 1.0)) {
            this._locked = true;
            if (typeof this.onAllArrived === 'function') this.onAllArrived();
        }
    }

    draw(p) {
        this._frame++;
        // 画电线
        for (let i = 0; i < this.wirePaths.length; i++) {
            this._drawOneWire(p, this.wirePaths[i], this._wireProgress[i]);
        }
        // 画指示灯
        for (let i = 0; i < this.indicatorPoints.length; i++) {
            const pt = this.indicatorPoints[i];
            const on = this._indicatorOn[i];
            const color = this.indicatorColors[i % this.indicatorColors.length];
            this._drawIndicatorLight(p, pt.x, pt.y, on, color);
        }
    }

    _drawOneWire(p, path, progress) {
        p.push();
        p.noFill();
        p.strokeWeight(2);
        p.stroke(45, 45, 65);
        this._drawPolylineLine(p, path);
        if (progress > 0) {
            const partial = this._slicePolylineByProgress(path, progress);
            const ex = partial.endX;
            const ey = partial.endY;
            p.stroke(20, 90, 255, 55);
            p.strokeWeight(9);
            this._drawPolylineLine(p, partial.points);
            p.stroke(70, 150, 255, 110);
            p.strokeWeight(4);
            this._drawPolylineLine(p, partial.points);
            p.stroke(190, 235, 255, 230);
            p.strokeWeight(1.5);
            this._drawPolylineArc(p, partial.points);
            p.noStroke();
            p.fill(80, 160, 255, 130);
            p.ellipse(ex, ey, 14, 14);
            p.fill(240, 250, 255);
            p.ellipse(ex, ey, 5, 5);
        }
        p.pop();
    }

    _drawIndicatorLight(p, x, y, isOn, color) {
        p.push();
        if (isOn) {
            p.fill(...color.on, 110);
            p.noStroke();
            p.ellipse(x, y, 18, 18);
            p.fill(...color.on, 240);
            p.ellipse(x, y, 9, 9);
        } else {
            p.fill(...color.off, 210);
            p.stroke(125, 130, 145, 220);
            p.strokeWeight(1.5);
            p.ellipse(x, y, 10, 10);
        }
        p.pop();
    }

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
                const offset = Math.sin(this._frame * 0.38 + i * 1.85) * jitter;
                vx += nx * offset;
                vy += ny * offset;
            }
            p.vertex(vx, vy);
        }
        p.endShape();
    }
}
