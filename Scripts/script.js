console.log("script loaded");

let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");

let activeKey = 0;
let gameOver = false;
let spacesRight = 0;
let spaceLeft = 0;

let colorArray = [
  "#092140",
  "#024959",
  "#F2C777",
  "#E6E7E8",
  "#BF2A2A"
];

class GamePiece {
  constructor(x, y, dx, dy, width, height, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  getY() {
    return this.y;
  }

  getX() {
    return this.x;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  setY(y) {
    this.y = y;
  }

  setX(x) {
    this.x = x;
  }

  setDx(dx) {
    this.dx = dx;
  }

  setDy(dy) {
    this.dy = dy;
  }

  draw() {
    context.fillStyle = this.color;
    context.beginPath();
    context.fillRect(this.x, this.y, this.height, this.width);
    context.fill();
  }
}

class Character extends GamePiece {
  constructor(x, y, dx, dy, width, height, color, laserTotal, enemy, bulletSpeed) {
    super(x, y, dx, dy, width, height, color);

    this.laserTotal = laserTotal;
    this.lasers = [];
    this.enemy = enemy;
    this.bulletSpeed = bulletSpeed;
  }

  getLasers() {
    return this.lasers;
  }

  addLaser() {
    if (this.lasers.length < this.laserTotal)
      this.lasers.push(new Laser(this.x + this.width / 2, this.y, this.bulletSpeed, 10, 10, this.enemy));
  }

  removeLasers() {
    let removeLasers = [];
    let lasersToRemove = 0;
    for (let i = 0; i < this.lasers.length; i++) {
      this.lasers[i].update();

      if ((!this.enemy && this.lasers[i].getY() <= 0) ||
          (this.enemy && this.lasers[i].getY() >= canvas.height)) {

        lasersToRemove++;
      }
    }

    for (let i = 0; i < lasersToRemove; i++) {
      this.lasers.shift();
    }
  }
}

class Laser extends GamePiece {
  constructor(x, y, dy, width, height, enemyLaser) {
    super(x, y, 0, dy, width, height, '#ff0000');
    this.enemyLaser = enemyLaser;
    this.hit = false;
  }

  getHit() {
    return this.hit;
  }

  setHit(hit) {
    this.hit = hit;
  }

  update() {
      if (!this.enemyLaser) {
        if (this.y > 0)
          this.y -= this.dy;
      }
      else this.y += this.dy;

      if (!this.hit)
        this.draw();
  }
}

class Player extends Character {
  constructor(x, dx, width, height) {
    let color = colorArray[Math.floor(Math.random() * colorArray.length)];
    let y = canvas.height - height;

    super(x, y, dx, 0, width, height, color, 3, false, 12);

    this.animate = false;
    this.lives = 3;
  }

  getLives() {
    return this.lives;
  }

  animateOn() {
    this.animate = true;
  }

  animateOff() {
    this.animate = false;
  }

  loseLife() {
    this.lives--;
    if (this.lives === 0)
      gameOver = true;
  }

  update(keycode) {
    if (!gameOver) {
      if (this.animate) {
        if (keycode === 39 && this.x + this.width + this.dx <= canvas.width)
          this.x += this.dx;
        else if (keycode === 37 && this.x - this.dx >= 0)
          this.x -= this.dx;
      }
      this.draw();

      this.removeLasers();
    }
  }
}

class Enemy extends Character {
  constructor(x, y, dx, dy, width, height, shotFreq) {
    let color = colorArray[Math.floor(Math.random() * colorArray.length)];
    super(x, y, dx, dy, width, height, color, 4, true, 7);
    this.frame = 0;
    this.hit = false;
    this.shotFreq = shotFreq;
  }

  setHit(hit) {
    this.hit = hit;
  }

  clear() {
    this.hit = true;
    this.x = -500;
    this.y = -500;
  }

  update() {
    if (!gameOver && !this.hit) {
      this.x += this.dx;

      if (this.x + this.width >= canvas.width || this.x <= 0) {
        this.dx = -this.dx;
        this.y += this.dy;
      }

      this.frame++;
      if (this.frame === this.shotFreq) {
        this.frame = 0;
        this.addLaser();
      }

      this.removeLasers();

      if (this.y > canvas.height - (this.height * 2)) gameOver = true;

      this.draw();
    }
  }
}

let player;
let enemies = [];
let init = function() {
  player = new Player((canvas.width / 2) - 25, 10, 50, 50);

  for (let i = 0; i < 5; i++) {
    let fireRate = Math.floor(Math.random() * 250) + 100;
    enemies.push(new Enemy(i * 100, 0, 5, 25, 50, 50, fireRate));
    enemies[i].draw();
  }

  player.draw();
}

let laserHitCheck = function() {
  let playerLasers = player.getLasers();
  let enemyLasers = [];

  for (let i = 0; i < enemies.length; i++) {
    enemyLasers = enemyLasers.concat(enemies[i].getLasers());
  }

  for (let i = 0; i < playerLasers.length; i++) {
    for (let j = 0; j < enemies.length; j++) {
      if (playerLasers[i].getX() >= enemies[j].getX() && playerLasers[i].getX() + playerLasers[i].getWidth() <= enemies[j].getX() + enemies[j].getWidth() &&
          playerLasers[i].getY() >= enemies[j].getY() && playerLasers[i].getY() + playerLasers[i].getHeight() <= enemies[j].getY() + enemies[j].getHeight()) {
        playerLasers[i].setHit(true);
        enemies[j].clear();
      }
    }
  }

  for (let i = 0; i < enemyLasers.length; i++) {
    if (enemyLasers[i].getX() >= player.getX() && enemyLasers[i].getX() + enemyLasers[i].getWidth() <= player.getX() + player.getWidth() &&
      enemyLasers[i].getY() >= player.getY() && enemyLasers[i].getY() + enemyLasers[i].getHeight() <= player.getY() + player.getHeight()) {
        enemyLasers[i].setHit(true);
        enemyLasers[i].setX(-500);

        player.loseLife();
    }
  }
}

let gameLoop = function() {
  requestAnimationFrame(gameLoop);
  context.clearRect(0, 0, canvas.width, canvas.height);
  player.update(activeKey);
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
  }
  laserHitCheck();
}

init();
gameLoop();

let arrowKeyDown = false;
let spaceDown = false;
document.addEventListener("keydown", (event) => {
  if (arrowKeyDown) return;
  arrowKeyDown = true;

  activeKey = event.keyCode;
  player.animateOn();
});

document.addEventListener("keypress", (event) => {
  if (event.keyCode === 32 && spaceDown == false) {
    player.addLaser();
    spaceDown = true;
  }
});

document.addEventListener("keyup", (event) => {
  activeKey = -1;
  player.animateOff();
  arrowKeyDown = false;
  if (event.keyCode === 32) spaceDown = false;
});
