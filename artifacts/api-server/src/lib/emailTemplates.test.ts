import { describe, expect, it } from "vitest";
import type { LeadNotification } from "./email";
import {
  renderGeneralTourConfirmation,
  renderLeadNotification,
  renderProspectConfirmation,
  slotTimeLabels,
} from "./emailTemplates";

function lead(overrides: Partial<LeadNotification> = {}): LeadNotification {
  return {
    type: "contact",
    firstName: "Maya",
    lastName: "Rodriguez",
    email: "maya@example.com",
    phone: "312-555-0187",
    message: "Interested in a 1-bedroom.",
    preferredDate: null,
    createdAt: new Date("2026-07-24T15:30:00Z"),
    ...overrides,
  };
}

describe("renderProspectConfirmation", () => {
  it("personalizes the greeting with the first name", () => {
    const r = renderProspectConfirmation(lead());
    expect(r.html).toContain("Hi Maya,");
    expect(r.text).toContain("Hi Maya,");
  });

  it("falls back to a generic greeting when the first name is blank", () => {
    const r = renderProspectConfirmation(lead({ firstName: "  " }));
    expect(r.html).toContain("Hello,");
    expect(r.text).toContain("Hello,");
  });

  it("escapes HTML in prospect-supplied fields", () => {
    const r = renderProspectConfirmation(
      lead({ firstName: '<script>alert("x")</script>' }),
    );
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
  });

  it("echoes the requested tour date in subject and body", () => {
    const r = renderProspectConfirmation(
      lead({ type: "tour", preferredDate: "Saturday, August 1 at 11:00 AM" }),
    );
    expect(r.subject).toBe("Your tour request for Saturday, August 1 at 11:00 AM");
    expect(r.html).toContain("Saturday, August 1 at 11:00 AM");
    expect(r.text).toContain("Saturday, August 1 at 11:00 AM");
  });

  it("handles a tour request with no preferred date", () => {
    const r = renderProspectConfirmation(lead({ type: "tour", preferredDate: null }));
    expect(r.subject).toBe("Your tour request at Exhibit on Superior");
    expect(r.html).not.toContain("undefined");
  });

  it("skips the booking funnel when the tour lead already named a unit (Request a Showing fallback)", () => {
    const r = renderProspectConfirmation(
      lead({ type: "tour", preferredDate: "Saturday, August 1", unit: "0606" }),
    );
    expect(r.html).toContain("Apartment 0606");
    expect(r.html).toContain("confirm your showing time");
    expect(r.html).not.toContain("Pick Your Unit");
    expect(r.text).toContain("Apartment 0606");
    expect(r.text).not.toContain("Pick your unit");
  });

  it("keeps the booking funnel when the tour lead has no unit", () => {
    const r = renderProspectConfirmation(lead({ type: "tour" }));
    expect(r.html).toContain("Pick Your Unit &amp; Confirm Your Tour");
  });

  it("escapes HTML in the echoed tour date", () => {
    const r = renderProspectConfirmation(
      lead({ type: "tour", preferredDate: '<img src=x onerror="1">' }),
    );
    expect(r.html).not.toContain("<img src=x");
  });

  it("includes contact block, physical address, and key links", () => {
    const r = renderProspectConfirmation(lead());
    for (const part of [
      "165 W Superior St, Chicago, IL 60654",
      "312-450-0635",
      "exhibit@highlandptrs.com",
      "https://www.rentatexhibit.com/available-units",
      "Browse Units &amp; Book a Tour",
    ]) {
      expect(r.html).toContain(part);
    }
    expect(r.text).toContain("165 W Superior St, Chicago, IL 60654");
    expect(r.text).toContain("https://www.rentatexhibit.com/available-units");
  });

  it("uses table layout with inline styles and an inline CID logo with alt text", () => {
    const r = renderProspectConfirmation(lead());
    expect(r.html).toContain('role="presentation"');
    expect(r.html).toContain('src="cid:exhibit-logo"');
    expect(r.html).toContain('alt="EXHIBIT ON SUPERIOR"');
    expect(r.html).not.toContain("<link");
    expect(r.html).not.toMatch(/<style[\s>]/);
  });
});

describe("renderGeneralTourConfirmation", () => {
  it("formats the booked slot into human-readable date and time", () => {
    expect(slotTimeLabels("2026/08/01 16:45")).toEqual({
      dateLabel: "Saturday, August 1",
      timeLabel: "4:45 PM",
    });
    expect(slotTimeLabels("2026/08/03 09:00").timeLabel).toBe("9:00 AM");
    expect(slotTimeLabels("2026/08/03 12:00").timeLabel).toBe("12:00 PM");
    expect(slotTimeLabels("2026/08/03 00:15").timeLabel).toBe("12:15 AM");
  });

  it("renders the Exhibit-branded confirmation with the slot time", () => {
    const r = renderGeneralTourConfirmation({ firstName: "Jamie", slotTime: "2026/08/01 16:45" });
    expect(r.subject).toBe("Your tour is booked — Saturday, August 1 at 4:45 PM");
    expect(r.html).toContain("Hi Jamie,");
    expect(r.html).toContain("Saturday, August 1 at 4:45 PM");
    expect(r.html).toContain("Exhibit on Superior");
    expect(r.text).toContain("Saturday, August 1 at 4:45 PM");
    // Branded shell, not the corporate mailer.
    expect(r.html).toContain("cid:");
  });

  it("escapes HTML in the prospect-supplied name", () => {
    const r = renderGeneralTourConfirmation({
      firstName: '<script>alert("x")</script>',
      slotTime: "2026/08/01 16:45",
    });
    expect(r.html).not.toContain("<script>");
  });
});

describe("renderLeadNotification", () => {
  it("builds the subject from lead type and name", () => {
    const r = renderLeadNotification(lead());
    expect(r.subject).toBe("New contact form lead: Maya Rodriguez");
  });

  it("escapes HTML in lead-supplied fields", () => {
    const r = renderLeadNotification(
      lead({ message: '<b onmouseover="x">hi</b>', lastName: "<i>R</i>" }),
    );
    expect(r.html).not.toContain("<b onmouseover");
    expect(r.html).not.toContain("<i>R</i>");
    expect(r.html).toContain("&lt;b onmouseover=&quot;x&quot;&gt;hi&lt;/b&gt;");
  });

  it("includes all lead details plus a reply-to-prospect mailto button", () => {
    const r = renderLeadNotification(
      lead({ type: "tour", preferredDate: "Aug 1, 11am" }),
    );
    for (const part of [
      "Schedule a tour",
      "Maya Rodriguez",
      "maya@example.com",
      "312-555-0187",
      "Aug 1, 11am",
      "mailto:maya@example.com?subject=",
    ]) {
      expect(r.html).toContain(part);
    }
    expect(r.text).toContain("Reply to the prospect: maya@example.com");
  });

  it("shows a dash for missing optional fields", () => {
    const r = renderLeadNotification(lead({ message: null, preferredDate: null }));
    expect(r.html).toContain("&mdash;");
    expect(r.text).toContain("Message: —");
  });

  it("formats the submitted time in Chicago time", () => {
    const r = renderLeadNotification(lead());
    expect(r.html).toContain("Jul 24, 2026, 10:30");
    expect(r.html).toContain("CT");
    expect(r.html).not.toContain("2026-07-24T15:30");
  });
});
