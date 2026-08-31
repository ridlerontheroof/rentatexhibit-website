type EmailTemplate = { subject: string; html: string; text: string };
const template = (subject: string, value: unknown): EmailTemplate => {
  const text = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return { subject, text, html: `<p>${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</p>` };
};
export const renderLeadNotification = (value: unknown) => template("New property lead", value);
export const renderProspectConfirmation = (value: unknown) => template("We received your request", value);
export const renderSeedStaleAlert = (value: unknown) => template("Availability seed needs attention", value);
export const renderGeneralTourConfirmation = (value: unknown) => template("Tour request received", value);