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
  bgImageWorldSelect: null,
  bgImageLanguageChoice: null,
  bgImageLevel1: null,

  // 成就图标（1.png ~ 10.png）
  achieveImgs: [],
  bgImageLevel2: null,
  bgImageLevel3: null,
  bgImageLevel4: null,
  bgImageLevel5: null,
  bgImageLevel6: null,
  bgImageLevel7: null,
  bgImageLevel8: null,
  bgImageLevel9: null,
  bgImageLevel10: null,
  bgImageDemo2Level: null,

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
  tileImage_Jump: null,
  tileImage_doorOpen: null,
  tileImage_doorClose: null,

  // 传送点贴图
  tileImage_teleportPointClose: null,
  tileImage_teleportPointOpen: null,

  // 敌人贴图
  enemyImg: null,
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
      this._safeLoad(
        p.loadImage("assets/images/bg/general.png"),
        "世界选择页背景",
      ),
      this._safeLoad(p.loadImage("assets/images/bg/level1.png"), "关卡1背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level2.png"), "关卡2背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level3.png"), "关卡3背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level4.png"), "关卡4背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level5.png"), "关卡5背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level6.png"), "关卡6背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level7.png"), "关卡7背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level8.png"), "关卡8背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level9.png"), "关卡9背景"),
      this._safeLoad(p.loadImage("assets/images/bg/level10.png"), "关卡10背景"),
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
      // 敌人贴图
      this._safeLoad(p.loadImage("assets/images/bg/enemy.png"), "敌人"),
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
      this._safeLoad(p.loadImage("assets/images/achieve/2.png"), "成就图标2"),
      this._safeLoad(p.loadImage("assets/images/achieve/3.png"), "成就图标3"),
      this._safeLoad(p.loadImage("assets/images/achieve/4.png"), "成就图标4"),
      this._safeLoad(p.loadImage("assets/images/achieve/5.png"), "成就图标5"),
      this._safeLoad(p.loadImage("assets/images/achieve/6.png"), "成就图标6"),
      this._safeLoad(p.loadImage("assets/images/achieve/7.png"), "成就图标7"),
      this._safeLoad(p.loadImage("assets/images/achieve/8.png"), "成就图标8"),
      this._safeLoad(p.loadImage("assets/images/achieve/9.png"), "成就图标9"),
      this._safeLoad(p.loadImage("assets/images/achieve/10.png"), "成就图标10"),
      this._safeLoad(p.loadImage("assets/images/tiles/Jump.png"), "Jump贴图"),
      this._safeLoad(
        p.loadImage("assets/images/tiles/dooropen.png"),
        "门开贴图",
      ),
      this._safeLoad(
        p.loadImage("assets/images/tiles/doorclose.png"),
        "门关贴图",
      ),
      this._safeLoad(
        p.loadImage("assets/images/bg/demo2levelbg.png"),
        "Demo2关卡背景",
      ),
      this._safeLoad(
        p.loadImage("assets/images/bg/languagechoice.png"),
        "语言选择页背景",
      ),
      this._safeLoad(
        p.loadImage("assets/images/tiles/TeleportPointClose.png"),
        "传送点关闭贴图",
      ),
      this._safeLoad(
        p.loadImage("assets/images/tiles/TeleportPointOpen.png"),
        "传送点开启贴图",
      ),
    ]);

    // 按顺序赋值
    this.bgImageMenu = results[0];
    this.bgImageSettings = results[1];
    this.bgImageLevelChoice = results[2];
    this.bgImageOpeningScene = results[3];
    this.bgImageAchieves = results[4];
    this.bgImageWorldSelect = results[5];
    this.bgImageLevel1 = results[6];
    this.bgImageLevel2 = results[7];
    this.bgImageLevel3 = results[8];
    this.bgImageLevel4 = results[9];
    this.bgImageLevel5 = results[10];
    this.bgImageLevel6 = results[11];
    this.bgImageLevel7 = results[12];
    this.bgImageLevel8 = results[13];
    this.bgImageLevel9 = results[14];
    this.bgImageLevel10 = results[15];
    this.followerImg1 = results[16];
    this.followerImg2 = results[17];
    this.customFont = results[18];
    this.storyTexts_en = results[19];
    this.storyTexts_zh = results[20];
    // 本体贴图
    this.playerImg_right = results[21];
    this.playerImg_left = results[22];
    this.playerImg_up = results[23];
    this.playerImg_upRight = results[24];
    this.playerImg_upLeft = results[25];
    this.playerImg_dead = results[26];
    this.playerIdleImgs = [
      results[27],
      results[28],
      results[29],
      results[30],
      results[31],
      results[32],
    ];
    // 分身贴图
    this.cloneImg_right = results[33];
    this.cloneImg_left = results[34];
    this.cloneImg_up = results[35];
    this.cloneImg_upRight = results[36];
    this.cloneImg_upLeft = results[37];
    this.cloneIdleImgs = [
      results[38],
      results[39],
      results[40],
      results[41],
      results[42],
      results[43],
    ];
    // NPC 贴图
    this.npcIdleImgs = [
      results[44],
      results[45],
      results[46],
      results[47],
      results[48],
    ];
    this.npcFaceImg = results[49];
    // 敌人贴图
    this.enemyImg = results[50];
    // 地块贴图
    this.tileImage_goal = results[51];
    this.tileImage_ground = results[52];
    this.tileImage_platform = results[53];
    this.tileImage_wall = results[54];
    this.tileImage_signboard = results[55];
    this.tileImage_signboard2 = results[56];
    this.tileImage_Jump = results[67];
    this.tileImage_doorOpen = results[68];
    this.tileImage_doorClose = results[69];
    this.bgImageDemo2Level = results[70];
    this.bgImageLanguageChoice = results[71];
    this.tileImage_teleportPointClose = results[72];
    this.tileImage_teleportPointOpen = results[73];
    this.achieveImgs = [
      results[57],
      results[58],
      results[59],
      results[60],
      results[61],
      results[62],
      results[63],
      results[64],
      results[65],
      results[66],
    ];
  },
};
