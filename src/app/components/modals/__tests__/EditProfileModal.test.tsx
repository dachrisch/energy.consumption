import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditProfileModal from "../EditProfileModal";
import { useSession } from "next-auth/react";
import { updateProfile } from "@/actions/user";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  getSession: jest.fn(),
}));

// Mock the updateProfile action
jest.mock("@/actions/user", () => ({
  updateProfile: jest.fn(),
}));
const mockUpdateProfile = updateProfile as jest.MockedFunction<
  typeof updateProfile
>;

describe("EditProfileModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the session data
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
      },
      update: mockUpdate,
    });
  });

  it("renders the modal when isOpen is true", () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <EditProfileModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
  });

  it("pre-fills the name input with the current user name", () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Name");
    expect(nameInput).toHaveValue("John Doe");
  });

  it("updates the name when input changes", () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");
  });

  it("calls onClose when cancel button is clicked", () => {
    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("successfully updates profile and calls onSuccess", async () => {
    mockUpdateProfile.mockResolvedValueOnce({
      success: true,
      user: { name: "Jane Doe", email: "test@user.de" },
    });

    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith("Jane Doe");
      expect(mockUpdate).toHaveBeenCalledWith({ name: "Jane Doe" });
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("displays error message when profile update fails", async () => {
    
    mockUpdateProfile.mockRejectedValueOnce(new Error("Update failed"));

    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    mockUpdateProfile.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <EditProfileModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });
});
