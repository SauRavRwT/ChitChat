import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from "vitest";
import ThemeToggle from "./components/ThemeToggle";

test("theme toggle announces and triggers the next theme", () => {
  const onToggle = vi.fn();
  render(<ThemeToggle theme="light" onToggle={onToggle} />);

  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

  expect(onToggle).toHaveBeenCalledOnce();
});
