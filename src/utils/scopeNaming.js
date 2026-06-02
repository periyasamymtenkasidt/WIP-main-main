// Shared utility for sequential scope/category naming across all quote modules.
// When multiple scopes share the same category (e.g. "Kitchen"), they receive
// sequential display names: "Kitchen 1", "Kitchen 2", "Kitchen 3", etc.
// Used by: SampleQuoteModal, QuoteModal, QuotePreview (PDF/print/preview).

/**
 * Assign sequential display names per category.
 * Returns a new array where each item has a `_displayCategory` property.
 *
 *   Kitchen     → Kitchen 1
 *   Kitchen     → Kitchen 2
 *   Kitchen     → Kitchen 3
 *   Living Room → Living Room 1
 *   Living Room → Living Room 2
 *
 * @param {Array} scopeItems — items with an `area` field
 * @returns {Array} — cloned items with `_displayCategory` added
 */
export const assignCategoryNames = (scopeItems) => {
  if (!Array.isArray(scopeItems)) return [];

  // 1. Group items by category (area) to find existing sequence numbers
  const categories = {};
  scopeItems.forEach((item) => {
    const cat = item.area || "Unassigned";
    if (!categories[cat]) {
      categories[cat] = {
        maxNum: 0,
      };
    }
    if (item.sequenceNumber) {
      const seq = Number(item.sequenceNumber);
      if (seq > categories[cat].maxNum) {
        categories[cat].maxNum = seq;
      }
    }
  });

  // 2. Assign sequence numbers to items that don't have one and construct _displayCategory
  return scopeItems.map((item) => {
    const cat = item.area || "Unassigned";
    if (!item.sequenceNumber) {
      const catData = categories[cat];
      const nextNum = catData.maxNum + 1;
      item.sequenceNumber = nextNum;
      catData.maxNum = nextNum;
    }

    const seq = item.sequenceNumber;
    const displayName = `${cat} ${seq}`;

    return { ...item, _displayCategory: displayName };
  });
};
