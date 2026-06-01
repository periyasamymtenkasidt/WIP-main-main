// Shared utility for sequential scope/category naming across all quote modules.
// When multiple scopes share the same category (e.g. "Kitchen"), they receive
// sequential display names: "Kitchen", "Kitchen 2", "Kitchen 3", etc.
// Used by: SampleQuoteModal, QuoteModal, QuotePreview (PDF/print/preview).

/**
 * Assign sequential display names per category.
 * Returns a new array where each item has a `_displayCategory` property.
 *
 *   Kitchen     → Kitchen
 *   Kitchen     → Kitchen 2
 *   Kitchen     → Kitchen 3
 *   Living Room → Living Room
 *   Living Room → Living Room 2
 *
 * @param {Array} scopeItems — items with an `area` field
 * @returns {Array} — cloned items with `_displayCategory` added
 */
export const assignCategoryNames = (scopeItems) => {
  if (!Array.isArray(scopeItems)) return [];
  const counts = {};
  return scopeItems.map((item) => {
    const cat = item.area || "Unassigned";
    counts[cat] = (counts[cat] || 0) + 1;
    const displayName = counts[cat] === 1 ? cat : `${cat} ${counts[cat]}`;
    return { ...item, _displayCategory: displayName };
  });
};
