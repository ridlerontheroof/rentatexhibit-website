import { describe, expect, it } from "vitest";
import { TOUR_UNIT_REQUEST, isTourUnitName, isTourUnitRequest } from "./tourUnit";

describe("tour unit config", () => {
  it("matches the current name and the pre-rename name, case-insensitively", () => {
    expect(isTourUnitName("Tour")).toBe(true);
    expect(isTourUnitName(" tour ")).toBe(true);
    expect(isTourUnitName("General Tour")).toBe(true);
    expect(isTourUnitName("GENERAL TOUR")).toBe(true);
  });

  it("never matches real apartment numbers or retail units", () => {
    for (const unit of ["0606", "04M02", "2801", "RETAIL01", "Tour2", "0Tour"]) {
      expect(isTourUnitName(unit)).toBe(false);
    }
  });

  it("the reserved request token and unit names both resolve as tour requests", () => {
    expect(isTourUnitRequest(TOUR_UNIT_REQUEST)).toBe(true);
    expect(isTourUnitRequest("tour")).toBe(true);
    expect(isTourUnitRequest("General Tour")).toBe(true);
    expect(isTourUnitRequest("2801")).toBe(false);
  });
});
