import { Assets } from "./js/AssetsManager.js";
import { AppCoordinator } from "./js/AppCoordinator.js";
import { createStartupLoadingOverlay } from "./js/loading-screen/StartupLoadingOverlay.js";
import { installSoundPatches } from "./js/sound/SoundPatches.js";
import { initializeFirebase } from "./js/utils/firebase-init.js";

console.log("[main] App starting...");

// 初始化 Firebase
initializeFirebase().then(() => {
  console.log("[main] Firebase ready");
});

// 纯 p5 实例模式，所有依赖都通过 p 实例传递
new p5((p) => {
  let app;
  const startupLoadingOverlay = createStartupLoadingOverlay();

  p.setup = async () => {
    console.log("[main.p5] Setup starting...");
    p.createCanvas(1366, 768);

    try {
      startupLoadingOverlay.setStatus("Loading assets...");

      // 加载资源
      await Assets.loadAll(p, (progress) => {
        startupLoadingOverlay.setProgress(progress);
      });
      console.log("[main.p5] Assets loaded");

      startupLoadingOverlay.setStatus("Starting game...");

      // 初始化游戏
      app = new AppCoordinator(p);
      app.init();
      installSoundPatches(app.eventBus);
      console.log("[main.p5] Setup complete");

      startupLoadingOverlay.complete();
    } catch (error) {
      startupLoadingOverlay.setStatus("Loading failed. Please refresh.");
      console.error("[main.p5] Setup failed", error);
    }
  };

  p.draw = () => {
    if (!app) {
      return;
    }
    app.updateFrame();
  };
}, document.getElementById("game-container"));
