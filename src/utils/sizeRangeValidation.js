// Size Range field validation and utility functions

/**
 * Clean a size range string by removing all units ("sq ft", "sqft"),
 * spaces, alphabetic characters, and unsupported special characters,
 * normalizes hyphens, and returns only digits and a single hyphen.
 */
export const cleanSizeRange = (val) => {
  if (val === undefined || val === null) return "";
  let clean = String(val);
  // Replace U+2010 to U+2015 (en-dash, em-dash, etc.) with standard hyphen U+002D
  clean = clean.replace(/[\u2010-\u2015]/g, "-");
  // Remove "sq ft", "sqft" etc. case insensitively
  clean = clean.replace(/\s*(sq\s*ft|sqft)\b/gi, "");
  // Keep only digits and hyphens
  clean = clean.replace(/[^0-9-]/g, "");
  // Replace multiple consecutive hyphens with a single hyphen
  clean = clean.replace(/-+/g, "-");
  return clean.trim();
};

/**
 * Validate a cleaned or raw size range input.
 * Returns an error message string if invalid, or an empty string if valid.
 */
export const validateSizeRangeInput = (val) => {
  if (!val) return "";
  
  // If there's any alphabetical character or unsupported special characters
  if (/[a-zA-Z]/.test(val)) {
    return "Alphabetic characters are not allowed.";
  }
  
  if (/[^0-9-]/.test(val)) {
    return "Special characters other than '-' are not permitted.";
  }

  // Count hyphens
  const hyphenCount = (val.match(/-/g) || []).length;
  if (hyphenCount > 1) {
    return "Multiple hyphens are not allowed.";
  }

  // Valid formats: e.g. "500", "100-200"
  // Note: a trailing hyphen like "100-" is transient during typing but invalid for save
  const finalPattern = /^\d+(-\d+)?$/;
  if (!finalPattern.test(val)) {
    return "Please enter a valid format (e.g. 500 or 100-200).";
  }

  return "";
};

/**
 * Format a size range with the static "Sq Ft" unit for UI display and PDFs.
 * If input is null/empty, returns "—".
 */
export const formatSizeRange = (val) => {
  if (!val) return "—";
  const cleaned = cleanSizeRange(val);
  if (!cleaned) return "—";
  return `${cleaned} Sq Ft`;
};
