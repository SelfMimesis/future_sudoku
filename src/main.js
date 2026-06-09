import { Game } from "./game/Game.js";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./game/constants.js";

const stageWrap = document.getElementById("stageWrap");

function applyStageScale() {
  const widthScale = window.innerWidth / DESIGN_WIDTH;
  const heightScale = window.innerHeight / DESIGN_HEIGHT;
  const scale = Math.min(widthScale, heightScale);
  document.documentElement.style.setProperty("--stage-scale", scale.toFixed(4));
  stageWrap.style.width = `${DESIGN_WIDTH * scale}px`;
  stageWrap.style.height = `${DESIGN_HEIGHT * scale}px`;
}

window.addEventListener("resize", applyStageScale, { passive: true });
applyStageScale();

window.addEventListener("DOMContentLoaded", () => {
  const game = new Game(document.getElementById("app"));
  game.init();
});
