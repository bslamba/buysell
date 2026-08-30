import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * These pin the wire format, because the failure mode they guard against is
 * silent: a wrong field name means the vendor answers 200 and nobody's phone
 * rings. The Twilio `From` was set to MSG91_SENDER_ID until this suite existed.
 */

const ENV: Record<string, string | undefined> = {};
vi.mock("@/env", () => ({
  env: () => ({ OTP_PROVIDER: "console", ...ENV }),
  isDev: () => true,
}));

let fetchMock: ReturnType<typeof vi.fn>;

function ok(body = '{"type":"success"}') {
  return { ok: true, status: 200, text: async () => body };
}

beforeEach(() => {
  for (const k of Object.keys(ENV)) delete ENV[k];
  fetchMock = vi.fn().mockResolvedValue(ok());
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

async function provider() {
  const { getSmsProvider } = await import("./index");
  return getSmsProvider();
}

describe("MSG91", () => {
  beforeEach(() => {
    Object.assign(ENV, {
      OTP_PROVIDER: "msg91", MSG91_AUTH_KEY: "key-123",
      MSG91_TEMPLATE_ID: "tpl-456", MSG91_SENDER_ID: "WRTHIT",
    });
  });

  it("posts to the v5 OTP endpoint with the authkey header", async () => {
    await (await provider()).sendOtp("+919876543210", "123456");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://control.msg91.com/api/v5/otp");
    expect(init.method).toBe("POST");
    expect(init.headers.authkey).toBe("key-123");
  });

  it("strips the leading + — MSG91 wants 91XXXXXXXXXX, not +91XXXXXXXXXX", async () => {
    await (await provider()).sendOtp("+919876543210", "123456");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).mobile).toBe("919876543210");
  });

  it("sends the template id and our own code", async () => {
    await (await provider()).sendOtp("+919876543210", "123456");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ template_id: "tpl-456", otp: "123456", sender: "WRTHIT" });
  });

  it('throws on a 200 carrying {"type":"error"} — the unapproved-template case', async () => {
    fetchMock.mockResolvedValue(ok('{"type":"error","message":"template not approved"}'));
    await expect((await provider()).sendOtp("+919876543210", "123456"))
      .rejects.toThrow(/template not approved/);
  });

  it("throws on an HTTP error", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => "bad authkey" });
    await expect((await provider()).sendOtp("+919876543210", "123456")).rejects.toThrow(/401/);
  });

  it("names the missing variable rather than sending a blank key", async () => {
    delete ENV.MSG91_AUTH_KEY;
    await expect((await provider()).sendOtp("+919876543210", "123456"))
      .rejects.toThrow(/MSG91_AUTH_KEY is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Twilio", () => {
  beforeEach(() => {
    Object.assign(ENV, {
      OTP_PROVIDER: "twilio", TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "tok",
    });
  });

  it("prefers a Messaging Service over a bare From number", async () => {
    Object.assign(ENV, { TWILIO_MESSAGING_SERVICE_SID: "MG999", TWILIO_FROM_NUMBER: "+15550001111" });
    await (await provider()).sendOtp("+919876543210", "123456");
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(body.get("MessagingServiceSid")).toBe("MG999");
    expect(body.get("From")).toBeNull();
  });

  it("falls back to From when there is no Messaging Service", async () => {
    ENV.TWILIO_FROM_NUMBER = "+15550001111";
    await (await provider()).sendOtp("+919876543210", "123456");
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(body.get("From")).toBe("+15550001111");
  });

  it("never uses the MSG91 sender id as the Twilio From — the original bug", async () => {
    Object.assign(ENV, { MSG91_SENDER_ID: "WRTHIT", TWILIO_FROM_NUMBER: "+15550001111" });
    await (await provider()).sendOtp("+919876543210", "123456");
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(body.get("From")).not.toBe("WRTHIT");
  });

  it("posts to the account's Messages endpoint with basic auth", async () => {
    ENV.TWILIO_FROM_NUMBER = "+15550001111";
    await (await provider()).sendOtp("+919876543210", "123456");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("AC123:tok").toString("base64")}`);
  });

  it("keeps the + on the destination — Twilio requires E.164", async () => {
    ENV.TWILIO_FROM_NUMBER = "+15550001111";
    await (await provider()).sendOtp("+919876543210", "123456");
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body.toString());
    expect(body.get("To")).toBe("+919876543210");
    expect(body.get("Body")).toContain("123456");
  });

  it("refuses to send with no sender configured at all", async () => {
    await expect((await provider()).sendOtp("+919876543210", "123456"))
      .rejects.toThrow(/TWILIO_FROM_NUMBER \(or TWILIO_MESSAGING_SERVICE_SID\)/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("console provider", () => {
  it("is the fallback and sends nothing over the network", async () => {
    ENV.OTP_PROVIDER = "console";
    const p = await provider();
    expect(p.name).toBe("console");
    await p.sendOtp("+919876543210", "123456");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
