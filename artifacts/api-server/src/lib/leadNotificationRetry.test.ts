import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for the lead-notification retry sweeper: selection window
 * (grace period + retry-age budget), per-sweep cap, conditional stamping,
 * and failure handling.
 */

const { selectChain, updateChain, sendMock } = vi.hoisted(() => {
  const selectChain = {
    rows: [] as unknown[],
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    capturedWhere: undefined as unknown,
    capturedLimit: undefined as number | undefined,
  };
  const updateChain = {
    stampedRows: [{ id: 1 }] as unknown[],
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
    setCalls: [] as unknown[],
  };
  return { selectChain, updateChain, sendMock: vi.fn() };
});

vi.mock("@workspace/db", () => {
  const db = {
    select: (...a: unknown[]) => {
      selectChain.select(...a);
      return {
        from: (...f: unknown[]) => {
          selectChain.from(...f);
          return {
            where: (w: unknown) => {
              selectChain.capturedWhere = w;
              return {
                orderBy: () => ({
                  limit: (n: number) => {
                    selectChain.capturedLimit = n;
                    return Promise.resolve(selectChain.rows);
                  },
                }),
              };
            },
          };
        },
      };
    },
    update: (...a: unknown[]) => {
      updateChain.update(...a);
      return {
        set: (v: unknown) => {
          updateChain.setCalls.push(v);
          return {
            where: () => ({
              returning: () => Promise.resolve(updateChain.stampedRows),
            }),
          };
        },
      };
    },
  };
  // Minimal column stubs so drizzle operators receive objects.
  const leadsTable = {
    id: {},
    type: {},
    firstName: {},
    lastName: {},
    email: {},
    phone: {},
    message: {},
    preferredDate: {},
    createdAt: {},
    notifiedAt: {},
  };
  return { db, leadsTable };
});

vi.mock("./email", () => ({
  sendLeadNotification: (...a: unknown[]) => sendMock(...a),
}));

vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Capture the operands handed to drizzle's window operators so we can assert
// the selection-window boundaries without a live database.
const operatorCalls: { op: string; args: unknown[] }[] = [];
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  const wrap =
    (op: string, fn: (...a: never[]) => unknown) =>
    (...args: unknown[]) => {
      operatorCalls.push({ op, args });
      return (fn as (...a: unknown[]) => unknown)(...args);
    };
  return {
    ...actual,
    lt: wrap("lt", actual.lt),
    gt: wrap("gt", actual.gt),
  };
});

import { sweepUnnotifiedLeads } from "./leadNotificationRetry";

const NOW = new Date("2026-07-16T12:00:00Z");

function makeLead(id: number, createdAt: Date) {
  return {
    id,
    type: "contact",
    firstName: "Ann",
    lastName: "Lee",
    email: "ann@example.com",
    phone: "555-0100",
    message: null,
    preferredDate: null,
    createdAt,
    notifiedAt: null,
  };
}

beforeEach(() => {
  selectChain.rows = [];
  selectChain.capturedWhere = undefined;
  selectChain.capturedLimit = undefined;
  updateChain.stampedRows = [{ id: 1 }];
  updateChain.setCalls.length = 0;
  updateChain.update.mockClear();
  sendMock.mockReset();
  operatorCalls.length = 0;
});

describe("sweepUnnotifiedLeads selection window", () => {
  it("queries with a 2-minute grace period and 7-day retry budget around 'now'", async () => {
    await sweepUnnotifiedLeads(NOW);

    const lt = operatorCalls.find((c) => c.op === "lt");
    const gt = operatorCalls.find((c) => c.op === "gt");
    expect(lt).toBeDefined();
    expect(gt).toBeDefined();
    // createdAt < now - 2min (grace: don't race the request-path send)
    expect((lt!.args[1] as Date).getTime()).toBe(NOW.getTime() - 2 * 60 * 1000);
    // createdAt > now - 7d (budget: abandon permanently failing leads)
    expect((gt!.args[1] as Date).getTime()).toBe(
      NOW.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
  });

  it("caps work per sweep at 25 leads", async () => {
    await sweepUnnotifiedLeads(NOW);
    expect(selectChain.capturedLimit).toBe(25);
  });
});

describe("sweepUnnotifiedLeads retry behavior", () => {
  it("does nothing when the backlog is empty", async () => {
    await sweepUnnotifiedLeads(NOW);
    expect(sendMock).not.toHaveBeenCalled();
    expect(updateChain.update).not.toHaveBeenCalled();
  });

  it("re-sends and stamps notifiedAt on success", async () => {
    selectChain.rows = [makeLead(7, new Date("2026-07-16T11:00:00Z"))];
    sendMock.mockResolvedValue(true);

    await sweepUnnotifiedLeads(NOW);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ann@example.com", type: "contact" }),
    );
    expect(updateChain.setCalls).toHaveLength(1);
    expect(
      (updateChain.setCalls[0] as { notifiedAt: Date }).notifiedAt,
    ).toBeInstanceOf(Date);
  });

  it("leaves the lead un-stamped when the send fails (retried next sweep)", async () => {
    selectChain.rows = [makeLead(8, new Date("2026-07-16T11:00:00Z"))];
    sendMock.mockResolvedValue(false);

    await sweepUnnotifiedLeads(NOW);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(updateChain.update).not.toHaveBeenCalled();
  });

  it("processes the whole backlog batch in order", async () => {
    selectChain.rows = [
      makeLead(1, new Date("2026-07-16T10:00:00Z")),
      makeLead(2, new Date("2026-07-16T10:30:00Z")),
    ];
    sendMock.mockResolvedValue(true);

    await sweepUnnotifiedLeads(NOW);

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(updateChain.setCalls).toHaveLength(2);
  });

  it("survives an unexpected error without throwing", async () => {
    selectChain.rows = [makeLead(9, new Date("2026-07-16T11:00:00Z"))];
    sendMock.mockRejectedValue(new Error("connector down"));

    await expect(sweepUnnotifiedLeads(NOW)).resolves.toBeUndefined();
    expect(updateChain.update).not.toHaveBeenCalled();
  });
});
