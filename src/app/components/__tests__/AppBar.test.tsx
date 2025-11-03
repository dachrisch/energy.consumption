import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppBar from "../AppBar";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useTheme } from "../../contexts/ThemeContext";

// Mock dependencies
jest.mock("next-auth/react");
jest.mock("next/navigation");
jest.mock("../../contexts/ThemeContext");
jest.mock("../modals/EditProfileModal", () => ({
  __esModule: true,
  default: () => <div>EditProfileModal</div>,
}));
jest.mock("../Toast", () => ({
  __esModule: true,
  default: () => <div>Toast</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("AppBar", () => {
  const mockOnMenuClick = jest.fn();
  const mockPush = jest.fn();
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      },
      status: "authenticated",
      update: jest.fn(),
    });

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    } as AppRouterInstance);

    mockUseTheme.mockReturnValue({
      theme: "system",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
    });
  });

  it("renders the AppBar with user information", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Check logo is present
    expect(screen.getByText("Energy Consumption Monitor")).toBeInTheDocument();
  });

  it("opens profile menu when user icon is clicked", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Find the menu button by its class
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Check if user info is displayed
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("displays theme options when menu is open", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Open menu
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Check theme options
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("changes theme when theme option is clicked", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Open menu
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Click dark theme
    const darkThemeButton = screen.getByText("Dark").closest("button")!;
    fireEvent.click(darkThemeButton);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("shows active theme with check icon", () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
      resolvedTheme: "dark",
    });

    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Open menu
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Find the dark theme option
    const darkOption = screen.getByText("Dark").closest("button")!;

    // Check if it has active class
    expect(darkOption).toHaveClass("active");
  });

  it("closes menu when backdrop is clicked", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Open menu
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Menu should be open
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Click backdrop
    const backdrop = document.querySelector(".menu-backdrop")!;
    fireEvent.click(backdrop);

    // Menu should be closed
    waitFor(() => {
      expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    });
  });

  it("calls signOut when logout is clicked", async () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Open menu
    const menuButton = document.querySelector(".menu-button")!;
    fireEvent.click(menuButton);

    // Click logout
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("calls onMenuClick when burger menu is clicked", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Find and click burger menu button
    const burgerButton = screen.getByLabelText("Toggle menu");
    fireEvent.click(burgerButton);

    expect(mockOnMenuClick).toHaveBeenCalled();
  });

  it("navigates to dashboard when logo is clicked", () => {
    render(<AppBar onMenuClick={mockOnMenuClick} />);

    // Click logo
    const logo = screen.getByText("Energy Consumption Monitor").parentElement!;
    fireEvent.click(logo);

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
