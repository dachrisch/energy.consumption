"use client";

import { triggerHaptic } from "../utils/hapticUtils";

interface BurgerMenuProps {
  onClick: () => void;
}

export default function BurgerMenu({ onClick }: BurgerMenuProps) {
  const handleClick = () => {
    console.log('[BurgerMenu] Clicked');
    triggerHaptic('light');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="hamburger-button"
      aria-label="Toggle menu"
      type="button"
    >
      <i className="fa-solid fa-bars"></i>
    </button>
  );
}
