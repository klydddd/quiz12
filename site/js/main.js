"use strict";

const countEl = document.getElementById("count");
let count = 0;

function render() {
  countEl.textContent = String(count);
}

document.getElementById("increment").addEventListener("click", () => {
  count += 1;
  render();
});

document.getElementById("decrement").addEventListener("click", () => {
  count -= 1;
  render();
});

document.getElementById("reset").addEventListener("click", () => {
  count = 0;
  render();
});

const loadedAt = new Date();
const timeEl = document.getElementById("loaded-at");
timeEl.dateTime = loadedAt.toISOString();
timeEl.textContent = loadedAt.toLocaleString();

render();
