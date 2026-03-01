import React from "react";
import '@testing-library/jest-dom';
import { render, screen } from "@testing-library/react";
import ChangelogModal from "./ChangelogModal";

describe("ChangelogModal", () => {
 it("renders changelog when open", () => {
 render(<ChangelogModal open={true} onClose={() => {}} />);
 expect(screen.getByRole("dialog", { name: /whats new/i })).toBeInTheDocument();
 // There are multiple elements with these texts, so use getAllByText
 const matches = screen.getAllByText(/onboarding checklist|major saas ui overhaul/i);
 expect(matches.length).toBeGreaterThan(0);
 });
 it("renders nothing when closed", () => {
 const { container } = render(<ChangelogModal open={false} onClose={() => {}} />);
 expect(container).toBeEmptyDOMElement();
 });
});
