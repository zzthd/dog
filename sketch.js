// --- 全局变量 ---
let mic;
let vol = 0;
let dogFrames = {
  short: [],
  mid: [],
  middle: [],
  long: []
};

let dogs = []; // 保存所有在场上的狗

// --- 状态控制变量 (这是解决问题的核心) ---
let isBlowing = false;      // 标记当前是否正在吹气
let blowStartTime = 0;    // 记录每次吹气开始的时间

// --- 可调节参数 ---
const BLOW_THRESHOLD = 0.05; // 吹气音量的判定阈值，可以根据你的麦克风灵敏度调整
const SHORT_BREATH_DURATION = 400;  // 时长短于400毫秒，算“短”
const MID_BREATH_DURATION = 800;    // 时长在400-800毫秒，算“中”
const MIDDLE_BREATH_DURATION = 1500; // 时长在800-1500毫秒，算“中长”
// 时长超过1500毫秒，算“长”

// 预加载狗狗帧图
function preload() {
  // 为了方便测试，我们只加载 short 和 long 两种
  // 你可以取消注释来加载全部四种
  loadDogFrames("short", 2);
  // loadDogFrames("mid", 2);
  // loadDogFrames("middle", 2);
  loadDogFrames("long", 2);
}

// 统一的加载函数
function loadDogFrames(type, frameCount) {
  for (let i = 1; i <= frameCount; i++) {
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

  // --- 核心逻辑：检测单次吹气的开始和结束 ---
  // 这是对你之前代码最重要的修改，它解决了“不管怎么吹都只出现最短的狗”的问题

  // 1. 检测到开始吹气
  if (vol > BLOW_THRESHOLD && !isBlowing) {
    isBlowing = true;
    blowStartTime = now;
  } 
  // 2. 检测到停止吹气
  else if (vol < BLOW_THRESHOLD && isBlowing) {
    isBlowing = false;
    let blowDuration = now - blowStartTime; // 计算吹气持续了多久

    // 根据吹气时长，决定要生成的狗的类型
    let dogType;
    if (blowDuration < SHORT_BREATH_DURATION) {
      dogType = "short";
    } else if (blowDuration < MID_BREATH_DURATION) {
      dogType = "mid";
    } else if (blowDuration < MIDDLE_BREATH_DURATION) {
      dogType = "middle";
    } else {
      dogType = "long";
    }

    // 创建一只新狗并添加到数组中
    // 确保我们加载过这种类型的图片
    if (dogFrames[dogType] && dogFrames[dogType].length > 0) {
        dogs.push(new Dog(dogType));
    }
  }

  // 更新并显示所有狗
  for (let i = dogs.length - 1; i >= 0; i--) {
    dogs[i].update();
    dogs[i].display();

    // 如果狗走出画面，就将它从数组中移除，以节省内存
    if (dogs[i].x < -200) { // 修改判断条件，因为狗现在从右向左走
      dogs.splice(i, 1);
    }
  }
  
  // 在左上角添加一些调试信息
  fill(0);
  textSize(16);
  text(`当前音量: ${vol.toFixed(3)}`, 20, 20);
  if (isBlowing) {
    fill(255, 0, 0);
    text(`正在吹气... 已持续: ${floor(now - blowStartTime)} ms`, 20, 40);
  }
}


// 🐕 Dog 类
class Dog {
  constructor(type) {
    this.type = type;
    this.frames = dogFrames[type];
    this.frameIndex = 0;
    this.lastFrameTime = millis();
    this.frameInterval = 150; // 脚动频率
    
    // 从屏幕右边出现
    this.x = width + 100;

    // 问题修复 1: 出现在画面正中间
    // 将y坐标设置为画布高度的一半
    this.y = height / 2; 
    
    this.speed = random(1.2, 2.5); // 每只狗速度不一样
  }

  update() {
    // 让狗从右向左移动
    this.x -= this.speed;

    // 脚动切换
    if (millis() - this.lastFrameTime > this.frameInterval) {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.lastFrameTime = millis();
    }
  }

  display() {
    let img = this.frames[this.frameIndex];
    if (img) {
      // 适配不同屏幕尺寸
      let scaleFactor = min(1, height / 1080);
      
      // 问题修复 2: 倒着走
      // 移除了之前的水平翻转。这假设你的图片素材本身就是朝左画的。
      // 如果移除翻转后，小狗变成了朝右走，请告诉我，我会把它加回来。
      image(img, this.x, this.y, img.width * scaleFactor, img.height * scaleFactor);
    }
  }
}
