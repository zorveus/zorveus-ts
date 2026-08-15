import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpendCapIndicator } from "../src/index";

describe("SpendCapIndicator", () => {
  it("renders normal progress under warning threshold", () => {
    render(
      <SpendCapIndicator
        current="34.50"
        limit="50.00"
        period="monthly"
        currency="USD"
        warningThreshold={0.8}
      />
    );

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeDefined();
    expect(screen.getByText(/Monthly Spend:/i)).toBeDefined();
    expect(screen.getByText(/On Track/i)).toBeDefined();
    expect(screen.getByText(/69%/i)).toBeDefined();
  });

  it("renders approaching limit when over threshold", () => {
    render(
      <SpendCapIndicator
        current="42.00"
        limit="50.00"
        period="monthly"
        warningThreshold={0.8}
      />
    );

    expect(screen.getByText(/Approaching Limit/i)).toBeDefined();
    expect(screen.getByText(/84%/i)).toBeDefined();
  });

  it("renders limit reached when limit is exceeded", () => {
    render(
      <SpendCapIndicator
        current="55.00"
        limit="50.00"
        period="monthly"
      />
    );

    expect(screen.getByText(/Limit Reached/i)).toBeDefined();
    expect(screen.getByText(/100%/i)).toBeDefined();
  });

  it("renders active no limit status when limit is null", () => {
    render(
      <SpendCapIndicator
        current="18.20"
        limit={null}
        period="monthly"
      />
    );

    expect(screen.getByText(/Active \(No Limit\)/i)).toBeDefined();
    expect(screen.getByText(/\$18\.20/i)).toBeDefined();
  });

  it("supports custom status labels", () => {
    render(
      <SpendCapIndicator
        current="45.00"
        limit="50.00"
        statusLabels={{ warning: "Near Budget" }}
        warningThreshold={0.8}
      />
    );

    expect(screen.getByText(/Near Budget/i)).toBeDefined();
  });

  it("supports renderCustom prop for complete design freedom", () => {
    render(
      <SpendCapIndicator
        current="10.00"
        limit="100.00"
        renderCustom={(data) => (
          <div className="custom-card">
            <h3>Budget: {data.currentFormatted}</h3>
            <span>{data.percentage}% consumed</span>
          </div>
        )}
      />
    );

    expect(screen.getByText("Budget: $10.00")).toBeDefined();
    expect(screen.getByText("10% consumed")).toBeDefined();
  });
});
