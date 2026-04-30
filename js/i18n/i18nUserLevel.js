// js/i18nUserLevel.js — Player-created level related text | 玩家关卡相关文案
// Auto-register to global i18n dictionary on import | 导入即自动注册到全局 i18n 字典

import { registerTranslations } from "./index.js";

registerTranslations({
  en: {
    // ── User Level List ─────────────────────────────────────────────────
    user_level_button_label: "Map Plaza",
    user_level_create_map: "+ Create Map",
    user_level_search_placeholder: "Search levels or authors...",
    user_level_loading: "Loading...",
    user_level_no_match: "No matching levels",
    user_level_empty: "No user-uploaded levels yet",
    user_level_unnamed: "Unnamed Level",
    user_level_by_prefix: "by ",
    user_level_anonymous_author: "Anonymous",
  },

  zh: {
    // ── 玩家关卡列表 ─────────────────────────────────────────────────
    user_level_button_label: "地图广场",
    user_level_create_map: "＋ 创建地图",
    user_level_search_placeholder: "搜索关卡或作者...",
    user_level_loading: "加载中...",
    user_level_no_match: "没有匹配的关卡",
    user_level_empty: "还没有玩家上传关卡",
    user_level_unnamed: "未命名关卡",
    user_level_by_prefix: "by ",
    user_level_anonymous_author: "匿名",
  },
});
