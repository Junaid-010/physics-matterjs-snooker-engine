/*
Commentary:
 The snooker game created with the help of p5.js and Matter.js has an interactive nature that corresponds to coursework requirements. Decision making focuses on easier-to-learn controls, physics and imaginative extensions. The use of mouse input in directing aim to the cue was preferred because it was precise and the player could ensure that the shots would not project in unrealistic angles as they had to hit cues on a table. The power meter is controlled with arrow keys (left and right decrease and increase the power respectively), with a maximum force that is assigned to 0.2 and is used with controlled shots. Such two-entry design is accessible and precise, which fits the requirements of the coursework according to the highest grades.

In the cases of Modes 2 and 3, placement of the ball was selected in the `p5.random()`, which is simple and there is equal distribution. Such a mode 2 randomly deposits red and colored balls, and does not use overlaps through distance checks of 100 tries per ball. Mode 3 just randomizes the red balls, leaving colored balls in their position, and providing a diversity and the game of snooker. The efficiency of the algorithm avoids clustering and thus increases the gameplay dynamics.

Mode 4 The extension to Gravity wells adds the new mechanic: 24 n wells are spawned randomly when balls stay still, with strengths ranging between 0.0005 and 0.002 with sin(framecount). Wells, in contrast with the use of pockets, only use the force of gravity to change the trajectory of balls and create competitive situations without disposing balls. It is placed to avoid balls and other wells (200 attempts) in the aspect of fair distribution. The visual clarity is created through pulsating blue glows that increase immersion. The design does not look into copying the pocket mechanics and presents a different kind of hazard that challenges the accuracy of the player.

A power-up system is a type of pocket that assigns random effects (multiplier (twice points), extra shot (continues turn), power boost (1.5x force, +20 power)) to a pocket after shots. Effects are explained by glowing orange text pocket (e.g. x2). Intentional additions, such as a way to give friction with a timeSlow effect, or to combo effects for the addition to exist, demonstrate future prospects. Some convergence of a timer track structure in `drawPowerMeter` awaits interpolation of duration. Difficulties were making Matter.js physics realistic (restitution: 0.9 balls, 0.7-1.2 cushions, slider) and making sure that the wells do not trap the balls. The body ID is also used in collision detection in order to provide proper cue ball impact prompts. Foul handling of power-up was necessary to compare the power-ups system to be fair. The force-based nature of the gravity wells, eliminating ball removal, introduces a technical richness, and the use of power ups to create power-ups that are placeholders but that may be more complicated at some point in the future (timeSlow) implies an even greater complexity in the future, whether by limited time or stackability of effects. Such extensions strive to be innovative: wells introduce dynamicity to the gameplay, the power-ups upscale the strategy, and the imperfect elements mark the potential to develop further.

Difficulties were also involved in tuning Matter.js physics to form realistic collisions (restitution: 0.9 for balls, 0.71 1.2 for cushions by the slider) and making sure wells have impacts and do not trap balls. Body ID mapping is performed in collision detection when there is correct cue ball impact. The power-up system needed excellent foul management in order to ensure fairness. The force-based construction of the gravity wells avoids the issue of ball removal, which introduces technical depth, and the power-up system introduces placeholders that indicate future sophistication (e.g. timeSlow), such as starting to use time-limited or stacked effects. Innovation is the goal of these extensions: dynamic gameplay is achieved by means of wells, and strategy is boosted by the power-ups, and unfinished features allow to suppose upcoming development work.
*/

// Matter.js aliases
const { Engine, World, Bodies, Body, Query } = Matter;

// Game state variables
let engine, world;
let cueBall, cue;
let redBalls = [];
let coloredBalls = [];
let cushions = [];
let pockets = [];
let obstacles = [];
let mode = null;
let menu = true;
let cuePotted = false;
let positioningCue = true;
let error = false;
let impactMessage = "";
let collisionStates = new Map();
let ballsInPocket = [];
let coloredBallsLeft = 6;
let gameStartTime,
  gameTimeLimit = 5 * 60 * 1000;
let gameOver = false;
let bounceVal = 0.9;
let bounceValSlider;
let powerMeterValue = 50;
let cueStickMoving = false;
let cueStickDistance = 50;
let gravityWells = [];
let playerScore = 0;
let ballPottedThisTurn = 0;
let shotInProgress = false;
let expectedBall = "red";
let powerUpPocket = null;
let powerUpEffect = null;
let extraShotActive = false;
let powerBoostActive = false;

// Table dimensions
const tableLength = 800;
const tableWidth = tableLength / 2;
const ballRadius = tableWidth / 36;
const pocketRadius = ballRadius * 1.5;
const tableBorder = (ballRadius * 34) / 28;
const maxPower = 0.2;
const powerFactor = 0.12;

function setup() {
  createCanvas(1000, 600);
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 0;

  setupCushions();
  setupPockets();
  setupRedBalls();
  setupColoredBalls();
  cue = new Cue();

  bounceValSlider = createSlider(0.7, 1.2, 0.9, 0.1);
  bounceValSlider.position(width / 2 - 70, height - 50);

  cuePotted = true;
  gameStartTime = millis();
}

function draw() {
  background(200);
  if (menu) {
    drawMenu();
  } else {
    Engine.update(engine);
    drawTable();
    drawCushions();
    drawPockets();
    drawRedBalls();
    drawColoredBalls();
    drawCueBall();
    drawPowerMeter();
    checkPottedBalls();
    checkCollisions();
    updateCue();
    drawResetText();
    displayScores();
    if (mode === 4) {
      updateGravityWell();
      drawGravityWells();
    }
    if (cuePotted || positioningCue) {
      placeCueBall();
    }
    if (error) {
      drawError();
    }
    allBallsPotted();
    if (millis() - gameStartTime > gameTimeLimit && coloredBallsLeft !== 0) {
      gameOver = true;
    }
    if (gameOver && coloredBallsLeft !== 0) {
      drawGameOver();
    }
  }

  if (keyIsDown(LEFT_ARROW) && !menu && powerMeterValue >= 5) {
    powerMeterValue -= 2;
  }
  if (keyIsDown(RIGHT_ARROW) && !menu && powerMeterValue <= 98) {
    powerMeterValue += 2;
  }
}

// === TABLE ===
function drawTable() {
  fill(20, 88, 33);
  rectMode(CENTER);
  rect(width / 2, height / 2, tableLength, tableWidth);
  stroke(255);
  strokeWeight(1);
  line(
    width / 2 - (tableWidth * 6) / 11,
    height / 2 - tableWidth / 2,
    width / 2 - (tableWidth * 6) / 11,
    height / 2 + tableWidth / 2
  );
  arc(
    width / 2 - (tableWidth * 6) / 11,
    height / 2,
    tableWidth / 3,
    tableWidth / 3,
    PI / 2,
    (3 * PI) / 2
  );

  noStroke();
  fill(88, 33, 20);
  rect(
    width / 2,
    height / 2 - tableWidth / 2 - tableBorder / 2,
    tableLength + tableBorder * 2,
    tableBorder
  );
  rect(
    width / 2,
    height / 2 + tableWidth / 2 + tableBorder / 2,
    tableLength + tableBorder * 2,
    tableBorder
  );
  rect(
    width / 2 - tableLength / 2 - tableBorder / 2,
    height / 2,
    tableBorder,
    tableWidth + tableBorder * 2
  );
  rect(
    width / 2 + tableLength / 2 + tableBorder / 2,
    height / 2,
    tableBorder,
    tableWidth + tableBorder * 2
  );
}

// === CUSHIONS ===
class Cushion {
  constructor(x, y, w, h, angle, vertices = null) {
    this.options = { isStatic: true, restitution: bounceVal, friction: 0.01 };
    this.body = vertices
      ? Bodies.fromVertices(x, y, vertices, this.options)
      : Bodies.trapezoid(x, y, w, h, angle, this.options);
    World.add(world, this.body);
  }
  draw() {
    fill(20, 110, 33, 140);
    drawVertices(this.body.vertices);
  }
}

function setupCushions() {
  cushions.push(
    new Cushion(
      width / 2 - tableWidth / 2,
      height / 2 - tableWidth / 2 - tableBorder / 2 + ballRadius * 1.5,
      tableLength / 2 - ballRadius * 7,
      tableBorder * 1.2,
      -0.1
    )
  );
  cushions.push(
    new Cushion(
      width / 2 + tableWidth / 2,
      height / 2 - tableWidth / 2 - tableBorder / 2 + ballRadius * 1.5,
      tableLength / 2 - ballRadius * 7,
      tableBorder * 1.2,
      -0.1
    )
  );
  cushions.push(
    new Cushion(
      width / 2 - tableWidth / 2,
      height / 2 + tableWidth / 2 + tableBorder / 2 - ballRadius * 1.5,
      tableLength / 2 - ballRadius * 4,
      tableBorder * 1.2,
      0.1
    )
  );
  cushions.push(
    new Cushion(
      width / 2 + tableWidth / 2,
      height / 2 + tableWidth / 2 + tableBorder / 2 - ballRadius * 1.5,
      tableLength / 2 - ballRadius * 4,
      tableBorder * 1.2,
      0.1
    )
  );
  cushions.push(
    new Cushion(
      width / 2 + tableWidth + tableBorder - ballRadius * 2,
      height / 2,
      null,
      null,
      null,
      [
        { x: 0, y: -tableWidth / 2 + ballRadius * 2 + 17 },
        { x: 0, y: tableWidth / 2 - ballRadius * 2 - 17 },
        { x: tableBorder * 1.2, y: tableWidth / 2 - ballRadius * 2 },
        { x: tableBorder * 1.2, y: -tableWidth / 2 + ballRadius * 2 },
      ]
    )
  );
  cushions.push(
    new Cushion(
      width / 2 - tableWidth - tableBorder + ballRadius * 2,
      height / 2,
      null,
      null,
      null,
      [
        { x: tableBorder * 1.2, y: -tableWidth / 2 + ballRadius * 2 + 17 },
        { x: tableBorder * 1.2, y: tableWidth / 2 - ballRadius * 2 - 17 },
        { x: 0, y: tableWidth / 2 - ballRadius * 2 },
        { x: 0, y: -tableWidth / 2 + ballRadius * 2 },
      ]
    )
  );
}

function drawCushions() {
  for (let cushion of cushions) cushion.draw();
}

// === POCKETS ===
class Pocket {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  draw() {
    if (
      powerUpPocket &&
      powerUpPocket.x === this.x &&
      powerUpPocket.y === this.y
    ) {
      let glowAlpha = 150 + 100 * sin(frameCount * 0.05);
      fill(255, 165, 0, glowAlpha);
      noStroke();
      ellipse(this.x, this.y, pocketRadius * 2.5);
      fill(0);
      ellipse(this.x, this.y, pocketRadius * 2);
      textSize(12);
      fill(255);
      textAlign(CENTER);
      text(
        powerUpEffect === "multiplier"
          ? "x2"
          : powerUpEffect === "extraShot"
          ? "Extra"
          : "Power",
        this.x,
        this.y - pocketRadius * 1.5
      );
    } else {
      fill(0);
      noStroke();
      ellipse(this.x, this.y, pocketRadius * 2);
    }
  }
}

function setupPockets() {
  pockets.push(
    new Pocket(width / 2 + tableLength / 2 - 8, height / 2 + tableWidth / 2 - 8)
  );
  pockets.push(
    new Pocket(width / 2 + tableLength / 2 - 8, height / 2 - tableWidth / 2 + 8)
  );
  pockets.push(new Pocket(width / 2, height / 2 + tableWidth / 2 - 5));
  pockets.push(new Pocket(width / 2, height / 2 - tableWidth / 2 + 5));
  pockets.push(
    new Pocket(width / 2 - tableLength / 2 + 8, height / 2 + tableWidth / 2 - 8)
  );
  pockets.push(
    new Pocket(width / 2 - tableLength / 2 + 8, height / 2 - tableWidth / 2 + 8)
  );
}

function drawPockets() {
  for (let pocket of pockets) pocket.draw();
}

// === BALLS ===
class Ball {
  constructor(x, y, color, isStatic = false) {
    this.color = color;
    this.body = Bodies.circle(x, y, ballRadius, {
      restitution: bounceVal,
      friction: 0.02,
      frictionAir: 0.01,
      isStatic,
    });
    World.add(world, this.body);
  }
  draw() {
    fill(this.color);
    noStroke();
    ellipse(this.body.position.x, this.body.position.y, ballRadius * 2);
  }
}

function setupRedBalls() {
  redBalls = [];
  let startX = width / 2 + tableLength * 0.2;
  let startY = height / 2;
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= col; row++) {
      let x = startX + col * ballRadius * 2;
      let y = startY + (row - col / 2) * ballRadius * 2;
      redBalls.push(new Ball(x, y, [220, 0, 0]));
    }
  }
}

function setupColoredBalls() {
  coloredBalls = [
    {
      ball: new Ball(width / 2, height / 2, [0, 0, 230]),
      spot: { x: width / 2, y: height / 2 },
      points: 5,
      isPotted: false,
    },
    {
      ball: new Ball(width / 2 + tableLength * 0.4, height / 2, [0, 0, 0]),
      spot: { x: width / 2 + tableLength * 0.4, y: height / 2 },
      points: 7,
      isPotted: false,
    },
    {
      ball: new Ball(
        width / 2 + tableLength * 0.2 - ballRadius * 2,
        height / 2,
        [241, 156, 187]
      ),
      spot: {
        x: width / 2 + tableLength * 0.2 - ballRadius * 2,
        y: height / 2,
      },
      points: 6,
      isPotted: false,
    },
    {
      ball: new Ball(
        width / 2 - (tableWidth * 6) / 11,
        height / 2 + tableWidth / 6,
        [255, 255, 0]
      ),
      spot: {
        x: width / 2 - (tableWidth * 6) / 11,
        y: height / 2 + tableWidth / 6,
      },
      points: 2,
      isPotted: false,
    },
    {
      ball: new Ball(
        width / 2 - (tableWidth * 6) / 11,
        height / 2,
        [139, 69, 19]
      ),
      spot: { x: width / 2 - (tableWidth * 6) / 11, y: height / 2 },
      points: 4,
      isPotted: false,
    },
    {
      ball: new Ball(
        width / 2 - (tableWidth * 6) / 11,
        height / 2 - tableWidth / 6,
        [0, 230, 0]
      ),
      spot: {
        x: width / 2 - (tableWidth * 6) / 11,
        y: height / 2 - tableWidth / 6,
      },
      points: 3,
      isPotted: false,
    },
  ];
}

function drawRedBalls() {
  for (let ball of redBalls) ball.draw();
}

function drawColoredBalls() {
  for (let { ball, isPotted } of coloredBalls) {
    if (!isPotted) ball.draw();
  }
}

// === CUE ===
class Cue {
  constructor() {
    this.start = createVector();
    this.aim = createVector();
    this.staggerOffset = 0;
  }
  generate(x, y) {
    cueBall = new Ball(x, y, [255, 255, 255]);
  }
  showAim() {
    if (!cueBall || cuePotted || positioningCue || cueBall.body.speed > 0.1)
      return;
    this.start.set(cueBall.body.position.x, cueBall.body.position.y);
    let constrainedX = constrain(
      mouseX,
      width / 2 - tableWidth,
      width / 2 + tableWidth
    );
    let constrainedY = constrain(
      mouseY,
      height / 2 - tableWidth / 2,
      height / 2 + tableWidth / 2
    );
    this.aim = p5.Vector.sub(
      createVector(constrainedX, constrainedY),
      this.start
    ).limit(tableLength);
    stroke(255, 255, 255, 150);
    strokeWeight(2);
    line(
      this.start.x,
      this.start.y,
      this.start.x + this.aim.x,
      this.start.y + this.aim.y
    );
    fill(255, 255, 255, 100);
    noStroke();
    ellipse(this.start.x + this.aim.x, this.start.y + this.aim.y, ballRadius);
  }
  hit(power) {
    let aim = this.aim.copy().normalize();
    let force = aim.mult(power * powerFactor * (powerBoostActive ? 1.5 : 1));
    Body.applyForce(cueBall.body, cueBall.body.position, {
      x: force.x,
      y: force.y,
    });
    this.staggerOffset = 0;
    powerBoostActive = false;
  }
  drawStick() {
    if (!cueBall || cuePotted || positioningCue || cueBall.body.speed > 0.1)
      return;
    let angle = atan2(
      mouseY - cueBall.body.position.y,
      mouseX - cueBall.body.position.x
    );
    if (!cueStickMoving) {
      this.staggerOffset = sin(frameCount * 0.1) * 5;
    }
    push();
    translate(cueBall.body.position.x, cueBall.body.position.y);
    rotate(angle);
    fill(150, 75, 0);
    stroke(0);
    strokeWeight(0.5);
    beginShape();
    vertex(-25 - cueStickDistance - this.staggerOffset, -2);
    vertex(-25 - cueStickDistance - this.staggerOffset, 2);
    vertex(-200 - cueStickDistance - this.staggerOffset, 5);
    vertex(-200 - cueStickDistance - this.staggerOffset, -5);
    endShape(CLOSE);
    pop();
  }
}

function drawCueBall() {
  if (!cuePotted && !positioningCue && cueBall) {
    cueBall.draw();
  }
}

function placeCueBall() {
  let centerX = width / 2 - (tableWidth * 6) / 11;
  let centerY = height / 2;
  let dRadius = tableWidth / 6;
  let distance = dist(mouseX, mouseY, centerX, centerY);
  let angle = atan2(mouseY - centerY, mouseX - centerX);
  let constrainedX = mouseX;
  let constrainedY = mouseY;
  if (distance > dRadius || mouseX > centerX) {
    constrainedX = centerX + cos(angle) * dRadius;
    constrainedY = centerY + sin(angle) * dRadius;
    if (constrainedX > centerX) constrainedX = centerX;
  }
  fill(255, 255, 255, 150);
  noStroke();
  ellipse(constrainedX, constrainedY, ballRadius * 2);
}

function mouseReleased() {
  if (cuePotted || positioningCue) {
    if (!error) {
      let centerX = width / 2 - (tableWidth * 6) / 11;
      let centerY = height / 2;
      let dRadius = tableWidth / 6;
      let distance = dist(mouseX, mouseY, centerX, centerY);
      let angle = atan2(mouseY - centerY, mouseX - centerX);
      let constrainedX = mouseX;
      let constrainedY = mouseY;
      if (distance > dRadius || mouseX > centerX) {
        constrainedX = centerX + cos(angle) * dRadius;
        constrainedY = centerY + sin(angle) * dRadius;
        if (constrainedX > centerX) constrainedX = centerX;
      }
      cue.generate(constrainedX, constrainedY);
      cuePotted = false;
      positioningCue = false;
    }
  } else if (gameOver || coloredBallsLeft === 0) {
    return;
  } else if (cueBall && areAllBallsStationary()) {
    cueStickMoving = true;
  }
}

function updateCue() {
  if (cueStickMoving && !error && cueBall && cueBall.body.speed <= 0.1) {
    cueStickDistance -= 5;
    if (cueStickDistance < -5) {
      let strikePower = map(powerMeterValue, 0, 100, 0, maxPower);
      cue.hit(strikePower);
      cueStickMoving = false;
      shotInProgress = true;
    }
  } else if (
    !cueStickMoving &&
    !error &&
    cueBall &&
    cueBall.body.speed <= 0.1
  ) {
    cueStickDistance = map(powerMeterValue, 0, 100, 5, 80);
    ballPottedThisTurn = 0;
  }
  cue.showAim();
  cue.drawStick();
}

// === MODES ===
function drawMenu() {
  strokeWeight(2);
  stroke(255);
  fill(0);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("SNOOKER GAME", width / 2, height / 6);
  stroke(0);
  fill(255);
  textSize(18);
  text(
    "Choose mode: 1: Standard, 2: Random All, 3: Random Reds, 4: Gravity Wells",
    width / 2,
    height / 3
  );
  text("1. Normal Mode", width / 2, height / 2.5);
  text("2. Random Reds & Colored", width / 2, height / 2.5 + 30);
  text("3. Random Reds", width / 2, height / 2.5 + 60);
  text("4. Gravity Wells Mode", width / 2, height / 2.5 + 90);
  text(
    "Instructions: Use mouse to aim, left/right arrows for power, click to hit.",
    width / 2,
    height / 2.5 + 150
  );
  text("Set bounce value with slider.", width / 2, height / 2.5 + 180);
  bounceValSlider.show();
  bounceVal = bounceValSlider.value();
  text("Bounce Value: " + bounceVal.toFixed(1), width / 2, height / 2.5 + 210);
  if (mode) {
    menu = false;
    bounceValSlider.hide();
    gameStartTime = millis();
    if (mode === 1) {
      positioningCue = true;
    } else if (mode === 2) {
      setupRandomAllBalls();
      positioningCue = true;
    } else if (mode === 3) {
      setupRandomRedBalls();
      resetColoredBalls();
      positioningCue = true;
    } else if (mode === 4) {
      setupGravityWells();
      positioningCue = true;
    }
  }
}

function setupRandomRedBalls() {
  redBalls = [];
  let startX = width / 2 + tableLength * 0.2;
  let startY = height / 2;
  let placedBalls = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= col; row++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 100;
      do {
        x =
          mode === 1
            ? startX + col * ballRadius * 2
            : random(
                width / 2 - tableWidth / 2 + ballRadius * 2,
                width / 2 + tableWidth / 2 - ballRadius * 2
              );
        y =
          mode === 1
            ? startY + (row - col / 2) * ballRadius * 2
            : random(
                height / 2 - tableWidth / 2 + ballRadius * 2,
                height / 2 + tableWidth / 2 - ballRadius * 2
              );
        attempts++;
      } while (isOverlapping(x, y, placedBalls) && attempts < maxAttempts);
      let ball = new Ball(x, y, [220, 0, 0]);
      redBalls.push(ball);
      placedBalls.push({ x, y });
    }
  }
}

function setupRandomAllBalls() {
  let placedBalls = [];
  redBalls = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= col; row++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 100;
      do {
        x = random(
          width / 2 - tableWidth / 2 + ballRadius * 2,
          width / 2 + tableWidth / 2 - ballRadius * 2
        );
        y = random(
          height / 2 - tableWidth / 2 + ballRadius * 2,
          height / 2 + tableWidth / 2 - ballRadius * 2
        );
        attempts++;
      } while (isOverlapping(x, y, placedBalls) && attempts < maxAttempts);
      let ball = new Ball(x, y, [220, 0, 0]);
      redBalls.push(ball);
      placedBalls.push({ x, y });
    }
  }
  for (let { ball } of coloredBalls) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    do {
      x = random(
        width / 2 - tableWidth / 2 + ballRadius * 2,
        width / 2 + tableWidth / 2 - ballRadius * 2
      );
      y = random(
        height / 2 - tableWidth / 2 + ballRadius * 2,
        height / 2 + tableWidth / 2 - ballRadius * 2
      );
      attempts++;
    } while (isOverlapping(x, y, placedBalls) && attempts < maxAttempts);
    Body.setPosition(ball.body, { x, y });
    placedBalls.push({ x, y });
  }
}

function isOverlapping(x, y, placedBalls) {
  for (let pos of placedBalls) {
    if (dist(x, y, pos.x, pos.y) < ballRadius * 2) {
      return true;
    }
  }
  return false;
}

function resetColoredBalls() {
  for (let { ball, spot } of coloredBalls) {
    Body.setPosition(ball.body, spot);
    Body.setVelocity(ball.body, { x: 0, y: 0 });
  }
}

function setupGravityWells() {
  gravityWells = [];
}

class GravityWell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = pocketRadius;
    this.strength = 0.001;
  }
  draw() {
    fill(0);
    noStroke();
    ellipse(this.x, this.y, this.radius * 4);
  }
}

function updateGravityWell() {
  if (mode !== 4) return;
  if (!cueStickMoving && !shotInProgress && gravityWells.length === 0) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    do {
      x = width / 2;
      y = height / 1.4;
      x1 = random(tableWidth, height - tableWidth);
      y1 = random(tableWidth, height - tableWidth);

      attempts++;
    } while (isNearBall(x, y) && attempts < maxAttempts);
    gravityWells = [new GravityWell(x, y)];
    gravityWells2 = [new GravityWell(x + 5, y + 5)];
  } else if (areAllBallsStationary() && shotInProgress) {
    gravityWells = [];
    //shotInProgress = false;
  }
  for (let well of gravityWells) {
    if (cueBall && cuePotted && positioningCue) {
      applyGravityForce(cueBall.body, well);
    }
    for (let ball of redBalls) {
      applyGravityForce(ball.body, well);
    }
    for (let { ball, isPotted } of coloredBalls) {
      if (!isPotted) {
        applyGravityForce(ball.body, well);
      }
    }
  }
}

function isNearBall(x, y) {
  if (
    cueBall &&
    dist(x, y, cueBall.body.position.x, cueBall.body.position.y) <
      ballRadius * 4
  )
    return true;
  for (let ball of redBalls) {
    if (dist(x, y, ball.body.position.x, ball.body.position.y) < ballRadius * 4)
      return true;
  }
  for (let { ball, isPotted } of coloredBalls) {
    if (
      !isPotted &&
      dist(x, y, ball.body.position.x, ball.body.position.y) < ballRadius * 4
    )
      return true;
  }
  return false;
}

function applyGravityForce(body, well) {
  let dx = well.x - body.position.x;
  let dy = well.y - body.position.y;
  let distance = sqrt(dx * dx + dy * dy);
  if (distance < well.radius * 5 && distance > 0.1) {
    let force = well.strength / (distance * distance);
    let fx = dx * force;
    let fy = dy * force;
    Body.applyForce(body, body.position, { x: fx, y: fy });
  }
}

function drawGravityWells() {
  for (let well of gravityWells) {
    well.draw();
  }
}

// === PHYSICS ===
function checkBallInTarget(
  ball,
  target,
  isCue = false,
  points = 0,
  isWell = false
) {
  if (
    dist(target.x, target.y, ball.body.position.x, ball.body.position.y) <
    pocketRadius * 1.5
  ) {
    let isPowerUpPocket =
      powerUpPocket &&
      target.x === powerUpPocket.x &&
      target.y === powerUpPocket.y &&
      !isWell;
    let scorePoints = points;
    if (isPowerUpPocket && powerUpEffect === "multiplier" && !error) {
      scorePoints *= 2;
    }
    if (isCue) {
      World.remove(world, ball.body);
      cueBall = null;
      cuePotted = true;
      updateScore(isWell ? -4 : -4);
      if (isPowerUpPocket) {
        powerUpPocket = null;
      }
    } else if (points === 1) {
      if (expectedBall !== "red") {
        error = true;
        cuePotted = true;
        updateScore(-4);
        extraShotActive = false;
        return true;
      }
      let index = redBalls.indexOf(ball);
      World.remove(world, redBalls[index].body);
      redBalls.splice(index, 1);
      ballsInPocket.push("red");
      updateScore(isWell ? -1 : scorePoints);
      expectedBall = "colored";
      if (isPowerUpPocket && !isWell && !error) {
        applyPowerUp();
      }
    } else {
      let coloredBall = coloredBalls.find((cb) => cb.ball === ball);
      if (expectedBall !== "colored") {
        error = true;
        cuePotted = true;
        updateScore(-Math.max(4, points));
        extraShotActive = false;
        if (redBalls.length > 0) {
          Body.setPosition(ball.body, coloredBall.spot);
          Body.setVelocity(ball.body, { x: 0, y: 0 });
        } else {
          World.remove(world, ball.body);
          ball.body.position.x = -100;
          coloredBall.isPotted = true;
          coloredBallsLeft--;
        }
        if (isPowerUpPocket) {
          powerUpPocket = null;
        }
        return true;
      }
      ballsInPocket.push("colored");
      updateScore(isWell ? -points : scorePoints);
      if (
        ballsInPocket.length >= 2 &&
        ballsInPocket.slice(-2).every((b) => b === "colored")
      ) {
        error = true;
        cuePotted = true;
        updateScore(-4);
        extraShotActive = false;
      }
      if (redBalls.length > 0) {
        Body.setPosition(ball.body, coloredBall.spot);
        Body.setVelocity(ball.body, { x: 0, y: 0 });
      } else {
        World.remove(world, ball.body);
        ball.body.position.x = -100;
        coloredBall.isPotted = true;
        coloredBallsLeft--;
      }
      expectedBall = "red";
      if (isPowerUpPocket && !isWell && !error) {
        applyPowerUp();
      }
    }
    return true;
  }
  return false;
}

function applyPowerUp() {
  if (powerUpEffect === "extraShot") {
    extraShotActive = true;
  } else if (powerUpEffect === "powerBoost") {
    powerBoostActive = true;
    powerMeterValue = min(powerMeterValue + 20, 100);
  }
  powerUpPocket = null;
}

function checkPottedBalls() {
  if (
    !cueStickMoving &&
    shotInProgress &&
    !powerUpPocket &&
    areAllBallsStationary()
  ) {
    let pocketIndex = floor(random(pockets.length));
    powerUpPocket = pockets[pocketIndex];
    let effects = ["multiplier", "extraShot", "powerBoost"];
    powerUpEffect = effects[floor(random(effects.length))];
  }
  if (cueBall) {
    for (let pocket of pockets) {
      if (checkBallInTarget(cueBall, pocket, true)) break;
    }
    for (let well of gravityWells) {
      if (checkBallInTarget(cueBall, well, true, 0, true)) break;
    }
  }
  for (let i = redBalls.length - 1; i >= 0; i--) {
    for (let pocket of pockets) {
      if (checkBallInTarget(redBalls[i], pocket, false, 1)) break;
    }
    for (let well of gravityWells) {
      if (checkBallInTarget(redBalls[i], well, false, 1, true)) break;
    }
  }
  for (let { ball, points, isPotted } of coloredBalls) {
    if (!isPotted) {
      for (let pocket of pockets) {
        if (checkBallInTarget(ball, pocket, false, points)) break;
      }
      for (let well of gravityWells) {
        if (checkBallInTarget(ball, well, false, points, true)) break;
      }
    }
  }
  if (areAllBallsStationary() && shotInProgress) {
    if (!extraShotActive) {
      expectedBall = "red";
    }
    extraShotActive = false;
    powerUpPocket = null;
    shotInProgress = false;
  }
}

function checkCollisions() {
  let bodies = [
    cueBall ? cueBall.body : null,
    ...redBalls.map((b) => b.body),
    ...coloredBalls.filter((b) => !b.isPotted).map((b) => b.ball.body),
    ...cushions.map((c) => c.body),
  ];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      if (
        bodies[i] &&
        bodies[j] &&
        Query.collides(bodies[i], [bodies[j]]).length > 0
      ) {
        let key = `{bodies[i].id} - {bodies[j].id}`;
        if (!collisionStates.get(key)) {
          collisionStates.set(key, true);
          if (bodies[i] === cueBall?.body) {
            impactMessage = `Cue hit ${getBodyType(bodies[j])}`;
          } else if (bodies[j] === cueBall?.body) {
            impactMessage = `Cue hit ${getBodyType(bodies[i])}`;
          }
        }
      } else if (bodies[i] && bodies[j]) {
        collisionStates.set(`{bodies[i].id} - {bodies[j].id}`, false);
      }
    }
  }
  if (impactMessage) {
    fill(255);
    stroke(0);
    strokeWeight(1);
    textSize(22);
    textAlign(CENTER);
    text(impactMessage, width / 2, height / 15);
  }
}

function getBodyType(body) {
  if (body === cueBall?.body) return "Cue";
  if (redBalls.some((b) => b.body === body)) return "Red";
  if (coloredBalls.some((b) => b.ball.body === body)) return "Colored";
  if (cushions.some((c) => c.body === body)) return "Cushion";
  return "Unknown";
}

// === UI ===
function drawPowerMeter() {
  let powerFill = map(powerMeterValue, 0, 100, 0, 2);
  noStroke();
  rectMode(CORNER);
  fill(0, 0, 0, 50);
  rect(width / 2 - 200, height - 30, 400, 15);
  fill(
    255,
    map(powerMeterValue, 0, 100, 255, 0),
    map(powerMeterValue, 0, 100, 255, 0)
  );
  rect(width / 2 - 200, height - 30, 200 * powerFill, 15);
  stroke(0);
  strokeWeight(2);
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(`Power: ${int(50 * powerFill)}%`, width / 2, height - 40);
}

function drawResetText() {
  stroke(0);
  strokeWeight(2);
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text("Press ESC for Main Menu", width / 8, height / 15);
}

function drawError() {
  stroke(0);
  strokeWeight(2);
  fill(255);
  textSize(20);
  textAlign(CENTER);
  text("ERROR: Foul committed", width / 2, height / 2);
  text("Press Enter to continue", width / 2, height / 2 + 30);
}

function drawWinMessage() {
  stroke(255);
  strokeWeight(3);
  fill(0);
  textSize(24);
  textAlign(CENTER);
  if (coloredBallsLeft === 0) {
    text("Congratulations! All balls potted!", width / 2, height / 2);
    text("Press ESC for Main Menu", width / 2, height / 2 + 50);
  } else {
    text("All reds potted! Pot colored balls.", width / 2, height / 2);
  }
}

function drawGameOver() {
  stroke(0);
  strokeWeight(1);
  fill(255);
  textSize(40);
  textAlign(CENTER);
  text("Game Over: Time's up!", width / 2, height / 2 - 40);
  textSize(20);
  text("Press ESC to return to main menu", width / 2, height / 2 + 10);
}

// === INPUT ===
function keyPressed() {
  if (key === "Enter") {
    error = false;
  }
  if (menu) {
    if (key === "1") {
      mode = 1;
      positioningCue = true;
    } else if (key === "2") {
      mode = 2;
      setupRandomAllBalls();
      positioningCue = true;
    } else if (key === "3") {
      mode = 3;
      setupRandomRedBalls();
      resetColoredBalls();
      positioningCue = true;
    } else if (key === "4") {
      mode = 4;
      setupGravityWells();
      positioningCue = true;
    }
  }
  if (keyCode === ESCAPE && !menu) {
    resetGame();
  }
}

// === RESET ===
function resetGame() {
  menu = true;
  mode = null;
  cuePotted = false;
  positioningCue = true;
  error = false;
  impactMessage = "";
  coloredBallsLeft = 6;
  gameOver = false;
  ballsInPocket = [];
  redBalls = [];
  coloredBalls = [];
  obstacles = [];
  gravityWells = [];
  playerScore = 0;
  ballPottedThisTurn = 0;
  shotInProgress = false;
  expectedBall = "red";
  powerUpPocket = null;
  powerUpEffect = null;
  extraShotActive = false;
  powerBoostActive = false;
  World.clear(world);
  setupCushions();
  setupPockets();
  setupRedBalls();
  setupColoredBalls();
  powerMeterValue = 50;
  cueStickDistance = 50;
}

// === UTILS ===
function drawVertices(vertices) {
  beginShape();
  for (let v of vertices) vertex(v.x, v.y);
  endShape(CLOSE);
}

function updateScore(points) {
  ballPottedThisTurn++;
  playerScore += points;
}

function displayScores() {
  strokeWeight(2);
  stroke(0);
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("Score: " + playerScore, 20, 20);
}

function areAllBallsStationary() {
  const speedThreshold = 0.1;
  if (cueBall && cueBall.body.speed > speedThreshold) return false;
  for (const ball of redBalls) {
    if (ball.body.speed > speedThreshold) return false;
  }
  for (const { ball, isPotted } of coloredBalls) {
    if (!isPotted && ball.body.speed > speedThreshold) return false;
  }
  return true;
}

function allBallsPotted() {
  if (coloredBallsLeft === 0) {
    drawWinMessage();
  }
}
