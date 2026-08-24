import { describe, expect, it } from "vitest";
import {
  compareRequiredWebVars,
  parseRequiredWebVars,
  parseViteRequiredVars,
} from "./check-web-env-docs.mjs";

describe("web environment checklist parser", () => {
  it("reads the Vite REQUIRED_VARS array", () => {
    expect(
      parseViteRequiredVars(`
        const REQUIRED_VARS = [
          "VITE_FIRST",
          'VITE_SECOND',
        ] as const;
        if (command === "serve" && !rawPort) {
          throw new Error("PORT is required");
        }
      `),
    ).toEqual(["VITE_FIRST", "VITE_SECOND", "PORT"]);
  });

  it("reads only Required=Yes rows from the Web Artifact table", () => {
    expect(
      parseRequiredWebVars(`
        ## API Server
        | Variable | Required |
        |---|---|
        | \`API_ONLY\` | Yes |

        ## Web Artifact (artifacts/your-web-artifact)
        | Variable | Secret? | Required | Description |
        |---|---|---|---|
        | \`VITE_REQUIRED\` | No | **Yes** | required |
        | \`VITE_OPTIONAL\` | No | No | optional |

        ## Scripts
        | Variable | Required |
        |---|---|
      `),
    ).toEqual(["VITE_REQUIRED"]);
  });

  it("reports exact names that differ in either direction", () => {
    expect(
      compareRequiredWebVars(
        ["VITE_PRESENT", "VITE_MISSING_FROM_DOCS"],
        ["VITE_PRESENT", "VITE_NOT_ENFORCED"],
      ),
    ).toEqual({
      enforced: ["VITE_PRESENT", "VITE_MISSING_FROM_DOCS"],
      documented: ["VITE_PRESENT", "VITE_NOT_ENFORCED"],
      onlyInVite: ["VITE_MISSING_FROM_DOCS"],
      onlyInDocs: ["VITE_NOT_ENFORCED"],
    });
  });
});