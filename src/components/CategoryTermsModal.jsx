import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, AlertCircle, ChevronDown } from "lucide-react";
import Modal from "./Modal";
import { getGlobalTerms } from "../data/termsStorage";
import MasterNavLink from "./MasterNavLink";

// ── Dropdown Item (no native label to prevent double-clicking) ─────────────────
const DropdownItem = ({ checked, label, onToggle, accent = "green" }) => {
  return (
    <div
      onClick={onToggle}
      className="flex items-start gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-bg-soft transition-all text-left w-full select-none"
    >
      <div className="relative inline-flex items-center pt-0.5 shrink-0">
        <div
          className={`shrink-0 h-4 w-4 rounded flex items-center justify-center border transition-all duration-200 ${
            checked
              ? accent === "green"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : "bg-red-500/80 border-red-500/50 text-white shadow-sm"
              : "bg-white border-slate-300 text-transparent hover:border-slate-400"
          }`}
        >
          <Check size={11} strokeWidth={3} className="shrink-0 text-white" />
        </div>
      </div>
      <span className="text-[12px] text-text-muted transition-colors leading-tight pt-px">
        {label}
      </span>
    </div>
  );
};

// ── Floating Multiselect Dropdown ──────────────────────────────────────────
const FloatingDropdown = ({
  label,
  items = [],
  selected = [],
  onToggle,
  accent = "green",
  placeholder = "Select items",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = items.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const displayPlaceholder =
    selected.length > 0
      ? `${selected.length} item${selected.length > 1 ? "s" : ""} selected`
      : placeholder;

  const isGreen = accent === "green";
  const borderActiveColor = isGreen ? "border-emerald-500 ring-emerald-500/20" : "border-red-500 ring-red-500/20";

  return (
    <div ref={containerRef} className="relative w-full">
      <span className="block text-[11px] font-bold text-textcolor/70 uppercase tracking-widest mb-2">
        {label}
      </span>
      <div
        ref={triggerRef}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        }}
        className={`w-full flex items-center justify-between bg-white border ${
          isOpen ? borderActiveColor + " ring-1" : "border-bordergray"
        } rounded-lg px-3.5 py-2 transition-all duration-205 hover:border-textcolor/30 cursor-pointer shadow-xs`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={displayPlaceholder}
            className="w-full bg-transparent border-none p-0 text-[12px] font-semibold text-textcolor placeholder:text-text-muted focus:outline-none focus:ring-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`text-[12px] ${selected.length > 0 ? "text-textcolor font-semibold" : "text-text-muted"} select-none`}>
            {displayPlaceholder}
          </span>
        )}
        <div
          onClick={(e) => {
            if (isOpen) {
              e.stopPropagation();
              setIsOpen(false);
              setSearch("");
            }
          }}
          className="cursor-pointer flex items-center justify-center shrink-0 ml-2"
        >
          <ChevronDown
            size={14}
            className={`text-text-subtle transition-transform duration-200 ${
              isOpen ? "rotate-180 text-textcolor" : ""
            }`}
          />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-bordergray rounded-xl shadow-xl max-h-[250px] flex flex-col overflow-hidden animate-[fadeIn_0.12s_ease-out]"
          >
            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-2 space-y-0.5 scroll-hidden-bar">
              {filtered.length === 0 ? (
                <p className="text-[11.5px] text-text-subtle italic text-center py-4">
                  No matching items.
                </p>
              ) : (
                <>
                  {/* Select All */}
                  <DropdownItem
                    checked={filtered.length > 0 && filtered.every((i) => selected.includes(i))}
                    label="All"
                    accent={accent}
                    onToggle={(e) => {
                      e.stopPropagation();
                      const allChecked = filtered.every((i) => selected.includes(i));
                      filtered.forEach((item) => {
                        const isSelected = selected.includes(item);
                        if (allChecked && isSelected) onToggle(item);
                        if (!allChecked && !isSelected) onToggle(item);
                      });
                      inputRef.current?.focus();
                    }}
                  />
                  {filtered.map((item, idx) => (
                    <DropdownItem
                      key={idx}
                      checked={selected.includes(item)}
                      label={item}
                      accent={accent}
                      onToggle={(e) => {
                        e.stopPropagation();
                        onToggle(item);
                        inputRef.current?.focus();
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// ── Empty State Component ───────────────────────────────────────────────────
const EmptyStateBox = ({ type = "Included" }) => {
  return (
    <div className="bg-bg-soft border border-dashed border-bordergray rounded-xl p-5 text-center my-2 flex flex-col items-center justify-center gap-2">
      <AlertCircle size={22} className="text-text-subtle shrink-0" />
      <p className="text-[11.5px] text-text-muted leading-relaxed font-medium">
        No {type} Items available.
        <br />
        Please navigate to the <MasterNavLink text="Master Module" tab="terms" /> to add {type} Items.
      </p>
    </div>
  );
};

// ── Category Terms Modal ─────────────────────────────────────────────────────
const CategoryTermsModal = ({
  category,
  categoryLabel,
  initialInclusions = [],
  initialExclusions = [],
  addedInclusions = [],
  addedExclusions = [],
  onApply,
  onClose,
}) => {
  // Load global master terms for this category
  const masterTerms = getGlobalTerms(category);

  const masterInclusions = (masterTerms.inclusions || []).filter((t) => !t.isDefault).map((t) => t.text);
  const masterExclusions = (masterTerms.exclusions || []).filter((t) => !t.isDefault).map((t) => t.text);

  // Available selections: non-defaults that are not already added
  const availableInclusions = masterInclusions.filter((t) => !addedInclusions.includes(t));
  const availableExclusions = masterExclusions.filter((t) => !addedExclusions.includes(t));

  const [selectedInclusions, setSelectedInclusions] = useState([]);
  const [selectedExclusions, setSelectedExclusions] = useState([]);

  const toggleInclusion = (text) => {
    setSelectedInclusions((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  const toggleExclusion = (text) => {
    setSelectedExclusions((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  const footer = (
    <div className="flex justify-end gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          onApply(selectedInclusions, selectedExclusions);
        }}
        className="px-5 py-2 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary transition-all shadow-sm"
      >
        Apply Selection
      </button>
    </div>
  );

  return (
    <Modal
      title={`${categoryLabel} Terms & Conditions`}
      subtitle={`Configure additional ${categoryLabel.toLowerCase()} inclusions and exclusions (standard defaults are applied automatically).`}
      onClose={onClose}
      maxWidth="max-w-[720px]"
      maxHeight="max-h-[90vh]"
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {/* Included Column (always on the left) */}
        <div className="flex flex-col">
          {masterInclusions.length === 0 ? (
            <div className="flex flex-col">
              <span className="block text-[11px] font-bold text-textcolor/70 uppercase tracking-widest mb-2">
                INCLUDED ITEMS
              </span>
              <EmptyStateBox type="Included" />
            </div>
          ) : (
            <FloatingDropdown
              label="INCLUDED ITEMS"
              items={availableInclusions}
              selected={selectedInclusions}
              onToggle={toggleInclusion}
              accent="green"
              placeholder="Select items"
            />
          )}
        </div>

        {/* Not Included Column (always on the right) */}
        <div className="flex flex-col">
          {masterExclusions.length === 0 ? (
            <div className="flex flex-col">
              <span className="block text-[11px] font-bold text-textcolor/70 uppercase tracking-widest mb-2">
                NOT INCLUDED ITEMS
              </span>
              <EmptyStateBox type="Not Included" />
            </div>
          ) : (
            <FloatingDropdown
              label="NOT INCLUDED ITEMS"
              items={availableExclusions}
              selected={selectedExclusions}
              onToggle={toggleExclusion}
              accent="red"
              placeholder="Select items"
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CategoryTermsModal;
