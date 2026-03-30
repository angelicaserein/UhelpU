import { Assets } from "./js/AssetsManager.js";
import { AppCoordinator } from "./js/AppCoordinator.js";

// 纯 p5 实例模式，所有依赖都通过 p 实例传递
new p5((p) => {
  let app;

  p.setup = async () => {
    p.createCanvas(1366, 768);

    // p5.js 2.0: 在 setup 中用 await 加载资源
    await Assets.loadAll(p);
    app = new AppCoordinator(p);
    app.init();
  };

  p.draw = () => {
    if (!app) {
      return;
    }
    app.updateFrame();
  };
}, document.getElementById('game-container'));
