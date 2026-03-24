// RecordKeyUtil.js
// 按键工具函数，负责 keyCode 到标签的转换

export function keyCodeToLabel(keyCode) {
    const mapping = {
        Space: 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
        ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Ctrl', ControlRight: 'Ctrl',
        AltLeft: 'Alt', AltRight: 'Alt',
    };
    if (mapping[keyCode]) return mapping[keyCode];
    if (/^Key[A-Z]$/.test(keyCode)) return keyCode.slice(3);
    if (/^Digit\d$/.test(keyCode)) return keyCode.slice(5);
    return keyCode;
}
