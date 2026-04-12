/**
 * firebase-init.js
 * Firebase Firestore 排行榜系统 - REST API 版本
 * 不需要 Firebase SDK，直接调用 Firestore REST 端点
 */

const PROJECT_ID = "uhelpu";
const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";

const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * 初始化 Firebase（只是日志，REST API 无需初始化）
 */
export async function initializeFirebase() {
  console.log("[Firebase] 🟢 Firestore REST API ready");
  return true;
}

/**
 * 提交成绩到 Firestore
 */
window.submitScore = async (playerName, timeMs, levelId) => {
  console.log(
    `[Firebase] submitScore: ${playerName}, ${timeMs.toFixed(0)}ms, ${levelId}`,
  );

  if (!playerName || !levelId) {
    console.error("[Firebase] Missing playerName or levelId");
    return false;
  }

  try {
    const timeSeconds = timeMs / 1000;
    const timestamp = new Date().toISOString();

    // 判断是否为账号用户
    let isAccount = false;
    try {
      const acctRaw = localStorage.getItem("playerAccount");
      if (acctRaw) isAccount = JSON.parse(acctRaw).isAccount === true;
    } catch (e) { /* ignore */ }

    // 构建请求数据
    const docData = {
      fields: {
        playerName: { stringValue: playerName.trim() },
        timeMs: { integerValue: Math.round(timeMs) },
        timeSeconds: { stringValue: timeSeconds.toFixed(2) },
        levelId: { stringValue: levelId },
        timestamp: { timestampValue: timestamp },
        submittedAt: { stringValue: timestamp },
        isAccount: { booleanValue: isAccount },
      },
    };

    console.log("[Firebase] Submitting to leaderboard...");

    // POST 到 Firestore REST API
    // 路径: leaderboard/{levelId}/scores
    const url = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Firebase] ✓ Score submitted! DocID: ${result.name}`);
    return true;
  } catch (error) {
    console.error("[Firebase] Error submitting score:", error);
    return false;
  }
};

/**
 * 获取排行榜数据
 */
window.getLeaderboard = async (levelId, limitCount = 10) => {
  console.log(`[Firebase] getLeaderboard: ${levelId}, limit: ${limitCount}`);
  return await _getLeaderboardFallback(levelId, limitCount);
};

/**
 * 降级方案：直接读取所有scores文档并本地排序
 * @private
 */
async function _getLeaderboardFallback(levelId, limitCount) {
  try {
    console.log("[Firebase] Loading all scores with pagination...");

    const allDocs = [];
    let pageToken = null;

    // 翻页直到没有更多数据
    do {
      let url = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=300`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[Firebase] Fetch failed: ${response.status}`);
        throw new Error(`Network request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        allDocs.push(...data.documents);
      }
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    console.log(`[Firebase] Fetched ${allDocs.length} total docs`);

    // 去重：每个 (playerName, isAccount) 组合只保留最佳成绩
    const bestMap = new Map();
    for (const doc of allDocs) {
      const fields = doc.fields || {};
      const playerName = fields.playerName?.stringValue || "Unknown";
      const isAccount = fields.isAccount?.booleanValue || false;
      const timeMs = parseInt(fields.timeMs?.integerValue || 0);
      const key = playerName + "|" + isAccount;
      if (!bestMap.has(key) || timeMs < bestMap.get(key).timeMs) {
        bestMap.set(key, {
          rank: 0,
          playerName,
          timeSeconds: fields.timeSeconds?.stringValue || "0.00",
          timeMs,
          timestamp: fields.timestamp?.timestampValue,
          isAccount,
        });
      }
    }

    const leaderboard = [...bestMap.values()]
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, limitCount)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    console.log(`[Firebase] ✓ Leaderboard ready: ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.error("[Firebase] Fallback failed:", error);
    throw error; // 重新抛出错误，让UI显示网络连接错误
  }
}
