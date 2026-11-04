import { beforeEach, describe, expect, it, vi } from "vitest";
import { actOn, installGame, loadLibrary, playGame, uninstallGame } from "./store";
import { APPS, CATALOG, fromArcade, launchPath } from "./catalog";
const saved = (user: string) => JSON.parse(localStorage.getItem(`console-library:${user}`) ?? "{}");
describe("Console per-user library", () => {
 beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
 it("opens Music, Movies and AI inside the current visit", () => {
  loadLibrary("media-launch-test");
  const navigate = vi.fn();
  const lib = { installed: [], wishlist: [], lastPlayed: null, progress: {} };
  for (const app of APPS.slice(0, 3)) actOn(app, lib, navigate);
  expect(navigate.mock.calls).toEqual([["/music"], ["/movies"], ["/chat"]]);
  vi.useRealTimers();
 });
 it("plays an installed regular game without reloading the document", () => {
  loadLibrary("arcade-launch-test");
  const game = fromArcade({ id: 1, name: "OvO", author: "", file: "ovo.html", cover: "" });
  const navigate = vi.fn();
  actOn(game, { installed: [game.id], wishlist: [], lastPlayed: null, progress: {} }, navigate);
  expect(navigate).toHaveBeenCalledWith("/console/arcade?game=ovo.html");
  expect(saved("arcade-launch-test").lastPlayed).toBe(game.id);
  vi.useRealTimers();
 });
 it("keeps cloud games in their standalone player tab", () => {
  loadLibrary("cloud-launch-test");
  const game = CATALOG.find(g => g.url === "https://fiveplay.lol/");
  if (!game) throw new Error("Missing GTA V");
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  const navigate = vi.fn();
  playGame(game, navigate);
  expect(open).toHaveBeenCalledWith(launchPath(game), "_blank", "noopener");
  expect(navigate).not.toHaveBeenCalled();
  open.mockRestore();
  vi.useRealTimers();
 });
 it("finishes an install then persists and removes it on uninstall", () => {
  loadLibrary("install-test"); installGame("arcade:1-fix2.html"); vi.advanceTimersByTime(10000);
  expect(saved("install-test").installed).toEqual(["arcade:1-fix2.html"]);
  uninstallGame("arcade:1-fix2.html"); expect(saved("install-test").installed).toEqual([]);
  vi.useRealTimers();
 });
 it("does not carry a pending installation into another user's library", () => {
  loadLibrary("owner-a"); installGame("cloud:gta"); loadLibrary("owner-b"); vi.advanceTimersByTime(10000);
  installGame("arcade:2-fix3.html"); vi.advanceTimersByTime(10000);
  expect(saved("owner-b").installed).toEqual(["arcade:2-fix3.html"]);
  expect(localStorage.getItem("console-library:owner-a")).toBeNull();
  vi.useRealTimers();
 });
});
