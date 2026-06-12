// Material Master Storage
// Manages the catalog of raw materials, HSN codes, and base pricing.
// Persisted in localStorage under `material_library`.

const STORAGE_KEY = "material_library";

const genId = () =>
  `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const DEFAULT_MATERIALS = [
  { name: "Portland Pozzolana Cement (PPC)", specifications: "Standard Grade PPC, ideal for plastering & brickwork", rate: 420, unit: "bag", hsn: "2523", gstPercent: 28 },
  { name: "Fe 550 TMT Reinforcement Steel", specifications: "High tensile Fe 550 grade thermo-mechanically treated steel rebars", rate: 68, unit: "kg", hsn: "7214", gstPercent: 18 },
  { name: "River Sand (Fine)", specifications: "Clean fine river sand, double washed, free of excessive silt", rate: 4500, unit: "brass", hsn: "2505", gstPercent: 5 },
  { name: "Crushed Granite Aggregate (20mm)", specifications: "20mm angular crushed granite aggregate for RCC works", rate: 4200, unit: "brass", hsn: "2517", gstPercent: 5 },
  { name: "Standard Red Clay Bricks (9x4x3)", specifications: "First-class table molded red clay bricks", rate: 9, unit: "piece", hsn: "6901", gstPercent: 5 },
  { name: "AAC Lightweight Blocks (600x200x150)", specifications: "High thermal insulation Autoclaved Aerated Concrete blocks", rate: 95, unit: "piece", hsn: "6810", gstPercent: 12 },
  { name: "Ready Mix Concrete (RMC) M25 Grade", specifications: "M25 grade ready mix concrete with standard workability admixtures", rate: 4800, unit: "cum", hsn: "3824", gstPercent: 18 },
  { name: "Coarse aggregate (40mm)", specifications: "40mm crushed aggregate for subbase base course & PCC", rate: 3800, unit: "brass", hsn: "2517", gstPercent: 5 },
  { name: "Binding Wire (18 Gauge)", specifications: "18 gauge soft annealed GI binding wire for rebar fixing", rate: 85, unit: "kg", hsn: "7217", gstPercent: 18 },
  { name: "Shuttering Plywood (12mm)", specifications: "12mm waterproof boiling water resistant (BWP) grade shuttering plywood", rate: 65, unit: "sqft", hsn: "4412", gstPercent: 18 }
].map((item, idx) => ({
  ...item,
  id: `mat_default_${idx}`,
  usageCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export const listMaterials = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse material library", e);
  }
  
  // Seed defaults on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATERIALS));
  return DEFAULT_MATERIALS;
};

export const saveMaterials = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const addMaterialItem = (item) => {
  const items = listMaterials();
  const newItem = {
    ...item,
    id: genId(),
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updated = [newItem, ...items];
  saveMaterials(updated);
  return newItem;
};

export const updateMaterialItem = (id, changes) => {
  const items = listMaterials();
  const updated = items.map((it) =>
    it.id === id ? { ...it, ...changes, updatedAt: new Date().toISOString() } : it
  );
  saveMaterials(updated);
};

export const deleteMaterialItem = (id) => {
  const items = listMaterials().filter((it) => it.id !== id);
  saveMaterials(items);
};

export const resetMaterials = () => {
  localStorage.removeItem(STORAGE_KEY);
  return listMaterials();
};
