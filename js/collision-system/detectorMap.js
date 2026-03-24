import { ColliderShape, ColliderType} from "./enumerator.js";

export const detectorMap = {
    "RECTANGLE-RECTANGLE": (a, b) => rectVsRect(a, b),
    // "RECTANGLE-CIRCLE": (a, b) => rectVsCircle(a, b),
    // "CIRCLE-RECTANGLE": (a, b) => rectVsCircle(b, a),
    // "CIRCLE-CIRCLE": (a, b) => circleVsCircle(a, b),
}

function rectVsRect(a, b) {
    let result = false;

    let vectorX = (a.x+a.collider.w/2) - (b.x+b.collider.w/2);
    let vectorY = (a.y+a.collider.h/2) - (b.y+b.collider.h/2);

    let combinedHalfWidths = a.collider.w/2 + b.collider.w/2;
    let combinedHalfHeights = a.collider.h/2 + b.collider.h/2;

    if(Math.abs(vectorX) < combinedHalfWidths && Math.abs(vectorY) < combinedHalfHeights) {
        result = true;
    }

    
    return result;
}

