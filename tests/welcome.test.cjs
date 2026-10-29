const { getPartOfDay, daysLeftInYear, getWelcomeMessage } = require("../site/js/welcome.js");

describe("getPartOfDay", () => {
  test.each([
    [0, "night"],
    [4, "night"],
    [5, "morning"],
    [11, "morning"],
    [12, "afternoon"],
    [17, "afternoon"],
    [18, "evening"],
    [21, "evening"],
    [22, "night"],
    [23, "night"],
  ])("hour %i is %s", (hour, expected) => {
    expect(getPartOfDay(hour)).toBe(expected);
  });
});

describe("daysLeftInYear", () => {
  test("Jan 1 of a common year has 364 days left", () => {
    expect(daysLeftInYear(new Date(2026, 0, 1))).toBe(364);
  });

  test("Jan 1 of a leap year has 365 days left", () => {
    expect(daysLeftInYear(new Date(2028, 0, 1))).toBe(365);
  });

  test("Dec 31 has 0 days left", () => {
    expect(daysLeftInYear(new Date(2026, 11, 31))).toBe(0);
  });

  test("Oct 29, 2026 has 63 days left", () => {
    expect(daysLeftInYear(new Date(2026, 9, 29))).toBe(63);
  });
});

describe("getWelcomeMessage", () => {
  test("builds the full morning message", () => {
    expect(getWelcomeMessage(new Date(2026, 9, 29, 9, 0))).toBe(
      "Good morning! It's Thursday, and there are 63 days left in 2026."
    );
  });

  test("uses singular 'day' on Dec 30", () => {
    expect(getWelcomeMessage(new Date(2026, 11, 30, 20, 0))).toBe(
      "Good evening! It's Wednesday, and there is 1 day left in 2026."
    );
  });
});
