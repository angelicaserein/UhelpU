/**
 * firebase-init.js
 * Firebase Firestore Leaderboard System - REST API Version | Firebase Firestore 排行榜系统 - REST API 版本
 * No Firebase SDK needed, directly calls Firestore REST endpoints | 不需要 Firebase SDK，直接调用 Firestore REST 端点
 */

const PROJECT_ID = "uhelpu";
const API_KEY = "AIzaSyA34riJGsAh-jx9YHME-M5Nw5OHr4ndFuI";

const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Initialize Firebase (just logging, REST API doesn't need initialization) | 初始化 Firebase（只是日志，REST API 无需初始化）
 */
export async function initializeFirebase() {
  console.log("[Firebase] 🟢 Firestore REST API ready");
  return true;
}

/**
 * Submit score to Firestore | 提交成绩到 Firestore
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

    // Determine whether this is an account user | 判断是否为账号用户
    let isAccount = false;
    try {
      const acctRaw = localStorage.getItem("playerAccount");
      if (acctRaw) isAccount = JSON.parse(acctRaw).isAccount === true;
    } catch (e) {
      /* ignore */
    }

    // Build request data | 构建请求数据
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

    // POST to Firestore REST API | POST 到 Firestore REST API
    // Path: leaderboard/{levelId}/scores | 路径: leaderboard/{levelId}/scores
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
 * Get leaderboard data | 获取排行榜数据
 */
window.getLeaderboard = async (levelId, limitCount = 10) => {
  console.log(`[Firebase] getLeaderboard: ${levelId}, limit: ${limitCount}`);
  return await _getLeaderboardFallback(levelId, limitCount);
};

/**
 * Fallback solution: directly read all scores documents and sort locally | 降级方案：直接读取所有scores文档并本地排序
 * @private
 */
async function _getLeaderboardFallback(levelId, limitCount) {
  try {
    console.log("[Firebase] Loading all scores with pagination...");

    const allDocs = [];
    let pageToken = null;

    // Paginate until no more data | 翻页直到没有更多数据
    do {
      let url = `${FIRESTORE_API}/leaderboard/${levelId}/scores?key=${API_KEY}&pageSize=300`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[Firebase] Fetch failed: ${response.status}`);
        throw new Error(
          `Network request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        allDocs.push(...data.documents);
      }
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    console.log(`[Firebase] Fetched ${allDocs.length} total docs`);

    // Deduplication: keep only the best score for each (playerName, isAccount) combination | 去重：每个 (playerName, isAccount) 组合只保留最佳成绩
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

    console.log(
      `[Firebase] ✓ Leaderboard ready: ${leaderboard.length} entries`,
    );
    return leaderboard;
  } catch (error) {
    console.error("[Firebase] Fallback failed:", error);
    throw error; // 重新抛出错误，让UI显示网络连接错误
  }
}

/**
 * Upload user-created level | 上传用户自制关卡
 */
window.uploadUserLevel = async (levelJSON, authorName, title) => {
  console.log(`[Firebase] uploadUserLevel: "${title}" by "${authorName}"`);

  if (!levelJSON || typeof levelJSON !== "string") {
    console.error("[Firebase] levelJSON must be a valid JSON string");
    return false;
  }

  try {
    // Parse levelJSON to get meta.id | 解析 levelJSON 获取 meta.id
    let levelData;
    try {
      levelData = JSON.parse(levelJSON);
    } catch (parseError) {
      console.error("[Firebase] Invalid levelJSON format:", parseError);
      return false;
    }

    const levelId = levelData.meta?.id;
    if (!levelId) {
      console.error("[Firebase] levelJSON missing meta.id");
      return false;
    }

    const createdAt = levelData.meta?.createdAt || new Date().toISOString();

    const docData = {
      fields: {
        id: { stringValue: levelId },
        title: { stringValue: title.trim() },
        authorName: { stringValue: authorName.trim() },
        createdAt: { stringValue: createdAt },
        levelData: { stringValue: levelJSON },
      },
    };

    const url = `${FIRESTORE_API}/userLevels/${levelId}?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[Firebase] ✓ User level uploaded! ID: ${levelId}`);
    return true;
  } catch (error) {
    console.error("[Firebase] Error uploading user level:", error);
    return false;
  }
};

/**
 * Get user-created level list | 获取用户自制关卡列表
 */
window.getUserLevelList = async () => {
  console.log("[Firebase] getUserLevelList");

  try {
    const allDocs = [];
    let pageToken = null;

    // Paginate to get all levels | 翻页获取所有关卡
    do {
      let url = `${FIRESTORE_API}/userLevels?key=${API_KEY}&pageSize=100`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[Firebase] Fetch failed: ${response.status}`);
        throw new Error(
          `Network request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        allDocs.push(...data.documents);
      }
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    console.log(`[Firebase] Fetched ${allDocs.length} user levels`);

    // Extract necessary fields and sort | 提取必要字段并排序
    const levelList = allDocs
      .map((doc) => {
        const fields = doc.fields || {};
        return {
          id: fields.id?.stringValue || "",
          title: fields.title?.stringValue || "Untitled",
          authorName: fields.authorName?.stringValue || "Anonymous",
          createdAt: fields.createdAt?.stringValue || "",
        };
      })
      .sort((a, b) => {
        // Sort by createdAt descending (newest first) | 按 createdAt 倒序（最新的在前）
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    console.log(
      `[Firebase] ✓ User level list ready: ${levelList.length} levels`,
    );
    return levelList;
  } catch (error) {
    console.error("[Firebase] Error fetching user level list:", error);
    return [];
  }
};

/**
 * Get a single user-created level data | 获取单个用户自制关卡数据
 */
window.getUserLevel = async (levelId) => {
  console.log(`[Firebase] getUserLevel: ${levelId}`);

  if (!levelId) {
    console.error("[Firebase] levelId is required");
    return null;
  }

  try {
    const url = `${FIRESTORE_API}/userLevels/${levelId}?key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Firebase] Level not found: ${levelId}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const levelDataStr = data.fields?.levelData?.stringValue;

    if (!levelDataStr) {
      console.warn("[Firebase] levelData field not found");
      return null;
    }

    console.log(`[Firebase] ✓ User level loaded: ${levelId}`);
    return levelDataStr;
  } catch (error) {
    console.error("[Firebase] Error fetching user level:", error);
    return null;
  }
};

/**
 * 删除用户自制关卡（需要权限验证）
 */
window.deleteUserLevel = async (levelId, authorName) => {
  console.log(`[Firebase] deleteUserLevel: ${levelId}`);

  if (!levelId) {
    console.error("[Firebase] levelId is required");
    return false;
  }

  try {
    // 先获取文档验证 authorName
    const url = `${FIRESTORE_API}/userLevels/${levelId}?key=${API_KEY}`;

    const getResponse = await fetch(url);

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        console.warn("[Firebase] Level not found");
        return false;
      }
      throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    const docAuthorName = data.fields?.authorName?.stringValue;

    // 验证权限
    if (docAuthorName !== authorName) {
      console.warn(
        `[Firebase] Permission denied: expected "${authorName}", got "${docAuthorName}"`,
      );
      return false;
    }

    // 执行删除
    const deleteResponse = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(
        `HTTP ${deleteResponse.status}: ${deleteResponse.statusText}`,
      );
    }

    console.log(`[Firebase] ✓ User level deleted: ${levelId}`);
    return true;
  } catch (error) {
    console.error("[Firebase] Error deleting user level:", error);
    return false;
  }
};
