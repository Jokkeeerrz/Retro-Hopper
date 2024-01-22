import { updateGround, setupGround } from "./ground.js";
import { updateDino, setupDino, getDinoRect, setDinoLose } from "./dino.js";
import {
  updateObstacles,
  setupObstacles,
  getObstacleRects,
} from "./obstacles.js";

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;
const SPEED_SCALE_INCREASE = 0.00001;

const worldElem = document.querySelector("[data-world]");
const scoreElem = document.querySelector("[data-score]");
const highestScoreElem = document.querySelector("[data-highscore]");
const startScreenElem = document.querySelector("[data-start-screen]");
const backgroundMusic = document.getElementById("background-music");
const lose = "./audio/vibrating-thud-39536.mp3";

setPixelToWorldScale();
window.addEventListener("resize", setPixelToWorldScale);
document.addEventListener("keydown", handleStart, { once: true });

function playBackgroundMusic() {
  backgroundMusic.play();
}

function pauseBackgroundMusic() {
  backgroundMusic.pause();
}

function setVolume(volume) {
  backgroundMusic.volume = volume;
}

setVolume(0.2);
playBackgroundMusic();

let lastTime;
let speedScale;
let score;

function update(time) {
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }
  const delta = time - lastTime;

  updateGround(delta, speedScale);
  updateDino(delta, speedScale);
  updateObstacles(delta, speedScale);
  updateSpeedScale(delta);
  updateScore(delta);
  if (checkLose()) return handleLose();

  lastTime = time;
  window.requestAnimationFrame(update);
}

function checkLose() {
  const dinoRect = getDinoRect();

  return getObstacleRects().some((rect) => isCollision(rect, dinoRect));
}

function isCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  );
}

function updateSpeedScale(delta) {
  speedScale += delta * SPEED_SCALE_INCREASE;
}

function updateScore(delta) {
  score += delta * 0.01;
  scoreElem.textContent = Math.floor(score);
}

function handleStart() {
  lastTime = null;
  speedScale = 1.3;
  score = 0;
  setupGround();
  setupDino();
  setupObstacles();

  if (getHighScore() > 0) {
    highestScoreElem.textContent = `Highest Score: ${getHighScore()}`;
  }

  startScreenElem.classList.add("hide");
  window.requestAnimationFrame(update);

  playBackgroundMusic();
}

function handleLose() {
  setDinoLose();

  const loseSFX = new Audio(lose);
  loseSFX.play();
  storeScore();

  setTimeout(() => {
    document.addEventListener("keydown", handleStart, { once: true });
    startScreenElem.classList.remove("hide");
  }, 100);

  pauseBackgroundMusic();
}

function setPixelToWorldScale() {
  let worldToPixelScale;
  if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
    worldToPixelScale = window.innerWidth / WORLD_WIDTH;
  } else {
    worldToPixelScale = window.innerHeight / WORLD_HEIGHT;
  }

  worldElem.style.width = `${WORLD_WIDTH * worldToPixelScale}px`;
  worldElem.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`;
}

function storeScore() {
  const getScore = Math.floor(score);
  console.log(getScore);

  const storedScoreJSON = localStorage.getItem("Score");
  let storedScore = [];

  if (storedScoreJSON) {
    storedScore = JSON.parse(storedScoreJSON);
  }

  storedScore.push(getScore);

  const scoreJSON = JSON.stringify(storedScore);
  localStorage.setItem("Score", scoreJSON);

  console.log(localStorage);

  getHighScore();
}

function getHighScore() {
  const storedScoreJSON = localStorage.getItem("Score");
  let storedScore = [];

  if (storedScoreJSON) {
    storedScore = JSON.parse(storedScoreJSON);
  }

  let highestScore = Math.max(...storedScore);

  if (highestScore <= 0) {
    return;
  }

  console.log(highestScore);
  return highestScore;
}
