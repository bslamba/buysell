import { describe, it, expect } from "vitest";
import { normaliseEmail, isValidEmail, ageInYears, checkDateOfBirth, MIN_AGE } from "./email";

describe("normaliseEmail — one person, one account", () => {
  it("folds the Gmail aliases that would otherwise be four accounts", () => {
    const one = normaliseEmail("garry@gmail.com");
    for (const variant of ["Garry@Gmail.com", "g.a.r.r.y@gmail.com", "garry+worthit@gmail.com", "  garry@googlemail.com "]) {
      expect(normaliseEmail(variant)).toBe(one);
    }
    expect(one).toBe("garry@gmail.com");
  });

  it("folds +tags at providers that use them for filing", () => {
    expect(normaliseEmail("a+one@outlook.com")).toBe("a@outlook.com");
    expect(normaliseEmail("a+one@icloud.com")).toBe("a@icloud.com");
  });

  it("does NOT strip dots outside Gmail — elsewhere they are different mailboxes", () => {
    expect(normaliseEmail("a.b@outlook.com")).toBe("a.b@outlook.com");
  });

  it("leaves unknown domains alone, so two colleagues are never merged", () => {
    expect(normaliseEmail("First.Last+x@gryffinglobal.com")).toBe("first.last+x@gryffinglobal.com");
  });

  it("keeps genuinely different people apart", () => {
    expect(normaliseEmail("garry@gmail.com")).not.toBe(normaliseEmail("harry@gmail.com"));
    expect(normaliseEmail("a@gmail.com")).not.toBe(normaliseEmail("a@outlook.com"));
  });

  it("rejects what is not an address", () => {
    for (const bad of ["", "  ", "no-at-sign", "@gmail.com", "a@", "a b@gmail.com", "a..b@x.com", "a@nodot"]) {
      expect(normaliseEmail(bad)).toBeNull();
    }
  });

  it("rejects an address that is nothing but a tag", () => {
    expect(normaliseEmail("+tag@gmail.com")).toBeNull();
  });

  it("agrees with isValidEmail on ordinary addresses", () => {
    expect(isValidEmail("garry@gryffinglobal.com")).toBe(true);
    expect(isValidEmail("garry@")).toBe(false);
  });
});

describe("age", () => {
  const now = new Date("2026-08-30T00:00:00Z");

  it("counts whole years and has not counted a birthday that has not happened", () => {
    expect(ageInYears(new Date("2000-08-30T00:00:00Z"), now)).toBe(26);
    expect(ageInYears(new Date("2000-08-31T00:00:00Z"), now)).toBe(25);
  });

  it("accepts someone exactly at the minimum, on the day", () => {
    const dob = `${now.getUTCFullYear() - MIN_AGE}-08-30`;
    expect(checkDateOfBirth(dob, now)).toMatchObject({ ok: true });
  });

  it("rejects one day short of the minimum", () => {
    const dob = `${now.getUTCFullYear() - MIN_AGE}-08-31`;
    expect(checkDateOfBirth(dob, now)).toMatchObject({ ok: false, problem: "too_young" });
  });

  it("rejects a date that does not exist rather than rolling it forward", () => {
    expect(checkDateOfBirth("1990-02-31", now)).toMatchObject({ ok: false, problem: "malformed" });
  });

  it("rejects the future and the implausible", () => {
    expect(checkDateOfBirth("2030-01-01", now)).toMatchObject({ ok: false, problem: "future" });
    expect(checkDateOfBirth("1850-01-01", now)).toMatchObject({ ok: false, problem: "implausible" });
  });

  it("rejects junk", () => {
    for (const bad of ["", "30-08-2000", "2000/08/30", "not-a-date"]) {
      expect(checkDateOfBirth(bad, now).ok).toBe(false);
    }
  });
});
