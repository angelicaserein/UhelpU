// WindowPrompt 使用示例
// 提示框浮窗模板使用指南

import { WindowPrompt } from './js/ui/windows/WindowPrompt.js';

/**
 * ===== 基础使用 =====
 */

// 1. 创建浮窗实例（参数最少）
const prompt1 = new WindowPrompt(p);
prompt1.open();

// 2. 创建浮窗并指定i18n内容键
const prompt2 = new WindowPrompt(p, 'some_story_key');
prompt2.open();

// 3. 创建浮窗并自定义配置
const prompt3 = new WindowPrompt(p, 'dialog_content', {
  width: 500,                    // 浮窗宽度
  padding: 50,                   // 内边距
  fontSize: 20,                  // 字体大小
  backgroundColor: 'rgba(14, 7, 22, 0.93)',  // 背景色
  onClose: () => {
    console.log('浮窗已关闭');
    // 执行关闭后的逻辑
  }
});
prompt3.open();

/**
 * ===== 常用方法 =====
 */

// 显示浮窗
prompt1.open();

// 隐藏浮窗
prompt1.close();

// 切换显示/隐藏
prompt1.toggle();

// 更新内容（改成真正的提示框内容）
prompt1.setContent('new_content_key');

// 清理资源（移除浮窗）
prompt1.remove();

/**
 * ===== 在 i18n.js 中添加内容 =====
 */

/*
export const strings = {
  en: {
    dialog_content: 'This is a placeholder prompt.\nIt will be replaced with real content later.',
    // ... 其他内容
  },
  zh: {
    dialog_content: '这是一个占位符提示框。\n这会在稍后被替换为真正的提示内容。',
    // ... 其他内容
  }
};
*/

/**
 * ===== CSS 样式说明 =====
 */

/*
.window-prompt-overlay
  - 全屏遮罩层，半透明背景
  - 点击可关闭浮窗

.window-prompt-container
  - 浮窗主容器
  - 深紫色主题，带阴影和毛玻璃效果

.window-prompt-content
  - 主内容文本区域
  - 居中对齐，自动换行

.window-prompt-tips
  - "点击任意处关闭"的提示文本
  - 较小的字体，半透明显示
*/

/**
 * ===== 常见场景 =====
 */

// 场景1：游戏暂停时显示故事对话
export function showStoryPrompt(p) {
  const storyPrompt = new WindowPrompt(p, 'story_content', {
    width: 450,
    fontSize: 20,
    onClose: () => {
      console.log('故事对话已关闭');
    }
  });
  storyPrompt.open();
}

// 场景2：显示提示/教程
export function showTutorialPrompt(p, tutorialKey) {
  const tutorialPrompt = new WindowPrompt(p, tutorialKey, {
    width: 500,
    padding: 60,
  });
  tutorialPrompt.open();
}

// 场景3：多个顺序提示
export function showSequentialPrompts(p, contentKeys) {
  let currentIndex = 0;

  function showCurrent() {
    if (currentIndex >= contentKeys.length) return;

    const prompt = new WindowPrompt(p, contentKeys[currentIndex], {
      onClose: () => {
        currentIndex++;
        prompt.remove();
        showCurrent();  // 显示下一个提示
      }
    });
    prompt.open();
  }

  showCurrent();
}
