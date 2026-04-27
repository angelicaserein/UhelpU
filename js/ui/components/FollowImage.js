// FollowImage.js — p5 instance mode
export class FollowImage {
  /**
   * @param {p5} p - p5 实例
   * @param {p5.Image} img - 要跟随的图片对象
   * @param {number} circleX - 圆心 x
   * @param {number} circleY - 圆心 y
   * @param {number} circleRadius - 圆的半径
   * @param {number} imgSize - 图片显示尺寸
   * @param {p5.Image|null} circleImg - 圆心位置的背景图
   * @param {number|null} circleImgSize - 背景图显示尺寸
   * @param {number|null} moveRadius - 鼠标跟随可移动半径
   */
  constructor(
    p,
    img,
    circleX,
    circleY,
    circleRadius,
    imgSize = null,
    circleImg = null,
    circleImgSize = null,
    moveRadius = null,
  ) {
    this.p = p;
    this.img = img;
    this.circleX = circleX;
    this.circleY = circleY;
    this.circleRadius = circleRadius;
    this.moveRadius = moveRadius || circleRadius;
    this.imgSize = imgSize || p.min(50, circleRadius * 0.8);
    this.circleImg = circleImg;
    this.circleImgSize = circleImgSize || circleRadius * 2;
    this.posX = circleX;
    this.posY = circleY;
  }

  update() {
    const p = this.p;
    let targetX = p.mouseX;
    let targetY = p.mouseY;
    let dx = targetX - this.circleX;
    let dy = targetY - this.circleY;
    let dist = p.sqrt(dx * dx + dy * dy);
    let maxDist = this.moveRadius - this.imgSize / 2;

    if (dist > maxDist) {
      let angle = p.atan2(dy, dx);
      this.posX = this.circleX + p.cos(angle) * maxDist;
      this.posY = this.circleY + p.sin(angle) * maxDist;
    } else {
      this.posX = targetX;
      this.posY = targetY;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    p.imageMode(p.CENTER);
    if (this.circleImg) {
      p.image(
        this.circleImg,
        this.circleX,
        this.circleY,
        this.circleImgSize,
        this.circleImgSize,
      );
    } else {
      p.noFill();
      p.stroke(101, 55, 119);
      p.strokeWeight(15);
      p.ellipse(this.circleX, this.circleY, this.circleRadius * 2);
    }
    p.image(this.img, this.posX, this.posY, this.imgSize, this.imgSize);
    p.pop();
  }
}
