import { describe, it, expect } from "vitest";
import { dbErrorHint, isDbError } from "./errors";

describe("dbErrorHint", () => {
  it("explains a refused connection, the case that used to read as a network error", () => {
    const hint = dbErrorHint(Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432"), { code: "ECONNREFUSED" }));
    expect(hint).toMatch(/Postgres is not running/);
  });

  it("tells you to run migrations when the tables are missing", () => {
    expect(dbErrorHint({ code: "42P01" })).toMatch(/db:migrate/);
  });

  it("names bad credentials rather than blaming the network", () => {
    expect(dbErrorHint({ code: "28P01" })).toMatch(/username or password/);
  });

  it("unwraps a driver error that carries the socket failure as its cause", () => {
    expect(dbErrorHint({ cause: { code: "ENOTFOUND" } })).toMatch(/could not be resolved/);
  });

  it("does not loop on an error that is its own cause", () => {
    const self: Record<string, unknown> = {};
    self.cause = self;
    expect(dbErrorHint(self)).toBeNull();
  });

  it("does not hang on a cycle of causes", () => {
    const a: Record<string, unknown> = {}; const b: Record<string, unknown> = {};
    a.cause = b; b.cause = a;
    expect(dbErrorHint(a)).toBeNull();
  });

  it("returns null for an ordinary error, so real bugs are not mislabelled", () => {
    expect(dbErrorHint(new Error("boom"))).toBeNull();
    expect(isDbError(new Error("boom"))).toBe(false);
    expect(dbErrorHint(null)).toBeNull();
  });
});
