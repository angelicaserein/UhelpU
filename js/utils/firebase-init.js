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
    console.log("[Firebase] Using fallback method to load scores...");

    // 列出 leaderboard/{levelId}/scores 下的所有文档
    const url = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=100`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Firebase] Fallback also failed: ${response.status}`);
      return [];
    }

    const data = await response.json();

    let leaderboard = [];
    if (data.documents && Array.isArray(data.documents)) {
      leaderboard = data.documents
        .map((doc, index) => {
          const fields = doc.fields || {};
          return {
            rank: 0, // 暂时设为0，之后再更新
            playerName: fields.playerName?.stringValue || "Unknown",
            timeSeconds: fields.timeSeconds?.stringValue || "0.00",
            timeMs: parseInt(fields.timeMs?.integerValue || 0),
            timestamp: fields.timestamp?.timestampValue,
            isAccount: fields.isAccount?.booleanValue || false,
          };
        })
        // 按时间排序
        .sort((a, b) => a.timeMs - b.timeMs)
        // 取前N条
        .slice(0, limitCount)
        // 更新排名
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    }

    console.log(`[Firebase] ✓ Fallback loaded ${leaderboard.length} scores`);
    return leaderboard;
  } catch (error) {
    console.error("[Firebase] Fallback failed:", error);
    return [];
  }
}
