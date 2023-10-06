import {
  setCustomProperty,
  incrementCustomProperty,
  getCustomProperty,
} from "./updateCustomProperty.js";

const SPEED = 0.05;
const OBSTACLE_INTERVAL_MIN = 1500;
const OBSTACLE_INTERVAL_MAX = 2500;
const worldElem = document.querySelector("[data-world]");
const flyingObstacleSFX = 'audio/roar-8-bit.mp3'

let nextObstacleTime;

export function setupObstacles() {
  nextObstacleTime = OBSTACLE_INTERVAL_MIN;
  document.querySelectorAll("[data-obstacle]").forEach((obstacle) => {
    obstacle.remove();
  });
}

export function updateObstacles(delta, speedScale) {
  document.querySelectorAll("[data-obstacle]").forEach((obstacle) => {
    incrementCustomProperty(
      obstacle,
      "--left",
      delta * speedScale * SPEED * -1
    );
    if (getCustomProperty(obstacle, "--left") <= -100) {
      obstacle.remove();
    }
  });

  if (nextObstacleTime <= 0) {
    createRandomObstacle();
    nextObstacleTime =
      randomNumberBetween(OBSTACLE_INTERVAL_MIN, OBSTACLE_INTERVAL_MAX) /
      speedScale;
  }
  nextObstacleTime -= delta;
}

export function getObstacleRects() {
  return [...document.querySelectorAll("[data-obstacle]")].map((obstacle) => {
    return obstacle.getBoundingClientRect();
  });
}

const groundObstacleSprites = [
  "imgs/obstacles/ground/obstacle1.png",
  "imgs/obstacles/ground/obstacle2.png",
  "imgs/obstacles/ground/obstacle3.png",
];

const flyingObstacleSprites = [
  "imgs/obstacles/flying/obstacle1.png",
  "imgs/obstacles/flying/obstacle2.png",
  "imgs/obstacles/flying/obstacle3.png",
  "imgs/obstacles/flying/obstacle4.png",
];

function createRandomObstacle() {
  const obstacleType = Math.random() < 0.5 ? "ground" : "flying";
  if (obstacleType === "ground") {
    createGroundObstacle();
  } else {
    createFlyingObstacle();

    const flySFX = new Audio(flyingObstacleSFX);
    flySFX.play();
  }
}

function createGroundObstacle() {
  const obstacle = document.createElement("img");
  obstacle.dataset.obstacle = true;
  obstacle.src = groundObstacleSprites[Math.floor(Math.random() * 3)];
  obstacle.classList.add("obstacle-ground");
  setCustomProperty(obstacle, "--left", 100);
  worldElem.append(obstacle);
}

function createFlyingObstacle() {
  const obstacle = document.createElement("img");
  obstacle.dataset.obstacle = true;
  obstacle.src = flyingObstacleSprites[Math.floor(Math.random() * 4)];
  obstacle.classList.add("obstacle-flying");
  setCustomProperty(obstacle, "--left", 100);
  setCustomProperty(obstacle, "--top", 0.5);
  worldElem.append(obstacle);
}

function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
