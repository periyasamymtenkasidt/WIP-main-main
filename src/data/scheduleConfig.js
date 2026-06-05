// Firm-wide schedule configuration — edited in Master ("Schedule" tab) and
// consumed by the per-project schedule on Project Detail. localStorage-backed
// so it works without a backend; a backend later just syncs the same shape.

const KEY = "scheduleConfig";

export const DEFAULT_CONFIG = {
  // How many days BEFORE the planned end a task turns amber ("due soon").
  amberWindowDays: 2,
  // Escalation ladder. A task that is `minDaysOverdue` (or more) past its
  // planned end escalates to `role`. Highest matching tier wins.
  escalationTiers: [
    { minDaysOverdue: 1, role: "Task Owner" },
    { minDaysOverdue: 3, role: "Project Manager" },
    { minDaysOverdue: 6, role: "Studio Head" },
  ],
  // Room / category presets. Each carries a default duration (days) that
  // auto-fills the proposal scope / schedule when the category is picked.
  rooms: [
    { name: "Living Room", days: 20 },
    { name: "Dining", days: 10 },
    { name: "Kitchen", days: 15 },
    { name: "Utility", days: 5 },
    { name: "Master Bedroom", days: 12 },
    { name: "Bedroom 2", days: 10 },
    { name: "Bedroom 3", days: 10 },
    { name: "Bathrooms", days: 6 },
    { name: "Foyer", days: 5 },
    { name: "Staircase", days: 6 },
    { name: "Balcony", days: 4 },
    { name: "Pooja Room", days: 4 },
    { name: "Study", days: 8 },
  ],
  // Headings — destination headings for Proposal Master scope assignment.
  // Each heading belongs to a parent room/category. Proposal Master consumes
  // these as the single source of truth; it never modifies Schedule Master.
  headings: [
    { name: "Kitchen", category: "Kitchen" },
    { name: "Kitchen - Utility Area", category: "Kitchen" },
    { name: "Kitchen - Island Area", category: "Kitchen" },
    { name: "Living Room", category: "Living Room" },
    { name: "Living Room - TV Wall", category: "Living Room" },
    { name: "Living Room - Near Dining", category: "Living Room" },
    { name: "Dining", category: "Dining" },
    { name: "Master Bedroom", category: "Master Bedroom" },
    { name: "Master Bedroom - Wardrobe Wall", category: "Master Bedroom" },
    { name: "Bedroom 2", category: "Bedroom 2" },
    { name: "Bedroom 3", category: "Bedroom 3" },
    { name: "Bathrooms", category: "Bathrooms" },
    { name: "Bathrooms - Master Bath", category: "Bathrooms" },
    { name: "Bathrooms - Common Bath", category: "Bathrooms" },
    { name: "Bathrooms - Guest Bath", category: "Bathrooms" },
    { name: "Foyer", category: "Foyer" },
    { name: "Utility", category: "Utility" },
    { name: "Staircase", category: "Staircase" },
    { name: "Balcony", category: "Balcony" },
    { name: "Pooja Room", category: "Pooja Room" },
    { name: "Study", category: "Study" },
  ],
  // Task status options.
  statuses: ["Not Started", "In Progress", "Done", "Blocked"],
};

// Coerce rooms to [{ name, days }] — tolerates the old string-array format
// and partial blobs so existing saved configs keep working.
function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return DEFAULT_CONFIG.rooms;
  return rooms
    .map((r) =>
      typeof r === "string"
        ? { name: r.trim(), days: "" }
        : { name: (r?.name || "").trim(), days: r?.days ?? "" },
    )
    .filter((r) => r.name);
}

// Coerce headings to [{ name, category }] — auto-seeds from rooms if headings
// array is missing (backward compat with configs saved before headings existed).
function normalizeHeadings(headings, rooms) {
  if (Array.isArray(headings) && headings.length > 0) {
    return headings
      .map((h) =>
        typeof h === "string"
          ? { name: h.trim(), category: h.trim() }
          : { name: (h?.name || "").trim(), category: (h?.category || h?.name || "").trim() },
      )
      .filter((h) => h.name);
  }
  // Auto-seed from rooms — each room becomes a base heading
  if (Array.isArray(rooms)) {
    return rooms
      .filter((r) => (r.name || "").trim())
      .map((r) => ({ name: r.name.trim(), category: r.name.trim() }));
  }
  return DEFAULT_CONFIG.headings;
}

export function getScheduleConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    // Merge over defaults so a partial/old saved blob never drops keys.
    const merged = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    merged.rooms = normalizeRooms(merged.rooms);
    merged.headings = normalizeHeadings(merged.headings, merged.rooms);
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveScheduleConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("scheduleConfigChanged"));
}

export function resetScheduleConfig() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("scheduleConfigChanged"));
}

// Append a new room/category to the canonical list and persist. Returns the
// updated rooms array. No-op (returns current) if the name already exists.
export function addRoomCategory(name, days = "") {
  const trimmed = (name || "").trim();
  const cfg = getScheduleConfig();
  if (!trimmed || cfg.rooms.some((r) => r.name === trimmed)) return cfg.rooms;
  const rooms = [...cfg.rooms, { name: trimmed, days }];
  saveScheduleConfig({ ...cfg, rooms });
  return rooms;
}

// Default duration (days) configured for a category, or "" if none/unknown.
export function getRoomDefaultDays(name, config = getScheduleConfig()) {
  const cleanName = (name || "").replace(/\s+\d+$/g, "").trim().toUpperCase();
  const r = config.rooms.find((x) => (x.name || "").trim().toUpperCase() === cleanName);
  return r && r.days !== "" && r.days != null ? r.days : "";
}

// Given a positive days-overdue count, return the matching escalation role
// (the highest tier whose threshold is met), or null if none apply.
export function getEscalationRole(daysOverdue, config = getScheduleConfig()) {
  if (!daysOverdue || daysOverdue <= 0) return null;
  return [...config.escalationTiers]
    .sort((a, b) => a.minDaysOverdue - b.minDaysOverdue)
    .reduce((role, t) => (daysOverdue >= t.minDaysOverdue ? t.role : role), null);
}

// ── Heading helpers (consumed by Proposal Master) ─────────────────────────

// Get all headings, optionally filtered by category name. Case-insensitive
// matching on category. Returns [{ name, category }].
export function getScheduleHeadings(category = null, config = getScheduleConfig()) {
  const headings = config.headings || [];
  if (!category) return headings;
  const cat = category.trim().toUpperCase();
  return headings.filter((h) => (h.category || "").trim().toUpperCase() === cat);
}

// Extract the parent category from a heading name. Uses the rooms list as
// the source of known categories: the longest room name that is a prefix of
// the heading is the category. Falls back to the heading itself.
export function getCategoryFromHeading(headingName, config = getScheduleConfig()) {
  if (!headingName) return "";
  const upper = headingName.trim().toUpperCase();
  const rooms = (config.rooms || [])
    .map((r) => r.name.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // longest first
  for (const room of rooms) {
    if (upper === room.toUpperCase() || upper.startsWith(room.toUpperCase() + " - ")) {
      return room;
    }
  }
  // Check headings list for an exact match and return its category
  const heading = (config.headings || []).find(
    (h) => h.name.trim().toUpperCase() === upper,
  );
  if (heading) return heading.category || heading.name;
  return headingName.trim();
}

// Append a new heading to the Schedule Master config. No-op if the name
// already exists (case-insensitive). Returns the updated headings array.
// The `category` is inferred from the heading name if not provided.
export function addScheduleHeading(name, category = null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return getScheduleConfig().headings || [];
  const cfg = getScheduleConfig();
  const headings = cfg.headings || [];
  if (headings.some((h) => h.name.trim().toUpperCase() === trimmed.toUpperCase())) {
    return headings;
  }
  const resolvedCategory = category || getCategoryFromHeading(trimmed, cfg);
  const updated = [...headings, { name: trimmed, category: resolvedCategory }];
  saveScheduleConfig({ ...cfg, headings: updated });
  return updated;
}

// Get all room/category names (used as parent categories for heading grouping).
export function getRoomCategories(config = getScheduleConfig()) {
  return (config.rooms || []).map((r) => r.name.trim()).filter(Boolean);
}
