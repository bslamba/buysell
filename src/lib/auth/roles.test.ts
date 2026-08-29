import { describe, it, expect } from "vitest";
import { atLeast, orgAtLeast } from "./roles";

describe("platform role hierarchy", () => {
  it("lets higher roles satisfy lower requirements", () => {
    expect(atLeast("superadmin", "moderator")).toBe(true);
    expect(atLeast("admin", "moderator")).toBe(true);
    expect(atLeast("moderator", "moderator")).toBe(true);
  });
  it("refuses lower roles", () => {
    expect(atLeast("user", "moderator")).toBe(false);
    expect(atLeast("corporate", "admin")).toBe(false);
    expect(atLeast("moderator", "superadmin")).toBe(false);
  });
  it("refuses an absent role", () => {
    expect(atLeast(undefined, "user")).toBe(false);
  });
});

describe("organisation role hierarchy", () => {
  it("ranks owner above admin above member", () => {
    expect(orgAtLeast("owner", "admin")).toBe(true);
    expect(orgAtLeast("admin", "member")).toBe(true);
    expect(orgAtLeast("member", "admin")).toBe(false);
  });
});
