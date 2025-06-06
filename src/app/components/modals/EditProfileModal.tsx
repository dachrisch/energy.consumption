"use client";

import { useEffect, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { updateProfile } from "@/actions/user";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { success, user } = await updateProfile(name);
      console.log(`user ${JSON.stringify(user)}`);
      if (success) {
        await update({ name: user.name });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSubmitting(false);
    }
    await getSession();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              htmlFor="name"
              className="form-label"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full "
            />
          </div>
          {error && <div className="alert-error alert-text">{error}</div>}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="modal-button-confirm"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
