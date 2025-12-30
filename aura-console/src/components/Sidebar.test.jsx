import React from "react";
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("renders navigation items", () => {
    render(
      <Sidebar current="dashboard" onSelect={() => {}} onShowChangelog={() => {}} changelogUnread={false} />
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/products/i)).toBeInTheDocument();
  });

  it("calls onSelect when nav item clicked", () => {
    const onSelect = jest.fn();
    render(
      <Sidebar current="dashboard" onSelect={onSelect} onShowChangelog={() => {}} changelogUnread={false} />
    );
    fireEvent.click(screen.getByText(/products/i));
    expect(onSelect).toHaveBeenCalledWith("products");
  });
});
