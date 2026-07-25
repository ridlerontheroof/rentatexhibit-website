import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({ sendFeeCopyAlert: vi.fn(async () => {}) }));
vi.mock("./mailer", () => ({ mailerConfigured: vi.fn(() => true) }));
vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { reportStrippedFeeCopy, __resetFeeCopyAlertForTests } from "./feeCopyAlert";
import { sendFeeCopyAlert } from "./email";
import { mailerConfigured } from "./mailer";
import { logger } from "./logger";

const sendFeeCopyAlertMock = vi.mocked(sendFeeCopyAlert);
const mailerConfiguredMock = vi.mocked(mailerConfigured);
const warn = vi.mocked(logger.warn);
const error = vi.mocked(logger.error);

const DAY1 = Date.parse("2026-07-25T10:00:00Z");

describe("reportStrippedFeeCopy", () => {
  beforeEach(() => {
    __resetFeeCopyAlertForTests();
    vi.clearAllMocks();
    mailerConfiguredMock.mockReturnValue(true);
  });

  it("logs and emails on first detection", async () => {
    await reportStrippedFeeCopy("0606", ["There is a $300 pet deposit."], DAY1);
    expect(warn).toHaveBeenCalledOnce();
    expect(sendFeeCopyAlertMock).toHaveBeenCalledExactlyOnceWith({
      unit: "0606",
      removed: ["There is a $300 pet deposit."],
    });
  });

  it("does not re-notify for the same unchanged text on the same day", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 5 * 60 * 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("re-notifies the next UTC day", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1 + 24 * 60 * 60 * 1000);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(2);
  });

  it("notifies separately per unit and only for new text", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy("0710", ["Pet rent is $30/month."], DAY1);
    await reportStrippedFeeCopy(
      "0606",
      ["Pet rent is $30/month.", "A $500 admin fee per person applies."],
      DAY1,
    );
    expect(sendFeeCopyAlertMock).toHaveBeenCalledTimes(3);
    expect(sendFeeCopyAlertMock).toHaveBeenLastCalledWith({
      unit: "0606",
      removed: ["A $500 admin fee per person applies."],
    });
  });

  it("dedupes repeated items within one call", async () => {
    await reportStrippedFeeCopy("0606", ["Pet rent is $30.", "Pet rent is $30."], DAY1);
    expect(sendFeeCopyAlertMock).toHaveBeenCalledExactlyOnceWith({
      unit: "0606",
      removed: ["Pet rent is $30."],
    });
  });

  it("still logs but skips the email when the mailer is unconfigured", async () => {
    mailerConfiguredMock.mockReturnValue(false);
    await reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1);
    expect(warn).toHaveBeenCalledOnce();
    expect(sendFeeCopyAlertMock).not.toHaveBeenCalled();
  });

  it("swallows send failures (never throws into the availability refresh)", async () => {
    sendFeeCopyAlertMock.mockRejectedValueOnce(new Error("smtp down"));
    await expect(
      reportStrippedFeeCopy("0606", ["Pet rent is $30/month."], DAY1),
    ).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
  });
});
