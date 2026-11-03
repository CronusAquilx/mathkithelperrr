import { describe, expect, it } from "vitest";
import { initialVisitStage, nextVisitStage, visitDestination } from "./visit";

describe("Every-visit opening rules", () => {
  it("opens Switch on its own home after confirmation", () => {
    expect(visitDestination({console:"off",focus:"games",layout:"switch"})).toBe("/home");
  });
  it("asks extra questions only when the confirmed account needs setup", () => {
    expect(nextVisitStage("login", "setup-needed")).toBe("account-setup");
    expect(nextVisitStage("account-setup", "account-confirmed")).toBe("ready");
    expect(nextVisitStage("ready", "setup-needed")).toBe("ready");
  });
  it("opens Windows on its desktop after confirmation", () => {
    expect(visitDestination({console:"off",focus:"all",layout:"windows"})).toBe("/desktop");
    expect(visitDestination({console:"sony",focus:"all",layout:"windows"})).toBe("/console");
  });
  it("starts each fresh visit at the questions instead of restoring completion", () => {
    expect(initialVisitStage()).toBe("setup");
    const finished = nextVisitStage(nextVisitStage("setup", "choices-complete"), "account-confirmed");
    expect(finished).toBe("ready");
    expect(initialVisitStage()).toBe("setup");
  });
  it("requires login confirmation after choices even for a returning account", () => {
    expect(nextVisitStage("setup", "choices-complete")).toBe("login");
    expect(nextVisitStage("setup", "account-confirmed")).toBe("setup");
    expect(nextVisitStage("login", "account-confirmed")).toBe("ready");
  });
  it("keeps regular layouts and respects games or all content selection", () => {
    expect(visitDestination({console:"off",focus:"games"})).toBe("/games");
    expect(visitDestination({console:"off",focus:"all"})).toBe("/home");
    expect(visitDestination({console:"sony",focus:"games"})).toBe("/console");
    expect(visitDestination({console:"sony",focus:"music"})).toBe("/console/media");
  });
});