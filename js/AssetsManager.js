// AssetsManager.js
// 资源加载器 — p5 instance mode (p5.js 2.0 async/await)
// 在 async setup() 中调用 await Assets.loadAll(p)

export const Assets = {
  // 字体
  customFont: null,

  // 故事文案（双语言）
  storyTexts_en: null,
  storyTexts_zh: null,

  // 主页动图
  followerImg1: null,
  followerImg2: null,

  // 背景图
  bgImageMenu: null,
  bgImageSettings: null,
  bgImageLevelChoice: null,
  bgImageOpeningScene: null,
  bgImageAchieves: null,
  bgImageLevel1: null,

  // 成就图标
  achieveImg1: null,
  bgImageLevel2: null,
  bgImageLevel3: null,
  bgImageLevel4: null,

  // 本体贴图（5方向）
  playerImg_right: null,
  playerImg_left: null,
  playerImg_up: null,
  playerImg_upRight: null,
  playerImg_upLeft: null,
  playerImg_dead: null,
  playerIdleImgs: [],

  // 分身贴图（5方向）
  cloneImg_right: null,
  cloneImg_left: null,
  cloneImg_up: null,
  cloneImg_upRight: null,
  cloneImg_upLeft: null,
  cloneIdleImgs: [],

  // NPC 贴图
  npcIdleImgs: [],
  npcFaceImg: null,

  // 地块贴图
  tileImage_goal: null,
  tileImage_ground: null,
  tileImage_platform: null,
  tileImage_wall: null,
  tileImage_signboard: null,
  tileImage_signboard2: null,

  // 安全加载：失败时返回 null 而不是抛异常
  async _safeLoad(promise, name) {
    try {
      const result = await promise;
      console.log(name + "加载成功");
      return result;
    } catch (err) {
      console.warn(name + "加载失败：", err);
      return null;
    }
  },

  // 预加载所有资源（async/await，适配 p5.js 2.0）
  async loadAll(p) {
    const results = await Promise.all([
      this._safeLoad(p.loadImage("assets/images/bg/menu.png"), "菜单背景"),
      this._safeLoad(
        p.loadImage("assets/images/bg/settings.png"),
        "设置页背景",
      ),
      this._safeLoad(
        p.loadImage("assets/images/bg/level_choice.png"),
        "关卡选择页背景",
      ),
      this._safeLoad(
        p.loadImage("assets/images/bg/opening_scene.png"),
        "开场动画背景",
      ),
      this._safeLoad(
        p.loadImage("assets/images/bg/achieve.png"),
        "Achieves页背景",
      ),
      this._safeLoad(p.loadImage("assets/images/bg/level1.png"), "关卡1背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level2.png"), "关卡2背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level3.png"), "关卡3背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level4.png"), "关卡4背景"),
      this._safeLoad(p.loadImage("assets/images/bg/follower1.png"), "动图1"),
      this._safeLoad(p.loadImage("assets/images/bg/follower2.png"), "动图2"),
      this._safeLoad(p.loadFont("assets/fonts/HYPixel11pxU-2.ttf"), "字体"),
      this._safeLoad(p.loadStrings("assets/text/story_en.txt"), "故事文案-EN"),
      this._safeLoad(p.loadStrings("assets/text/story_zh.txt"), "故事文案-ZH"),
      // 本体贴图
      this._safeLoad(
        p.loadImage("assets/images/player/right.png"),
        "本体right",
      ),
      this._safeLoad(p.loadImage("assets/images/player/left.png"), "本体left"),
      this._safeLoad(p.loadImage("assets/images/player/up.png"), "本体up"),
      this._safeLoad(
        p.loadImage("assets/images/player/upRight.png"),
        "本体upRight",
      ),
      this._safeLoad(
        p.loadImage("assets/images/player/upLeft.png"),
        "本体upLeft",
      ),
      this._safeLoad(
        p.loadImage("assets/images/player/playerdead.png"),
        "本体dead",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/1.png"),
        "本体idle1",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/2.png"),
        "本体idle2",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/3.png"),
        "本体idle3",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/4.png"),
        "本体idle4",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/5.png"),
        "本体idle5",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/6.png"),
        "本体idle6",
      ),
      // 分身贴图
      this._safeLoad(
        p.loadImage("assets/images/player/right2.png"),
        "分身right",
      ),
      this._safeLoad(p.loadImage("assets/images/player/left2.png"), "分身left"),
      this._safeLoad(p.loadImage("assets/images/player/up2.png"), "分身up"),
      this._safeLoad(
        p.loadImage("assets/images/player/upRight2.png"),
        "分身upRight",
      ),
      this._safeLoad(
        p.loadImage("assets/images/player/upLeft2.png"),
        "分身upLeft",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/11.png"),
        "分身idle11",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/22.png"),
        "分身idle22",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/33.png"),
        "分身idle33",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/44.png"),
        "分身idle44",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/55.png"),
        "分身idle55",
      ),
      this._safeLoad(
        p.loadImage("assets/images/idle-action/66.png"),
        "分身idle66",
      ),
      // NPC 贴图
      this._safeLoad(p.loadImage("assets/images/npc/npc11.png"), "NPC idle1"),
      this._safeLoad(p.loadImage("assets/images/npc/npc12.png"), "NPC idle2"),
      this._safeLoad(p.loadImage("assets/images/npc/npc13.png"), "NPC idle3"),
      this._safeLoad(p.loadImage("assets/images/npc/npc14.png"), "NPC idle4"),
      this._safeLoad(p.loadImage("assets/images/npc/npc15.png"), "NPC idle5"),
      this._safeLoad(p.loadImage("assets/images/npc/npc-face.png"), "NPC face"),
      // 地块贴图
      this._safeLoad(p.loadImage("assets/images/tiles/goal.png"), "终点门"),
      this._safeLoad(p.loadImage("assets/images/tiles/ground.png"), "地面贴图"),
      this._safeLoad(
        p.loadImage("assets/images/tiles/platform.png"),
        "平台贴图",
      ),
      this._safeLoad(p.loadImage("assets/images/tiles/wall.png"), "墙体贴图"),
      this._safeLoad(
        p.loadImage("assets/images/tiles/signboard.png"),
        "木牌贴图",
      ),
      this._safeLoad(
        p.loadImage("assets/images/tiles/signboard2.png"),
        "木牌2贴图",
      ),
      this._safeLoad(p.loadImage("assets/images/achieve/1.png"), "成就图标1"),
    ]);

    // 按顺序赋值
    this.bgImageMenu = results[0];
    this.bgImageSettings = results[1];
    this.bgImageLevelChoice = results[2];
    this.bgImageOpeningScene = results[3];
    this.bgImageAchieves = results[4];
    this.bgImageLevel1 = results[5];
    this.bgImageLevel2 = results[6];
    this.bgImageLevel3 = results[7];
    this.bgImageLevel4 = results[8];
    this.followerImg1 = results[9];
    this.followerImg2 = results[10];
    this.customFont = results[11];
    this.storyTexts_en = results[12];
    this.storyTexts_zh = results[13];
    // 本体贴图
    this.playerImg_right = results[14];
    this.playerImg_left = results[15];
    this.playerImg_up = results[16];
    this.playerImg_upRight = results[17];
    this.playerImg_upLeft = results[18];
    this.playerImg_dead = results[19];
    this.playerIdleImgs = [
      results[20],
      results[21],
      results[22],
      results[23],
      results[24],
      results[25],
    ];
    // 分身贴图
    this.cloneImg_right = results[26];
    this.cloneImg_left = results[27];
    this.cloneImg_up = results[28];
    this.cloneImg_upRight = results[29];
    this.cloneImg_upLeft = results[30];
    this.cloneIdleImgs = [
      results[31],
      results[32],
      results[33],
      results[34],
      results[35],
      results[36],
    ];
    // NPC 贴图
    this.npcIdleImgs = [
      results[37],
      results[38],
      results[39],
      results[40],
      results[41],
    ];
    this.npcFaceImg = results[42];
    // 地块贴图
    this.tileImage_goal = results[43];
    this.tileImage_ground = results[44];
    this.tileImage_platform = results[45];
    this.tileImage_wall = results[46];
    this.tileImage_signboard = results[47];
    this.tileImage_signboard2 = results[48];
    this.achieveImg1 = results[49];
  },
};
