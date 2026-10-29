"use strict";

const DAY_MS = 24 * 60 * 60 * 1000;

function getPartOfDay(hour) {
  if (hour < 5) return "night";
  if (hour < 11) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function daysLeftInYear(date) {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const newYear = Date.UTC(date.getFullYear() + 1, 0, 1);
  return Math.round((newYear - today) / DAY_MS) - 1;
}

// Builds the banner shown when the page loads, e.g.
// "Good morning! It's Thursday, and there are 63 days left in 2026."
function getWelcomeMessage(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const left = daysLeftInYear(date);
  const days = left === 1 ? "is 1 day" : `are ${left} days`;
  return `Good ${getPartOfDay(date.getHours())}! It's ${weekday}, and there ${days} left in ${date.getFullYear()}.`;
}

function showWelcome() {
  document.getElementById("welcome").textContent = getWelcomeMessage(new Date());
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", showWelcome);
}

if (typeof module !== "undefined") {
  module.exports = { getPartOfDay, daysLeftInYear, getWelcomeMessage };
}
