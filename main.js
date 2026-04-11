import { Assets } from "./js/AssetsManager.js";
import { AppCoordinator } from "./js/AppCoordinator.js";
import { initializeFirebase } from "./js/utils/firebase-init.js";

console.log("[main] App starting...");

// 初始化 Firebase
initializeFirebase().then(() => {
  console.log("[main] Firebase ready");
});

// 纯 p5 实例模式，所有依赖都通过 p 实例传递
new p5((p) => {
  let app;

  p.setup = async () => {
    console.log("[main.p5] Setup starting...");
    p.createCanvas(1366, 768);

    // 加载资源
    await Assets.loadAll(p);
    console.log("[main.p5] Assets loaded");

    // 初始化游戏
    app = new AppCoordinator(p);
    app.init();
    console.log("[main.p5] Setup complete");
  };

  p.draw = () => {
    if (!app) {
      return;
    }
    app.updateFrame();
  };
}, document.getElementById("game-container"));
