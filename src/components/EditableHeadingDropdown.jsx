import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Plus, Lock, Folder } from "lucide-react";
import {
  getScheduleHeadings,
  getCategoryFromHeading,
  getRoomCategories,
} from "../data/scheduleConfig";

/**
 * Editable searchable dropdown for selecting/extending headings.
 *
 * Features:
 * - Dropdown values come from Schedule Master headings.
 * - Filtered by `category` prop (shows only headings belonging to that category).
 * - User can select an existing heading.
 * - User can extend a heading name (e.g. "Kitchen - Island Area").
 * - The category prefix is locked/read-only — only the suffix is editable.
 * - Includes "Create New Heading" option.
 */
const EditableHeadingDropdown = ({
  value = "",
  category = "",
  onChange,
  existingScopeItems = [],
  excludeHeadingsWithItem = null,
  error = "",
  placeholder = "Select or type a heading…",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customSuffix, setCustomSuffix] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const customInputRef = useRef(null);

  // Get all headings from Schedule Master, filtered by category
  const allHeadings = useMemo(() => {
    if (!category) return getScheduleHeadings();
    return getScheduleHeadings(category);
  }, [category]);

  // Also include headings from existing scope items that match the category
  const existingHeadingsInScope = useMemo(() => {
    if (!category) return [];
    const catUpper = category.toUpperCase();
    const scopeHeadings = new Set();
    (existingScopeItems || []).forEach((item) => {
      const heading = (item.area || item.heading || "").trim().toUpperCase();
      if (heading) {
        const headingCat = getCategoryFromHeading(heading).toUpperCase();
        if (headingCat === catUpper || heading.startsWith(catUpper)) {
          scopeHeadings.add(heading);
        }
      }
    });
    return Array.from(scopeHeadings);
  }, [category, existingScopeItems]);

  // Combine Schedule Master headings with scope headings (deduplicated)
  const combinedHeadings = useMemo(() => {
    const headingSet = new Set();
    const result = [];
    allHeadings.forEach((h) => {
      const upper = h.name.trim().toUpperCase();
      if (!headingSet.has(upper)) {
        headingSet.add(upper);
        result.push(h.name.trim());
      }
    });
    existingHeadingsInScope.forEach((h) => {
      if (!headingSet.has(h)) {
        headingSet.add(h);
        result.push(h);
      }
    });
    return result;
  }, [allHeadings, existingHeadingsInScope]);

  // Filter headings that already contain the excluded item
  const filteredHeadings = useMemo(() => {
    let headings = combinedHeadings;
    if (excludeHeadingsWithItem) {
      const excludeSet = new Set(
        (excludeHeadingsWithItem || []).map((h) => h.trim().toUpperCase()),
      );
      headings = headings.filter((h) => !excludeSet.has(h.toUpperCase()));
    }
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      headings = headings.filter((h) => h.toUpperCase().includes(q));
    }
    return headings;
  }, [combinedHeadings, excludeHeadingsWithItem, search]);

  // Category prefix for locking
  const categoryPrefix = useMemo(() => {
    if (!category) return "";
    return category.trim();
  }, [category]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
        if (isCustom && !customSuffix.trim()) {
          setIsCustom(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCustom, customSuffix]);

  // Auto-focus custom input when entering custom mode
  useEffect(() => {
    if (isCustom && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isCustom]);

  const handleSelect = (heading) => {
    onChange(heading);
    setIsOpen(false);
    setSearch("");
    setIsCustom(false);
    setCustomSuffix("");
  };

  const handleCreateNew = () => {
    setIsCustom(true);
    setCustomSuffix("");
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    const suffix = customSuffix.trim();
    if (!suffix) return;
    const newHeading = `${categoryPrefix} - ${suffix}`;
    onChange(newHeading);
    setIsCustom(false);
    setCustomSuffix("");
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === "Escape") {
      setIsCustom(false);
      setCustomSuffix("");
    }
  };

  const displayValue = value || "";

  return (
    <div ref={dropdownRef} className="relative">
      {isCustom ? (
        /* ── Custom heading input with locked prefix ─────────────── */
        <div className="flex items-center gap-0 border border-select-blue rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-select-blue/15">
          {/* Locked prefix */}
          <div className="flex items-center gap-1 bg-bg-soft border-r border-bordergray px-2.5 py-2 shrink-0 select-none">
            <Lock size={10} className="text-text-subtle" />
            <span className="text-[12px] font-bold text-textcolor uppercase whitespace-nowrap">
              {categoryPrefix}
            </span>
            <span className="text-[12px] text-text-muted font-medium"> - </span>
          </div>
          {/* Editable suffix */}
          <input
            ref={customInputRef}
            type="text"
            value={customSuffix}
            onChange={(e) => setCustomSuffix(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="e.g. Island Area, Utility Space"
            className="flex-1 px-2.5 py-2 text-[12px] text-textcolor uppercase font-semibold placeholder:text-text-subtle placeholder:font-normal placeholder:normal-case focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customSuffix.trim()}
            className="px-3 py-2 text-[11px] font-semibold text-select-blue hover:bg-active-bg disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Apply
          </button>
        </div>
      ) : (
        /* ── Main dropdown trigger ─────────────────────────────── */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 bg-white border ${
            error ? "border-red-500" : isOpen ? "border-select-blue" : "border-bordergray"
          } text-[12px] text-textcolor rounded-lg px-3 py-2 transition-all hover:border-select-blue/50 cursor-pointer ${
            isOpen ? "ring-2 ring-select-blue/15" : ""
          }`}
        >
          <span className={`truncate uppercase font-semibold ${!displayValue ? "text-text-subtle font-normal normal-case" : ""}`}>
            {displayValue || placeholder}
          </span>
          <ChevronDown
            size={13}
            className={`text-text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {error && (
        <p className="text-red-500 text-[10px] mt-1 font-semibold">{error}</p>
      )}

      {/* ── Dropdown panel ────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-bordergray shadow-xl max-h-[280px] flex flex-col overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-bordergray shrink-0">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-text-subtle"
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search headings…"
                autoFocus
                className="w-full bg-bg-soft border border-transparent rounded-lg pl-6 pr-2 py-1.5 text-[11px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30"
              />
            </div>
          </div>

          {/* Heading list */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredHeadings.length === 0 && !search.trim() && (
              <p className="text-[11px] text-text-subtle text-center py-3 italic">
                No headings available for this category.
              </p>
            )}
            {filteredHeadings.length === 0 && search.trim() && (
              <p className="text-[11px] text-text-subtle text-center py-3 italic">
                No headings match "{search}"
              </p>
            )}
            {filteredHeadings.map((heading) => {
              const isSelected =
                heading.toUpperCase() === (value || "").toUpperCase();
              return (
                <button
                  key={heading}
                  type="button"
                  onClick={() => handleSelect(heading)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-active-bg border border-select-blue/30 text-select-blue"
                      : "hover:bg-bg-soft border border-transparent text-textcolor"
                  }`}
                >
                  <Folder
                    size={12}
                    className={
                      isSelected ? "text-select-blue" : "text-text-subtle"
                    }
                  />
                  <span className="text-[11.5px] font-semibold truncate uppercase">
                    {heading}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create New Heading */}
          {categoryPrefix && (
            <div className="p-2 border-t border-bordergray shrink-0">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-select-blue/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg/40 transition-all"
              >
                <Plus size={12} />
                Create New Heading
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableHeadingDropdown;
