/**
 * @fileoverview Maps collider-shape pair strings to their collision-detection functions.
 * 将碰撞器形状对字符串映射到对应的碰撞检测函数。
 * Currently only RECTANGLE-RECTANGLE collision is implemented.
 * 目前仅实现了 RECTANGLE-RECTANGLE 碰撞检测。
 * To add a new shape, implement the detection function and add an entry here.
 * 要添加新形状，请实现检测函数并在此添加一个条目。
 */

import { ColliderShape, ColliderType } from "./enumerator.js";

/** @type {Object.<string, Function>} */
export const detectorMap = {
    "RECTANGLE-RECTANGLE": (a, b) => rectVsRect(a, b),
};

function rectVsRect(a, b) {
    const vectorX = (a.x + a.collider.w / 2) - (b.x + b.collider.w / 2);
    const vectorY = (a.y + a.collider.h / 2) - (b.y + b.collider.h / 2);

    const combinedHalfWidths  = a.collider.w / 2 + b.collider.w / 2;
    const combinedHalfHeights = a.collider.h / 2 + b.collider.h / 2;

    return Math.abs(vectorX) < combinedHalfWidths &&
           Math.abs(vectorY) < combinedHalfHeights;
}
