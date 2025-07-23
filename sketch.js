let mic;
let vol = 0;
let dogFrames = {
  short: [],
  mid: [],
  middle: [],
  long: []
};

let dogs = [];
let blowStartTime = null;
let lastTriggerTime = 0;
const blowCooldown = 800; // 最小间隔（防止狗太多）

function preload() {
  loadDogFrames("short");
  loadDogFrames("mid");
  loadDogFrames("middle");
  loadDogFrames("long");
}

function loadDogFrames(type) {
  for (let i = 1; i <= 2; i++) {
    let filename = `${type}-${String(i).padStart(2, '0')}.png`;
    dogFrames[type].push(loadImage(filename));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  mic = new p5.AudioIn();
  mic.start();
}

function draw() {
  background(255);
  vol = mic.getLevel();

  let now = millis();

  // 检测吹气开始时间
  if (vol > 0.06) {
    if (blowStartTime === null) {
      blowStartTime = now;
    }
  }

  // 检测吹气结束 -> 添加狗狗
  if (vol < 0.04 && blowStartTime !== null && now - lastTriggerTime > blowCooldown) {
    let duration = now - blowStartTime;
    let dogType = chooseDogType(duration);
    dogs.push(new Dog(dogType));
    lastTriggerTime = now;
    blowStartTime = null;
  }

  // 更新 & 显示所有狗狗
  for (let i = dogs.length - 1; i >= 0; i--) {
    dogs[i].update();
    dogs[i].display();
    if (dogs[i].x < -200) {
      dogs.splice(i, 1);
    }
  }
}

function chooseDogType(duration) {
  if (duration < 400) return "short";
  else if (duration < 1000) return "mid";
  else if (duration < 1800) return "middle";
  else return "long";
}


class Dog {
  constructor(type) {
    this.type = type;
    this.frames = dogFrames[type];
    this.frameIndex = 0;
    this.lastFrameTime = millis();
    this.frameInterval = 150;

    this.x = width - 100; // ✅ 从画面右侧外部出现
    this.y = height * 0.5; // ✅ 控制狗狗竖直位置（画面中间稍偏下）
    this.speed = random(1.5, 2.5) * 1; // ✅ 向左移动（速度是负数）
  }

  update() {
    this.x += this.speed;

    if (millis() - this.lastFrameTime > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.lastFrameTime = millis();
    }
  }

  display() {
    let img = this.frames[this.frameIndex];
    if (img) {
      let scaleFactor = min(1, width / 1920); // ✅ 适配大屏缩放
      image(img, this.x, this.y, img.width * scaleFactor, img.height * scaleFactor);
    }
  }
}

