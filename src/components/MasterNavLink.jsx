import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable helper component to navigate to Master Module.
 * Style requirements:
 * - Primary theme color (text-primary or text-select-blue)
 * - Underlined text
 * - Pointer cursor
 * - Hover effect
 */
const MasterNavLink = ({ text = "Master Module", tab = "terms" }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    // Navigate to /master using useNavigate.
    // If a tab is specified, e.g. "terms", go straight there!
    const targetPath = tab ? `/master?tab=${tab}` : "/master";
    navigate(targetPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-select-blue hover:text-primary underline cursor-pointer font-semibold transition-all inline-block hover:opacity-85"
      style={{ background: "none", border: "none", padding: 0 }}
    >
      {text}
    </button>
  );
};

export default MasterNavLink;
