import { setupGround } from "./ground.js";
import { setupDino } from "./dino.js";
import { setupObstacles } from "./obstacles.js";
import {
  lastTime,
  speedScale,
  score,
  startScreenElem,
  update,
  playBackgroundMusic,
} from "./script.js";

export function handleStart() {
  lastTime = null;
  speedScale = 1.3;
  score = 0;
  setupGround();
  setupDino();
  setupObstacles();
  startScreenElem.classList.add("hide");
  window.requestAnimationFrame(update);

  playBackgroundMusic();
}
