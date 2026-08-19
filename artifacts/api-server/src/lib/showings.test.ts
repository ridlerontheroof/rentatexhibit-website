/**
 * Unit tests for the AppFolio showing-scheduler client: timezone-exact slot
 * conversion, response normalization, and the guest-card/booking request
 * shapes replicated from the hosted "Schedule a Showing" page.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bookShowing,
  createShowingGuestCard,
  fetchShowingAvailabilities,
  hostedShowingsUrl,
  normalizeAvailabilities,
  propertyTodayMMDDYYYY,
  slotTimeToDate,
} from "./showings";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("slotTimeToDate", () => {
  it("converts Chicago CDT wall time to the exact instant", () => {
    // 2026-07-28 13:15 in Chicago (CDT, UTC-5) = 18:15 UTC.
    expect(slotTimeToDate("2026/07/28 13:15").toISOString()).toBe("2026-07-28T18:15:00.000Z");
  });

  it("converts Chicago CST (winter) wall time to the exact instant", () => {
    // 2026-01-15 10:00 in Chicago (CST, UTC-6) = 16:00 UTC.
    expect(slotTimeToDate("2026/01/15 10:00").toISOString()).toBe("2026-01-15T16:00:00.000Z");
  });

  it("rejects malformed slot times instead of guessing", () => {
    expect(() => slotTimeToDate("2026-07-28T13:15")).toThrow(/Malformed/);
    expect(() => slotTimeToDate("")).toThrow(/Malformed/);
  });
});

describe("propertyTodayMMDDYYYY", () => {
  it("formats the property-local date, not UTC", () => {
    // 2026-07-27T02:00Z is still July 26 in Chicago.
    expect(propertyTodayMMDDYYYY(new Date("2026-07-27T02:00:00Z"))).toBe("07/26/2026");
  });
});

describe("normalizeAvailabilities", () => {
  const raw = {
    prospect_scheduled_showing_duration: 15,
    availabilities_by_date: [
      { date: "2026/07/27", timeslots: [] },
      {
        date: "2026/07/28",
        timeslots: [
          { agent_id: 443, time: "2026/07/28 13:15", showing_attendee_count: 0 },
          { agent_id: 444, time: "2026/07/28 13:30", showing_attendee_count: 0 },
          // Malformed entries are dropped, never booked blind.
          { agent_id: "x", time: "2026/07/28 14:00" },
          { agent_id: 443, time: "bogus" },
        ],
      },
    ],
    future_availabilities_exist: true,
    first_available_date: "2026/07/28",
  };

  it("normalizes legacy-format days, slots, duration, and flags", () => {
    const out = normalizeAvailabilities(raw);
    expect(out.durationMinutes).toBe(15);
    expect(out.days).toEqual([
      { date: "2026/07/27", slots: [] },
      {
        date: "2026/07/28",
        slots: [
          { time: "2026/07/28 13:15", agentId: 443 },
          { time: "2026/07/28 13:30", agentId: 444 },
        ],
      },
    ]);
    expect(out.futureAvailabilitiesExist).toBe(true);
    expect(out.firstAvailableDate).toBe("2026/07/28");
    expect(out.rawTimeslotCount).toBe(4);
    expect(out.acceptedSlotCount).toBe(2);
  });

  it("normalizes the 2026-07 ISO format (dash dates + offset times) to canonical wall time", () => {
    // Live-format fixture captured from AppFolio on 2026-07-27 (unit probe).
    const out = normalizeAvailabilities({
      prospect_scheduled_showing_duration: 15,
      availabilities_by_date: [
        { date: "2026-07-27", timeslots: [] },
        {
          date: "2026-07-30",
          timeslots: [
            { agent_id: 444, time: "2026-07-30T10:30:00-05:00", showing_attendee_count: 0 },
            // Same instant quoted in UTC must normalize identically.
            { agent_id: 443, time: "2026-07-30T15:45:00Z", showing_attendee_count: 0 },
          ],
        },
      ],
      future_availabilities_exist: true,
      first_available_date: "2026-07-30",
      timezone: "America/Chicago",
    });
    expect(out.days).toEqual([
      { date: "2026/07/27", slots: [] },
      {
        date: "2026/07/30",
        slots: [
          { time: "2026/07/30 10:30", agentId: 444 },
          { time: "2026/07/30 10:45", agentId: 443 },
        ],
      },
    ]);
    expect(out.firstAvailableDate).toBe("2026/07/30");
    expect(out.rawTimeslotCount).toBe(2);
    expect(out.acceptedSlotCount).toBe(2);
  });

  it("normalizes winter (CST) ISO slot times exactly", () => {
    const out = normalizeAvailabilities({
      prospect_scheduled_showing_duration: 15,
      availabilities_by_date: [
        { date: "2026-01-15", timeslots: [{ agent_id: 1, time: "2026-01-15T10:00:00-06:00" }] },
      ],
    });
    expect(out.days[0].slots[0].time).toBe("2026/01/15 10:00");
  });

  it("counts raw vs accepted so an unknown format is detectable (all-dropped alarm)", () => {
    const out = normalizeAvailabilities({
      prospect_scheduled_showing_duration: 15,
      availabilities_by_date: [
        {
          date: "2026-07-30",
          timeslots: [
            { agent_id: 443, time: "July 30, 10:30 AM" },
            { agent_id: 444, time: 1753887000 },
          ],
        },
      ],
      future_availabilities_exist: true,
    });
    expect(out.days).toEqual([{ date: "2026/07/30", slots: [] }]);
    expect(out.rawTimeslotCount).toBe(2);
    expect(out.acceptedSlotCount).toBe(0);
  });

  it("nulls an unrecognized first_available_date instead of propagating it", () => {
    const out = normalizeAvailabilities({
      prospect_scheduled_showing_duration: 15,
      availabilities_by_date: [],
      first_available_date: "07/30/2026",
    });
    expect(out.firstAvailableDate).toBeNull();
  });

  it("throws when duration is missing — end time can't be computed", () => {
    expect(() => normalizeAvailabilities({ availabilities_by_date: [] })).toThrow(/duration/);
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("fetchShowingAvailabilities", () => {
  it("uses snake_case query params (camelCase gets a 422 from AppFolio)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        prospect_scheduled_showing_duration: 15,
        availabilities_by_date: [{ date: "2026/07/27", timeslots: [{ agent_id: 1, time: "2026/07/27 10:00" }] }],
      }),
    );
    await fetchShowingAvailabilities("uid-1", "07/27/2026");
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/listings/api/listings/uid-1/availabilities?");
    expect(url).toContain("start_date=07%2F27%2F2026");
    expect(url).toContain("find_first_available_date=true");
  });

  const emptyWindow = (dates: string[], firstAvailable: string) =>
    jsonResponse({
      prospect_scheduled_showing_duration: 15,
      availabilities_by_date: dates.map((date) => ({ date, timeslots: [] })),
      future_availabilities_exist: true,
      first_available_date: firstAvailable,
    });

  it("follows a dash-format first_available_date (2026-07 format) when the window is empty", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      // Hinted request: empty window pointing at 07/30.
      .mockResolvedValueOnce(emptyWindow(["2026-07-27"], "2026-07-30"))
      // No-hint re-check of the same window: still empty (genuinely no near-term slots).
      .mockResolvedValueOnce(emptyWindow(["2026-07-27"], ""))
      // Jump window (starts a day early, hosted-page parity).
      .mockResolvedValueOnce(
        jsonResponse({
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            { date: "2026-07-29", timeslots: [] },
            { date: "2026-07-30", timeslots: [{ agent_id: 444, time: "2026-07-30T10:30:00-05:00" }] },
          ],
        }),
      );
    const out = await fetchShowingAvailabilities("uid-1", "07/27/2026");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    // Re-check hits the same window without the hint before trusting the jump.
    expect(String(fetchMock.mock.calls[1][0])).toContain("start_date=07%2F27%2F2026");
    expect(String(fetchMock.mock.calls[1][0])).toContain("find_first_available_date=false");
    // Jump starts one day BEFORE first_available_date (hosted-page parity).
    expect(String(fetchMock.mock.calls[2][0])).toContain("start_date=07%2F29%2F2026");
    expect(out.days.find((d) => d.slots.length > 0)).toEqual({
      date: "2026/07/30",
      slots: [{ time: "2026/07/30 10:30", agentId: 444 }],
    });
    expect(out.nearTermRecovery).toBeNull();
  });

  it("follows first_available_date once when the requested window is empty", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(emptyWindow(["2026/07/27"], "2026/08/03"))
      .mockResolvedValueOnce(emptyWindow(["2026/07/27"], ""))
      .mockResolvedValueOnce(
        jsonResponse({
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            { date: "2026/08/02", timeslots: [] },
            { date: "2026/08/03", timeslots: [{ agent_id: 1, time: "2026/08/03 10:00" }] },
          ],
        }),
      );
    const out = await fetchShowingAvailabilities("uid-1", "07/27/2026");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2][0])).toContain("start_date=08%2F02%2F2026");
    expect(out.days.find((d) => d.slots.length > 0)?.date).toBe("2026/08/03");
    expect(out.nearTermRecovery).toBeNull();
  });

  // Regression for the 2026-07-29 incident: the page offered 8/1 as the
  // soonest tour day while AppFolio's hosted page had open times on 7/30 and
  // 7/31. The empty hinted window + late first_available_date must NOT skip
  // near-term days that genuinely have slots.
  it("recovers near-term days the jump hint hid (no-hint re-check finds slots)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      // Hinted request: 4-day window all empty, hint points at 08/01.
      .mockResolvedValueOnce(
        emptyWindow(["2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01"], "2026-08-01"),
      )
      // Same window WITHOUT the hint: 7/30 and 7/31 actually have slots.
      .mockResolvedValueOnce(
        jsonResponse({
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            { date: "2026-07-29", timeslots: [] },
            { date: "2026-07-30", timeslots: [{ agent_id: 444, time: "2026-07-30T10:30:00-05:00" }] },
            { date: "2026-07-31", timeslots: [{ agent_id: 444, time: "2026-07-31T09:30:00-05:00" }] },
            { date: "2026-08-01", timeslots: [] },
          ],
          future_availabilities_exist: true,
        }),
      );
    const out = await fetchShowingAvailabilities("uid-1", "07/29/2026");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(out.days.filter((d) => d.slots.length > 0).map((d) => d.date)).toEqual([
      "2026/07/30",
      "2026/07/31",
    ]);
    expect(out.nearTermRecovery).toEqual({
      mode: "recheck",
      firstAvailableDate: "2026/08/01",
      recoveredDates: ["2026/07/30", "2026/07/31"],
    });
  });

  it("flags a jump overshoot when the day-early jump window reveals slots before first_available_date", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(emptyWindow(["2026-07-27", "2026-07-28"], "2026-08-01"))
      .mockResolvedValueOnce(emptyWindow(["2026-07-27", "2026-07-28"], ""))
      // Jump window starts 07/31 (day before hint) and 07/31 has slots.
      .mockResolvedValueOnce(
        jsonResponse({
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            { date: "2026-07-31", timeslots: [{ agent_id: 444, time: "2026-07-31T09:30:00-05:00" }] },
            { date: "2026-08-01", timeslots: [{ agent_id: 444, time: "2026-08-01T10:30:00-05:00" }] },
          ],
        }),
      );
    const out = await fetchShowingAvailabilities("uid-1", "07/27/2026");
    expect(String(fetchMock.mock.calls[2][0])).toContain("start_date=07%2F31%2F2026");
    expect(out.days[0].date).toBe("2026/07/31");
    expect(out.nearTermRecovery).toEqual({
      mode: "jump_overshoot",
      firstAvailableDate: "2026/08/01",
      recoveredDates: ["2026/07/31"],
    });
  });

  it("does not jump a day early past the already-checked window (first_available_date = start + 1)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(emptyWindow(["2026/07/27"], "2026/07/28"))
      .mockResolvedValueOnce(emptyWindow(["2026/07/27"], ""))
      .mockResolvedValueOnce(
        jsonResponse({
          prospect_scheduled_showing_duration: 15,
          availabilities_by_date: [
            { date: "2026/07/28", timeslots: [{ agent_id: 1, time: "2026/07/28 10:00" }] },
          ],
        }),
      );
    const out = await fetchShowingAvailabilities("uid-1", "07/27/2026");
    // previousDay(07/28) = 07/27 = start, not strictly after → jump at the hint itself.
    expect(String(fetchMock.mock.calls[2][0])).toContain("start_date=07%2F28%2F2026");
    expect(out.days[0].date).toBe("2026/07/28");
  });

  it("throws loudly on a non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(fetchShowingAvailabilities("uid-1", "07/27/2026")).rejects.toThrow(/status 500/);
  });
});

describe("createShowingGuestCard", () => {
  const input = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "3125550100",
    listableUid: "uid-1",
  };

  it("sends the hosted form's snake_case guest-card payload and captures the id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ guest_card_id: 12345 }));
    const out = await createShowingGuestCard(input);
    expect(out).toEqual({ guestCardId: "12345", jwt: null, sourceDowngraded: false });
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("/listings/api/guest_cards");
    // AppFolio's hosted client snake_cases every request body; camelCase keys
    // get a bare 400 with an empty body (contract change observed 2026-07-26).
    const body = JSON.parse(String(opts.body));
    expect(body).toEqual({
      first_name: "Jane",
      last_name: "Doe",
      email_address: "jane@example.com",
      phone_number: "3125550100",
      listable_uid: "uid-1",
      source: "Website (Exhibit)",
      notes: "[SMS opt-in consent: not given]",
      skip_cta_for_new_inquiries: true,
    });
  });

  it.each([
    [true, "[SMS opt-in consent: given]"],
    [false, "[SMS opt-in consent: not given]"],
  ])("writes the standard AppFolio consent note for smsConsent=%s", async (smsConsent, notes) => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ guest_card_id: 12345 }));
    await createShowingGuestCard({ ...input, smsConsent });
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(opts.body)).notes).toBe(notes);
  });

  it("splits a two-word first name so AppFolio doesn't 422 the card", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ guest_card_id: 12345 }));
    await createShowingGuestCard({ ...input, firstName: "Mary Jane", lastName: "Watson" });
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(opts.body));
    expect(body.first_name).toBe("Mary");
    expect(body.last_name).toBe("Jane Watson");
  });

  it("sends a visit-scoped source when one is provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ guest_card_id: 12345 }));
    await createShowingGuestCard({ ...input, source: "Website (GoogleAds-SpringPromo)" });
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(opts.body)).source).toBe("Website (GoogleAds-SpringPromo)");
  });

  it("still captures X-JWT when AppFolio issues one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        { guest_card_id: 12345 },
        { headers: { "Content-Type": "application/json", "X-JWT": "tok-abc" } },
      ),
    );
    const out = await createShowingGuestCard(input);
    expect(out).toEqual({ guestCardId: "12345", jwt: "tok-abc", sourceDowngraded: false });
  });

  it("includes status, content-type and body marker in failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 400, headers: { "Content-Type": "application/json" } }),
    );
    await expect(createShowingGuestCard(input)).rejects.toThrow(
      /status 400.*content-type=application\/json.*body=<empty>/,
    );
  });

  it("retries a 422'd campaign source with the default label and flags the downgrade", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 422 }))
      .mockResolvedValueOnce(jsonResponse({ guest_card_id: 777 }));
    const out = await createShowingGuestCard({
      ...input,
      source: "Website (GoogleAds-SpringPromo)",
    });
    expect(out).toEqual({ guestCardId: "777", jwt: null, sourceDowngraded: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)).source).toBe(
      "Website (GoogleAds-SpringPromo)",
    );
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body)).source).toBe(
      "Website (Exhibit)",
    );
  });

  it("does NOT retry a 422 when the source is already the default, and annotates the spam-throttle hint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 422 }));
    await expect(createShowingGuestCard(input)).rejects.toThrow(/spam throttle/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws with the spam-throttle hint when the default-source retry also 422s", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 422 }));
    await expect(
      createShowingGuestCard({ ...input, source: "Website (GoogleAds-SpringPromo)" }),
    ).rejects.toThrow(/status 422.*body=<empty>.*spam throttle/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-422 failures", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 500 }));
    await expect(
      createShowingGuestCard({ ...input, source: "Website (GoogleAds-SpringPromo)" }),
    ).rejects.toThrow(/status 500/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("bookShowing", () => {
  it("books with Bearer JWT, snake_case body, and duration-derived end time", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ start_at: "x", full_address: "165 W Superior St, Apt. 2801" }));
    const out = await bookShowing({
      listableUid: "uid-1",
      guestCardId: "77",
      jwt: "tok-abc",
      slotTime: "2026/07/28 13:15",
      agentId: 443,
      durationMinutes: 15,
    });
    expect(out.startAt).toBe("2026-07-28T18:15:00.000Z");
    expect(out.endAt).toBe("2026-07-28T18:30:00.000Z");
    expect(out.fullAddress).toBe("165 W Superior St, Apt. 2801");
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("/listings/api/showings");
    expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer tok-abc");
    expect(JSON.parse(String(opts.body))).toEqual({
      start_at: "2026-07-28T18:15:00.000Z",
      end_at: "2026-07-28T18:30:00.000Z",
      assigned_user_id: 443,
      listable_uid: "uid-1",
      guest_card_id: "77",
      from_email: false,
      showing_type: "In Person",
    });
  });

  it("books without an Authorization header when no JWT was issued", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ start_at: "x", full_address: null }));
    await bookShowing({
      listableUid: "uid-1",
      guestCardId: "77",
      jwt: null,
      slotTime: "2026/07/28 13:15",
      agentId: 443,
      durationMinutes: 15,
    });
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opts.headers as Record<string, string>).not.toHaveProperty("Authorization");
    expect(JSON.parse(String(opts.body))).toEqual({
      start_at: "2026-07-28T18:15:00.000Z",
      end_at: "2026-07-28T18:30:00.000Z",
      assigned_user_id: 443,
      listable_uid: "uid-1",
      guest_card_id: "77",
      from_email: false,
      showing_type: "In Person",
    });
  });

  it("throws loudly when AppFolio rejects the booking", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "conflict" }), { status: 422 }),
    );
    await expect(
      bookShowing({
        listableUid: "uid-1",
        guestCardId: "77",
        jwt: "tok",
        slotTime: "2026/07/28 13:15",
        agentId: 443,
        durationMinutes: 15,
      }),
    ).rejects.toThrow(/status 422/);
  });
});

describe("hostedShowingsUrl", () => {
  it("targets the hosted scheduler with source attribution", () => {
    expect(hostedShowingsUrl("uid-1")).toBe(
      "https://highlandrealestatepartners.appfolio.com/listings/showings/new?listable_uid=uid-1&source=Website%20(Exhibit)",
    );
  });
});
