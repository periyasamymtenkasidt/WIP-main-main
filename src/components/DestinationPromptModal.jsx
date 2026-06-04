import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Folder, AlertCircle } from "lucide-react";
import { getCategoryKey } from "../utils/scopeNaming";

/**
 * Reusable modal for selecting a destination heading or creating a new one.
 * Uses filtering to avoid placing duplicate items under the same heading.
 */
const DestinationPromptModal = ({
  isOpen,
  onClose,
  itemName,
  itemCategory,
  existingHeadings = [],
  headingsWithItem = [],
  onSelect,
  onCreateNew,
}) => {
  const [newHeading, setNewHeading] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the input field when modal opens
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset input value only when popup closes
      setNewHeading("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out headings that already contain this item
  const availableHeadings = existingHeadings.filter(
    (h) => !headingsWithItem.some((ex) => ex.trim().toUpperCase() === h.trim().toUpperCase())
  );

  const handleCreateNewSubmit = (e) => {
    e.preventDefault();
    const trimmed = newHeading.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a heading name.");
      return;
    }

    if (itemCategory) {
      const newCatKey = getCategoryKey(trimmed);
      const expectedCatKey = getCategoryKey(itemCategory);
      if (newCatKey !== "gray" && newCatKey !== expectedCatKey) {
        setError(`Heading name does not match the "${itemCategory}" category.`);
        return;
      }
    }

    if (existingHeadings.some((h) => h.trim().toUpperCase() === trimmed)) {
      if (headingsWithItem.some((ex) => ex.trim().toUpperCase() === trimmed)) {
        setError(`Heading "${trimmed}" already contains this item`);
        return;
      }
      // Heading exists and doesn't contain the item, just select it
      onSelect(trimmed);
      return;
    }
    onCreateNew(trimmed);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[10000] animate-fade-in p-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-bordergray transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-soft border-b border-bordergray">
          <div>
            <h3 className="text-[14px] font-bold text-textcolor">
              Select Destination Heading
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Assigning: <span className="font-semibold text-textcolor">{itemName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-subtle hover:text-textcolor p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-bordergray transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* List of existing headings */}
          <div>
            <h4 className="text-[10px] font-bold text-text-subtle tracking-wider uppercase mb-2">
              Existing Headings
            </h4>
            {availableHeadings.length === 0 ? (
              <p className="text-[11px] text-text-muted italic bg-bg-soft/40 p-3 rounded-lg border border-bordergray/50">
                {existingHeadings.length > 0 
                  ? "All existing headings already contain this item." 
                  : "No headings exist yet."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {availableHeadings.map((heading) => (
                  <button
                    key={heading}
                    type="button"
                    onClick={() => onSelect(heading)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-bordergray bg-white hover:border-select-blue/30 hover:bg-active-bg/20 transition-all shadow-xs cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder size={14} className="text-select-blue shrink-0" />
                      <span className="text-[12px] font-semibold text-textcolor group-hover:text-select-blue truncate">
                        {heading}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-bordergray my-4" />

          {/* Create New Heading Form */}
          <div>
            <h4 className="text-[10px] font-bold text-text-subtle tracking-wider uppercase mb-2">
              Or Create New Heading
            </h4>
            <form onSubmit={handleCreateNewSubmit} className="space-y-3">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  value={newHeading}
                  onChange={(e) => {
                    setNewHeading(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. COMMON BATHROOM"
                  className="bg-light-gray border border-bordergray text-[12px] text-darkgray rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 placeholder-gray-400 uppercase font-semibold"
                />
                {error && (
                  <p className="text-red-500 text-[10px] mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-select-blue hover:bg-select-blue/90 text-white text-[12px] font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Create & Assign</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 bg-bg-soft border-t border-bordergray">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationPromptModal;
