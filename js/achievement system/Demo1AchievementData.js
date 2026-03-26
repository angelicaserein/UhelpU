// Demo1AchievementData.js — Demo1 成就数据定义与状态管理（localStorage 持久化）

const STORAGE_KEY = "kinoko_achievements_demo1";

export const Demo1AchievementData = {
  _list: [
    { id: "perseverance", icon: "💪" },
    { id: "selfjump", icon: "🏔" },
    { id: "prisoner", icon: "⚡" },
    { id: "trap_master", icon: "🫤" },
    { id: "perfectionist", icon: "🏆" },
    { id: "first_steps", icon: "🎮" },
    { id: "student", icon: "📝" },
    { id: "socialite", icon: "💬" },
    { id: "director", icon: "🎬" },
    { id: "phantom_master", icon: "👻" },
  ],

  _unlocked: new Set(),

  _load() {
    try {
      // 兼容旧 key 迁移
      const oldRaw = localStorage.getItem("kinoko_achievements");
      const raw = localStorage.getItem(STORAGE_KEY) || oldRaw;
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          ids.forEach((id) => this._unlocked.add(id));
        }
        // 如果是从旧 key 读取的，迁移到新 key
        if (oldRaw && !localStorage.getItem(STORAGE_KEY)) {
          this._save();
        }
      }
    } catch (_) {
      // ignore
    }
  },

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._unlocked]));
    } catch (_) {
      // ignore
    }
  },

  getAll() {
    return this._list;
  },

  isUnlocked(id) {
    return this._unlocked.has(id);
  },

  unlock(id) {
    if (this._list.some((a) => a.id === id) && !this._unlocked.has(id)) {
      this._unlocked.add(id);
      this._save();
    }
  },

  getUnlockedCount() {
    return this._unlocked.size;
  },

  getTotal() {
    return this._list.length;
  },
};

// 启动时从 localStorage 恢复已解锁的成就
Demo1AchievementData._load();
