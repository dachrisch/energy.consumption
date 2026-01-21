import { render, screen } from "@testing-library/react";
import LayoutClient from "../components/LayoutClient";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
}));

describe("LayoutClient Structure", () => {
  it("renders main content area with children", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User", email: "test@example.com" } },
      status: "authenticated",
    });
    (usePathname as jest.Mock).mockReturnValue("/dashboard");

    render(
      <LayoutClient>
        <div data-testid="test-child">Content</div>
      </LayoutClient>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("has the authenticated layout structure", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User", email: "test@example.com" } },
      status: "authenticated",
    });
    (usePathname as jest.Mock).mockReturnValue("/dashboard");

    const { container } = render(
      <LayoutClient>
        <div>Content</div>
      </LayoutClient>
    );

    // Should have a header and a main tag
    expect(container.querySelector("header")).toBeInTheDocument();
    expect(container.querySelector("main")).toBeInTheDocument();
    
    // Header should contain the logo text
    expect(screen.getByText("EnergyMonitor")).toBeInTheDocument();
  });
});
