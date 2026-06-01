// Centralised read/write for the global Terms & Conditions data.
//
// Storage shape (v2):
//   { inclusions: [ { text: string, isDefault: boolean }, … ],
//     exclusions: [ { text: string, isDefault: boolean }, … ] }
//
// Legacy shape (v1 — plain string arrays) is auto-migrated on first read.

const STORAGE_KEY = "globalTerms";

/** Migrate a legacy string[] to the new { text, isDefault }[] format. */
const migrateList = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((entry) => {
    if (typeof entry === "string") {
      return { text: entry, isDefault: true };
    }
    // Already an object — normalise fields
    return {
      text: entry.text || "",
      isDefault: typeof entry.isDefault === "boolean" ? entry.isDefault : true,
    };
  });
};

const CATEGORIES = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];

/** Read the global terms from localStorage. Auto-migrates v1 → v2 & category structure. */
export const getGlobalTerms = (category = "STATUATORY") => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        // If it's a legacy flat structure (having inclusions/exclusions directly)
        if (Array.isArray(parsed.inclusions) || Array.isArray(parsed.exclusions)) {
          if (category === "STATUATORY") {
            return {
              inclusions: migrateList(parsed.inclusions),
              exclusions: migrateList(parsed.exclusions),
            };
          }
          return { inclusions: [], exclusions: [] };
        }
        // Otherwise, it is the new category-based structure
        const catData = parsed[category] || {};
        return {
          inclusions: migrateList(catData.inclusions),
          exclusions: migrateList(catData.exclusions),
        };
      }
    }
  } catch {
    // fall through
  }
  return { inclusions: [], exclusions: [] };
};

/** Persist global terms per category. */
export const saveGlobalTerms = (category, data) => {
  try {
    let activeCategory = category;
    let activeData = data;
    // Fallback if called with legacy signature
    if (typeof category === "object" && data === undefined) {
      activeCategory = "STATUATORY";
      activeData = category;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // If legacy structure, convert to category-based
          if (Array.isArray(parsed.inclusions) || Array.isArray(parsed.exclusions)) {
            parsed = {
              STATUATORY: {
                inclusions: migrateList(parsed.inclusions),
                exclusions: migrateList(parsed.exclusions),
              }
            };
          }
        } else {
          parsed = {};
        }
      } catch {
        parsed = {};
      }
    }
    parsed[activeCategory] = activeData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Error saving global terms", e);
  }
};

/** Convenience: return only items where isDefault === true, as plain strings, aggregated across categories. */
export const getDefaultTermStrings = () => {
  const inclusions = [];
  const exclusions = [];
  
  CATEGORIES.forEach((category) => {
    const terms = getGlobalTerms(category);
    terms.inclusions
      .filter((t) => t.isDefault)
      .forEach((t) => {
        if (!inclusions.includes(t.text)) inclusions.push(t.text);
      });
    terms.exclusions
      .filter((t) => t.isDefault)
      .forEach((t) => {
        if (!exclusions.includes(t.text)) exclusions.push(t.text);
      });
  });

  return { inclusions, exclusions };
};

/** Convenience: return only non-default items, as plain strings, aggregated across categories. */
export const getNonDefaultTermStrings = () => {
  const inclusions = [];
  const exclusions = [];
  
  CATEGORIES.forEach((category) => {
    const terms = getGlobalTerms(category);
    terms.inclusions
      .filter((t) => !t.isDefault)
      .forEach((t) => {
        if (!inclusions.includes(t.text)) inclusions.push(t.text);
      });
    terms.exclusions
      .filter((t) => !t.isDefault)
      .forEach((t) => {
        if (!exclusions.includes(t.text)) exclusions.push(t.text);
      });
  });

  return { inclusions, exclusions };
};