import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Package } from "lucide-react";
import { listLibrary, computeLibraryItemAmount } from "../data/itemLibrary";
import { getCategoryKey } from "../utils/scopeNaming";

/**
 * Category-filtered item name dropdown.
 *
 * After a heading is selected, this dropdown shows only items from the
 * Item Library that belong to the same category. Selecting an item
 * triggers `onSelect(libraryItem)` so the parent can auto-populate
 * description, days, duration, materials, and other mapped fields.
 */
const FilteredItemNameDropdown = ({
  value = "",
  headingOrCategory = "",
  onChange,
  onItemSelect,
  error = "",
  placeholder = "Select or type an item name…",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Get all library items
  const allItems = useMemo(() => listLibrary(), []);

  // Determine the category key from the heading/category
  const targetCategoryKey = useMemo(() => {
    if (!headingOrCategory) return null;
    return getCategoryKey(headingOrCategory);
  }, [headingOrCategory]);

  // Filter items by category
  const categoryItems = useMemo(() => {
    if (!targetCategoryKey || targetCategoryKey === "gray") return allItems;
    return allItems.filter((item) => {
      const itemCatKey = getCategoryKey(item.category || "");
      return itemCatKey === targetCategoryKey;
    });
  }, [allItems, targetCategoryKey]);

  // Apply search filter
  const filteredItems = useMemo(() => {
    if (!search.trim()) return categoryItems;
    const q = search.trim().toLowerCase();
    return categoryItems.filter(
      (item) =>
        (item.description || "").toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [categoryItems, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onChange(item.description || "");
    if (onItemSelect) onItemSelect(item);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div className="flex items-center gap-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`flex-1 bg-white border ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
              : isOpen
                ? "border-select-blue"
                : "border-bordergray"
          } text-[12px] text-textcolor rounded-lg px-3 py-2 pr-8 transition-all placeholder:text-text-subtle focus:outline-none focus:border-select-blue focus:ring-2 focus:ring-select-blue/15`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-textcolor"
          tabIndex={-1}
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-[10px] mt-1 font-semibold">{error}</p>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-bordergray shadow-xl max-h-[300px] flex flex-col overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-bordergray shrink-0">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-text-subtle"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${targetCategoryKey !== "gray" ? headingOrCategory + " " : ""}items…`}
                autoFocus
                className="w-full bg-bg-soft border border-transparent rounded-lg pl-6 pr-2 py-1.5 text-[11px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30"
              />
            </div>
            {targetCategoryKey && targetCategoryKey !== "gray" && (
              <p className="text-[9.5px] text-text-subtle mt-1 px-1">
                Showing items for{" "}
                <span className="font-semibold text-textcolor">
                  {headingOrCategory}
                </span>{" "}
                category · {categoryItems.length} item
                {categoryItems.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredItems.length === 0 && (
              <p className="text-[11px] text-text-subtle text-center py-4 italic">
                No items found
                {targetCategoryKey && targetCategoryKey !== "gray"
                  ? ` for "${headingOrCategory}"`
                  : ""}
              </p>
            )}
            {filteredItems.map((item) => {
              const amount = computeLibraryItemAmount(item);
              const isSelected =
                (item.description || "").toLowerCase().trim() ===
                (value || "").toLowerCase().trim();
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? "bg-active-bg border border-select-blue/30"
                      : "hover:bg-bg-soft border border-transparent"
                  }`}
                >
                  <Package
                    size={12}
                    className={
                      isSelected ? "text-select-blue" : "text-text-subtle"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[11.5px] font-semibold truncate ${
                        isSelected ? "text-select-blue" : "text-textcolor"
                      }`}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      {item.unit && <span>{item.unit}</span>}
                      {amount > 0 && (
                        <span className="font-semibold tabular-nums">
                          ₹{amount.toLocaleString("en-IN")}
                        </span>
                      )}
                      {(item.materials || []).length > 0 && (
                        <span>
                          {item.materials.length} material
                          {item.materials.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilteredItemNameDropdown;
