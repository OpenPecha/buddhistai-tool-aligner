import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-gray-800 flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-white text-xl font-bold">📝</span>
        <span className="text-white text-lg font-semibold">Tool Aligner</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for nav buttons */}
        <button className="text-gray-400 hover:text-white transition-colors" title="Settings">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        </button>
      </div>
      <div>
        <span className="text-xs text-gray-500">v1.0</span>
      </div>
    </nav>
  );
};

export default Navbar;
