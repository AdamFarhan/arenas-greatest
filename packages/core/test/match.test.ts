import { describe, expect, it } from "vitest";
import {
  addScore,
  createMatch,
  endGameEarly,
  getActiveGame,
  getCurrentGameHistory,
  manuallyAdjustScore,
  startGame
} from "../src";

describe("match logic", () => {
  it("adds one point with a scoring reason", () => {
    const match = startGame(createMatch("match-1"), "player", 8);
    const updated = addScore(match, "player", "holding", "2026-06-06T12:00:00.000Z");

    expect(getActiveGame(updated).score.player).toBe(1);
    expect(getActiveGame(updated).events[0]?.type).toBe("holding");
  });

  it("ends a game at the selected winning point", () => {
    let match = startGame(createMatch("match-1"), "player", 8);

    for (let i = 0; i < 8; i += 1) {
      match = addScore(match, "opponent", "ability");
    }

    expect(match.games[0]?.winner).toBe("opponent");
    expect(match.games[0]?.endReason).toBe("points");
    expect(match.wins.opponent).toBe(1);
  });

  it("ends an active game early by concession", () => {
    let match = startGame(createMatch("match-1"), "player", 8);
    match = addScore(match, "player", "holding");
    match = addScore(match, "opponent", "ability");

    const updated = endGameEarly(match, "opponent");

    expect(updated.games[0]?.winner).toBe("opponent");
    expect(updated.games[0]?.endReason).toBe("concession");
    expect(updated.wins.opponent).toBe(1);
    expect(() => getActiveGame(updated)).toThrow("There is no active game.");
  });

  it("ends the match after two game wins", () => {
    let match = startGame(createMatch("match-1"), "player", 8);

    for (let i = 0; i < 8; i += 1) {
      match = addScore(match, "player", "holding");
    }

    match = startGame(match, "opponent", 9);

    for (let i = 0; i < 9; i += 1) {
      match = addScore(match, "player", "conquering");
    }

    expect(match.winner).toBe("player");
    expect(match.wins.player).toBe(2);
  });

  it("ends the match after a second concession game win", () => {
    let match = startGame(createMatch("match-1"), "player", 8);
    match = endGameEarly(match, "player");
    match = startGame(match, "opponent", 9);
    match = endGameEarly(match, "player");

    expect(match.winner).toBe("player");
    expect(match.wins.player).toBe(2);
    expect(match.games[1]?.endReason).toBe("concession");
  });

  it("logs manual score edits as adjustment events", () => {
    const match = startGame(createMatch("match-1"), "player", 10);
    const updated = manuallyAdjustScore(match, "player", 3, "2026-06-06T12:00:00.000Z");
    const event = getActiveGame(updated).events[0];

    expect(getActiveGame(updated).score.player).toBe(3);
    expect(event?.type).toBe("manual_adjustment");
    expect(event?.pointsDelta).toBe(3);
  });

  it("derives current game history with resulting scores", () => {
    let match = startGame(createMatch("match-1"), "player", 10);
    match = addScore(match, "player", "holding", "2026-06-06T12:00:00.000Z");
    match = addScore(match, "opponent", "ability", "2026-06-06T12:01:00.000Z");

    const history = getCurrentGameHistory(getActiveGame(match));

    expect(history).toMatchObject([
      { label: "Holding", score: "1-0" },
      { label: "Ability", score: "1-1" }
    ]);
  });
});
