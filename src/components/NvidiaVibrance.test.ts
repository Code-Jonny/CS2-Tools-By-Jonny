// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import NvidiaVibrance from "./NvidiaVibrance.svelte";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock Tauri Store Plugin
vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: class {
    constructor() {}
    init() {
      return Promise.resolve();
    }
    get() {
      return Promise.resolve(null);
    }
    set() {
      return Promise.resolve();
    }
    save() {
      return Promise.resolve();
    }
  },
}));

// Import invoke after mocking
import { invoke } from "@tauri-apps/api/core";

describe("NvidiaVibrance Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error message when no Nvidia GPU is detected", async () => {
    // Mock invoke to return false (no Nvidia GPU)
    (invoke as any).mockResolvedValue(false);

    render(NvidiaVibrance);

    // Wait for the async check to complete
    await waitFor(() => {
      expect(screen.getByText(/No Nvidia GPU detected/i)).toBeInTheDocument();
    });

    // Ensure the toggle is NOT present
    expect(
      screen.queryByLabelText(/Enable Vibrance Management/i)
    ).not.toBeInTheDocument();
  });

  it("shows controls when Nvidia GPU is detected", async () => {
    // Mock invoke to return true (Nvidia GPU present)
    (invoke as any).mockResolvedValue(true);

    render(NvidiaVibrance);

    // Wait for the async check to complete
    await waitFor(() => {
      expect(
        screen.getByText(/Enable Vibrance Management/i)
      ).toBeInTheDocument();
    });

    // Ensure the error message is NOT present
    expect(
      screen.queryByText(/No Nvidia GPU detected/i)
    ).not.toBeInTheDocument();
  });
});
