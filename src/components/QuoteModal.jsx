import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Trash2,
  Printer,
  Send,
  Pipette,
  Save,
  ListPlus,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Check,
  Scale,
  Truck,
  CreditCard,
  Wrench,
  FileText,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import CategoryTermsModal from "./CategoryTermsModal";
import { getGlobalTerms } from "../data/termsStorage";
import Modal from "./Modal";
import InputField from "./InputField";
import {
  getDefaultTermStrings,
  getNonDefaultTermStrings,
} from "../data/termsStorage";

const quoteRecipientSchema = yup.object().shape({
  recipientName: yup.string().required("Recipient name required"),
  recipientEmail: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
});
import QuotePreview from "./QuotePreview";
import {
  getPresetKeys,
  computeTotals,
  generateQuoteId,
  saveQuote,
  getConfigForType,
  getPropertyTypesForPreset,
} from "../data/QuotePresets";
import { computeLibraryItemAmount, computeLibraryItemArea } from "../data/itemLibrary";
import { formatAmount } from "../utils/formatAmount";
import { assignCategoryNames } from "../utils/scopeNaming";
import { roomColor } from "../data/categoryColors";
import CategorySelect from "./CategorySelect";
import LibraryPickerModal from "./LibraryPickerModal";
import { getRoomDefaultDays } from "../data/scheduleConfig";

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-3">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

// ── Custom Premium Checkbox ─────────────────────────────────────────────────
const CustomCheckbox = ({
  checked,
  onChange,
  accent = "green",
  size = "normal",
}) => {
  const isGreen = accent === "green";
  const sizeClasses = size === "small" ? "h-3.5 w-3.5" : "h-4 w-4";
  const checkSize = size === "small" ? 9 : 11;
  const strokeW = size === "small" ? 3.5 : 3;

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`shrink-0 rounded flex items-center justify-center border transition-all duration-200 cursor-pointer ${sizeClasses} ${
          checked
            ? isGreen
              ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700/90 text-white shadow-sm"
              : "bg-red-500/80 hover:bg-red-500 border-red-500/50 text-white shadow-sm"
            : "bg-white border-slate-300 text-transparent hover:border-slate-400"
        }`}
      >
        <Check size={checkSize} strokeWidth={strokeW} className="shrink-0" />
      </div>
    </div>
  );
};

// ── Multi-select Searchable Dropdown ────────────────────────────────────────
// Reusable dropdown with inline search + checkbox selection for picking terms.
// Renders outside the modal via React Portal with real-time screen positioning.
const MultiSelectDropdown = ({
  label,
  items,
  selected,
  onToggle,
  accent = "green",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      const clickedTrigger = ref.current && ref.current.contains(e.target);
      const clickedDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Update position coordinates on resize or modal scroll
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  // Auto-focus the input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = items.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  const borderColor =
    accent === "green" ? "border-emerald-400" : "border-red-400";
  const labelColor = accent === "green" ? "text-emerald-700" : "text-red-600";

  if (items.length === 0) return null;

  const placeholder =
    selected.length > 0
      ? `${selected.length} item${selected.length > 1 ? "s" : ""} selected`
      : "Select items…";

  return (
    <div ref={ref} className="relative">
      <label
        className={`text-[10px] font-bold uppercase tracking-widest ${labelColor} mb-1 block`}
      >
        {label}
      </label>
      {/* Inline search trigger — click or type to open and filter */}
      <div
        ref={triggerRef}
        className={`w-full flex items-center bg-white border ${
          open ? borderColor : "border-bordergray"
        } rounded-lg px-3 py-2 transition-all hover:border-select-blue/40 cursor-text`}
        onClick={() => {
          if (!open) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[11px] text-textcolor focus:outline-none placeholder:text-text-muted min-w-0"
        />
        <ChevronDown
          size={13}
          className={`text-text-subtle shrink-0 transition-transform cursor-pointer ${
            open ? "rotate-180" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((p) => !p);
            setSearch("");
          }}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top + 4}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white border border-bordergray rounded-lg shadow-lg max-h-[220px] flex flex-col animate-[fadeIn_0.15s_ease-out]"
          >
            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scroll-hidden-bar">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-text-subtle italic text-center py-3">
                  No matching items.
                </p>
              ) : (
                <>
                  {/* Select / Deselect all filtered */}
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-bg-soft group">
                    <CustomCheckbox
                      accent={accent}
                      checked={
                        filtered.length > 0 &&
                        filtered.every((i) => selected.includes(i))
                      }
                      onChange={() => {
                        const allChecked = filtered.every((i) =>
                          selected.includes(i),
                        );
                        filtered.forEach((item) => {
                          const isSelected = selected.includes(item);
                          if (allChecked && isSelected) onToggle(item);
                          if (!allChecked && !isSelected) onToggle(item);
                        });
                        // Auto-close dropdown after toggling "All"
                        setOpen(false);
                        setSearch("");
                      }}
                    />
                    <span className="text-[10px] font-semibold text-text-muted group-hover:text-textcolor transition-colors">
                      All
                    </span>
                  </label>
                  {filtered.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 cursor-pointer px-1 py-1 rounded hover:bg-bg-soft group"
                    >
                      <CustomCheckbox
                        accent={accent}
                        checked={selected.includes(item)}
                        onChange={() => onToggle(item)}
                      />
                      <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight pt-0.5">
                        {item}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const CATEGORIES_META = [
  { id: "STATUATORY", label: "Statutory", icon: Scale },
  { id: "DELIVERY", label: "Delivery", icon: Truck },
  { id: "PAYMENTS", label: "Payment", icon: CreditCard },
  { id: "TECHNICAL", label: "Technical", icon: Wrench },
  { id: "GENERAL", label: "General", icon: FileText },
];

const buildInitialFormData = ({
  presetKey,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
}) => {
  const presetKeys = getPresetKeys();
  const defaultTerms = getDefaultTermStrings();

  // If initialQuote is present, we still load the latest inquiry/master data,
  // but preserve identity fields like quoteId and createdAt.
  const activePresetKey =
    presetKey ||
    (presetData?.presetKey && presetKeys.includes(presetData.presetKey)
      ? presetData.presetKey
      : initialQuote?.presetKey || presetKeys[0] || "2BHK");
  const activePropertyType =
    presetData?.propertyType ||
    initialQuote?.propertyType ||
    defaultPropertyType ||
    "";

  const cfg = getConfigForType(activePresetKey, activePropertyType) || {};

  const quoteId = initialQuote?.quoteId || generateQuoteId();
  const createdAt = initialQuote?.createdAt || new Date().toISOString();

  // Load scope items: prefer initialQuote's saved scopeItems, then presetData's scopeItems,
  // and fallback to the master config configuration.
  const scopeItems = initialQuote?.scopeItems
    ? initialQuote.scopeItems.map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      }))
    : presetData?.scopeItems
      ? presetData.scopeItems.map((s) => ({
          ...s,
          materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
        }))
      : (cfg.scopeItems || []).map((s) => ({
          ...s,
          materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
        }));

  // Load inclusions/exclusions per category with legacy support
  const categoryInclusions = {};
  const categoryExclusions = {};
  const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];

  categoriesList.forEach((cat) => {
    const global = getGlobalTerms(cat);
    const defaultIn = global.inclusions.filter((t) => t.isDefault).map((t) => t.text);
    const defaultEx = global.exclusions.filter((t) => t.isDefault).map((t) => t.text);

    if (initialQuote?.categoryInclusions?.[cat]) {
      categoryInclusions[cat] = [...initialQuote.categoryInclusions[cat]];
    } else {
      if (initialQuote?.inclusions) {
        const catGlobalIntexts = global.inclusions.map((t) => t.text);
        categoryInclusions[cat] = initialQuote.inclusions.filter((text) => catGlobalIntexts.includes(text));
      } else if (presetData?.categoryInclusions?.[cat]) {
        categoryInclusions[cat] = [...presetData.categoryInclusions[cat]];
      } else if (presetData?.inclusions) {
        const catGlobalIntexts = global.inclusions.map((t) => t.text);
        categoryInclusions[cat] = presetData.inclusions.filter((text) => catGlobalIntexts.includes(text));
      } else {
        categoryInclusions[cat] = defaultIn;
      }
    }

    if (initialQuote?.categoryExclusions?.[cat]) {
      categoryExclusions[cat] = [...initialQuote.categoryExclusions[cat]];
    } else {
      if (initialQuote?.exclusions) {
        const catGlobalExtexts = global.exclusions.map((t) => t.text);
        categoryExclusions[cat] = initialQuote.exclusions.filter((text) => catGlobalExtexts.includes(text));
      } else if (presetData?.categoryExclusions?.[cat]) {
        categoryExclusions[cat] = [...presetData.categoryExclusions[cat]];
      } else if (presetData?.exclusions) {
        const catGlobalExtexts = global.exclusions.map((t) => t.text);
        categoryExclusions[cat] = presetData.exclusions.filter((text) => catGlobalExtexts.includes(text));
      } else {
        categoryExclusions[cat] = defaultEx;
      }
    }
  });

  const flatIn = [];
  const flatEx = [];
  categoriesList.forEach((cat) => {
    flatIn.push(...(categoryInclusions[cat] || []));
    flatEx.push(...(categoryExclusions[cat] || []));
  });

  return {
    quoteId,
    createdAt,
    recipientName: recipient?.name || initialQuote?.recipientName || "",
    recipientEmail: recipient?.email || initialQuote?.recipientEmail || "",
    recipientPhone: recipient?.phone || initialQuote?.recipientPhone || "",
    propertyType: activePropertyType,
    sizeRange:
      presetData?.sizeRange || cfg.sizeRange || initialQuote?.sizeRange || "",
    validityDays: presetData?.validityDays || initialQuote?.validityDays || 30,
    scopeItems,
    inclusions: flatIn,
    exclusions: flatEx,
    categoryInclusions,
    categoryExclusions,
    notes: presetData?.notes || initialQuote?.notes || "",
  };
};

// Pick the best preset to display in the dropdown given an already-loaded
// quote — first try the preset stored on the inquiry, then the quote, then the first available.
const inferPresetKey = (initialQuote, presetData) => {
  const keys = getPresetKeys();
  if (presetData?.presetKey && keys.includes(presetData.presetKey))
    return presetData.presetKey;
  if (initialQuote?.presetKey && keys.includes(initialQuote.presetKey))
    return initialQuote.presetKey;
  return keys.includes("2BHK") ? "2BHK" : keys[0];
};

// `mode` controls labelling only — "proposal" tweaks copy + button so this
// modal can be reused for the "Send Proposal" / "Resend Proposal" flow on a
// lead. Default "quote" keeps the standalone Quick Quote behaviour.
const QuoteModal = ({
  parentId,
  parentType,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
  mode = "quote",
  onClose,
  onSent,
}) => {
  const isProposal = mode === "proposal";
  const isResend = !!initialQuote;
  const [presetKey, setPresetKey] = useState(() =>
    inferPresetKey(initialQuote, presetData),
  );
  const [formData, setFormData] = useState(() =>
    buildInitialFormData({
      presetKey: inferPresetKey(initialQuote, presetData),
      recipient,
      defaultPropertyType,
      initialQuote,
      presetData,
    }),
  );

  // Dynamic terms from the global Terms & Conditions master.
  // Only default items are auto-displayed; non-defaults are added via modal.
  const [termOptions, setTermOptions] = useState(() => {
    const defaults = getDefaultTermStrings();
    return {
      inclusions: Array.from(
        new Set([
          ...(defaults.inclusions || []),
          ...(formData.inclusions || []),
        ]),
      ),
      exclusions: Array.from(
        new Set([
          ...(defaults.exclusions || []),
          ...(formData.exclusions || []),
        ]),
      ),
    };
  });

  // Modal state for dedicated category Terms & Conditions modals
  const [activeCategoryModal, setActiveCategoryModal] = useState(null);
  const [termsParentModalOpen, setTermsParentModalOpen] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState({
    STATUATORY: true,
    DELIVERY: false,
    PAYMENTS: false,
    TECHNICAL: false,
    GENERAL: false,
  });

  const [openGroups, setOpenGroups] = useState({});
  const toggleGroup = (room) => {
    setOpenGroups((prev) => ({ ...prev, [room]: !prev[room] }));
  };
  const isGroupOpen = (room) => openGroups[room] !== false;

  const groupedScope = useMemo(() => {
    const groups = [];
    const byRoom = new Map();
    const namedItems = assignCategoryNames(formData.scopeItems || []);
    namedItems.forEach((item, idx) => {
      const room = item.area || "Unassigned";
      if (!byRoom.has(room)) {
        const g = { room, rows: [], total: 0 };
        byRoom.set(room, g);
        groups.push(g);
      }
      const g = byRoom.get(room);
      g.rows.push({ item, idx });
      g.total += Number(item.amount) || 0;
    });
    return groups;
  }, [formData.scopeItems]);

  // react-hook-form for recipient validation
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue: rhfSetValue,
  } = useForm({
    resolver: yupResolver(quoteRecipientSchema),
    defaultValues: {
      recipientName: formData.recipientName,
      recipientEmail: formData.recipientEmail,
    },
  });

  const [isSending, setIsSending] = useState(false);
  // Controls the library picker modal for "Pick from Library" flow.
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);

  const totals = useMemo(
    () => computeTotals(formData.scopeItems),
    [formData.scopeItems],
  );

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setPresetKey(key);
    const cfg = getConfigForType(key);
    if (!cfg) return;
    
    const categoryInclusions = {};
    const categoryExclusions = {};
    const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
    categoriesList.forEach((cat) => {
      const global = getGlobalTerms(cat);
      categoryInclusions[cat] = global.inclusions.filter((t) => t.isDefault).map((t) => t.text);
      categoryExclusions[cat] = global.exclusions.filter((t) => t.isDefault).map((t) => t.text);
    });
    const flatIn = [];
    const flatEx = [];
    categoriesList.forEach((cat) => {
      flatIn.push(...(categoryInclusions[cat] || []));
      flatEx.push(...(categoryExclusions[cat] || []));
    });

    setFormData((prev) => ({
      ...prev,
      propertyType: cfg.propertyType,
      sizeRange: cfg.sizeRange,
      scopeItems: (cfg.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: flatIn,
      exclusions: flatEx,
      categoryInclusions,
      categoryExclusions,
    }));
    setTermOptions({
      inclusions: flatIn,
      exclusions: flatEx,
    });
  };

  const handlePropertyTypeChange = (e) => {
    const newType = e.target.value;
    const cfg = getConfigForType(presetKey, newType);
    if (!cfg) {
      updateField("propertyType", newType);
      return;
    }

    const categoryInclusions = {};
    const categoryExclusions = {};
    const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
    categoriesList.forEach((cat) => {
      const global = getGlobalTerms(cat);
      categoryInclusions[cat] = global.inclusions.filter((t) => t.isDefault).map((t) => t.text);
      categoryExclusions[cat] = global.exclusions.filter((t) => t.isDefault).map((t) => t.text);
    });
    const flatIn = [];
    const flatEx = [];
    categoriesList.forEach((cat) => {
      flatIn.push(...(categoryInclusions[cat] || []));
      flatEx.push(...(categoryExclusions[cat] || []));
    });

    setFormData((prev) => ({
      ...prev,
      propertyType: cfg.propertyType,
      sizeRange: cfg.sizeRange,
      scopeItems: (cfg.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: flatIn,
      exclusions: flatEx,
      categoryInclusions,
      categoryExclusions,
    }));
    setTermOptions({
      inclusions: flatIn,
      exclusions: flatEx,
    });
  };

  const getActiveCatCount = (cat) => {
    const incs = formData.categoryInclusions?.[cat] || [];
    const excs = formData.categoryExclusions?.[cat] || [];
    return incs.length + excs.length;
  };

  const updateField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    // Sync with react-hook-form for validated fields
    if (name === "recipientName" || name === "recipientEmail") {
      rhfSetValue(name, value, { shouldValidate: true });
    }
  };

  const toggleInclusion = (item) => {
    const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
    let foundCat = "GENERAL";
    for (const cat of categoriesList) {
      const global = getGlobalTerms(cat);
      if (global.inclusions.some((t) => t.text === item)) {
        foundCat = cat;
        break;
      }
    }

    setFormData((prev) => {
      const prevCatIn = prev.categoryInclusions?.[foundCat] || [];
      const nextCatIn = prevCatIn.includes(item)
        ? prevCatIn.filter((i) => i !== item)
        : [...prevCatIn, item];

      const updatedCatIn = {
        ...prev.categoryInclusions,
        [foundCat]: nextCatIn,
      };

      const flatIn = [];
      categoriesList.forEach((cat) => {
        flatIn.push(...(updatedCatIn[cat] || []));
      });

      return {
        ...prev,
        inclusions: flatIn,
        categoryInclusions: updatedCatIn,
      };
    });
  };

  const toggleExclusion = (item) => {
    const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
    let foundCat = "GENERAL";
    for (const cat of categoriesList) {
      const global = getGlobalTerms(cat);
      if (global.exclusions.some((t) => t.text === item)) {
        foundCat = cat;
        break;
      }
    }

    setFormData((prev) => {
      const prevCatEx = prev.categoryExclusions?.[foundCat] || [];
      const nextCatEx = prevCatEx.includes(item)
        ? prevCatEx.filter((e) => e !== item)
        : [...prevCatEx, item];

      const updatedCatEx = {
        ...prev.categoryExclusions,
        [foundCat]: nextCatEx,
      };

      const flatEx = [];
      categoriesList.forEach((cat) => {
        flatEx.push(...(updatedCatEx[cat] || []));
      });

      return {
        ...prev,
        exclusions: flatEx,
        categoryExclusions: updatedCatEx,
      };
    });
  };

  const updateScope = (idx, key, value) => {
    setFormData((p) => {
      const nextItems = p.scopeItems.map((s, i) => {
        if (i !== idx) return s;
        
        let target = { ...s, [key]: value };
        
        if (key === "length" || key === "breadth" || key === "qty" || key === "rate") {
          const L = Number(target.length) || 0;
          const B = Number(target.breadth) || 0;
          target.calculatedArea = L * B;
          
          const userQty = target.qty !== "" ? Number(target.qty) : 0;
          const qtyToUse = userQty > 0 ? userQty : target.calculatedArea;
          const rateToUse = Number(target.rate) || 0;
          target.amount = Math.round(qtyToUse * rateToUse);
        }
        
        return target;
      });
      return { ...p, scopeItems: nextItems };
    });
  };

  // Handler for direct library picker — maps library item to scope row shape.
  const handleLibraryPick = (lib) => {
    // Seed the schedule duration: prefer the item's own days, else fall back to
    // the default configured for its room category (Master → Schedule).
    const days =
      lib.days != null && lib.days !== ""
        ? lib.days
        : getRoomDefaultDays(lib.category);
    const newRow = {
      area: lib.category || "",
      description: lib.description || "",
      length: lib.length != null ? Number(lib.length) : "",
      breadth: lib.breadth != null ? Number(lib.breadth) : "",
      height: lib.height != null ? Number(lib.height) : "",
      calculatedArea: computeLibraryItemArea(lib) || 0,
      qty: lib.qty != null ? Number(lib.qty) : "",
      rate: lib.rate != null ? Number(lib.rate) : "",
      amount: computeLibraryItemAmount(lib) || 0,
      unit: lib.unit || "sqft",
      days,
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
    };
    setFormData((p) => ({
      ...p,
      scopeItems: [newRow, ...p.scopeItems],
    }));
    setLibraryPickerOpen(false);
  };

  const removeScopeRow = (idx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.filter((_, i) => i !== idx),
    }));
  };

  const updateMaterial = (scopeIdx, matIdx, key, value) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).map((m, j) =>
                j === matIdx ? { ...m, [key]: value } : m,
              ),
            }
          : s,
      ),
    }));
  };

  const removeMaterial = (scopeIdx, matIdx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).filter((_, j) => j !== matIdx),
            }
          : s,
      ),
    }));
  };

  const buildQuote = (overrides = {}) => ({
    quoteId: formData.quoteId,
    parentId,
    parentType,
    presetKey,
    recipientName: formData.recipientName,
    recipientEmail: formData.recipientEmail,
    recipientPhone: formData.recipientPhone,
    propertyType: formData.propertyType,
    sizeRange: formData.sizeRange,
    validityDays: Number(formData.validityDays) || 30,
    scopeItems: formData.scopeItems,
    inclusions: formData.inclusions,
    exclusions: formData.exclusions,
    categoryInclusions: formData.categoryInclusions,
    categoryExclusions: formData.categoryExclusions,
    notes: formData.notes,
    createdAt: formData.createdAt,
    subtotal: totals.subtotal,
    gst: totals.gst,
    grandTotal: totals.grandTotal,
    status: "draft",
    ...overrides,
  });

  const handleSaveDraft = () => {
    if (!parentId) return;
    saveQuote(parentId, buildQuote());
    onClose?.();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async (validatedData) => {
    // Also check scope items (not managed by react-hook-form)
    if (!formData.scopeItems?.length) {
      return;
    }
    // Sync validated recipient data back to formData
    formData.recipientName = validatedData.recipientName;
    formData.recipientEmail = validatedData.recipientEmail;

    setIsSending(true);
    await new Promise((r) => setTimeout(r, 600));
    const sentAt = new Date().toISOString();
    const subjectPrefix = isProposal
      ? isResend
        ? "Revised proposal"
        : "Proposal"
      : "Quote";
    const subject = `${subjectPrefix} ${formData.quoteId} for your project — ${parentId}`;
    const body = `Hi ${formData.recipientName},\n\nPlease find attached our ${subjectPrefix.toLowerCase()} ${formData.quoteId} for your ${formData.propertyType} (${formData.sizeRange}). The grand total is ${formatAmount(totals.grandTotal)} (incl. GST). This quote is valid for ${formData.validityDays} days.\n\nLooking forward to your feedback.\n\n— Digital Atelier`;
    const quote = buildQuote({ status: "sent", sentAt, subject, body });
    saveQuote(parentId, quote);
    onSent?.({
      quoteId: quote.quoteId,
      to: formData.recipientEmail,
      subject,
      body,
      total: totals.grandTotal,
      quote,
      isResend,
    });
    setIsSending(false);
    onClose?.();
  };

  const previewQuote = buildQuote();

  const footer = (
    <div className="flex flex-wrap justify-between items-center gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        disabled={isSending}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {/* Save Draft only makes sense in standalone Quote mode — proposal
            mode is a single-shot send. */}
        {!isProposal && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
          >
            <Save size={14} /> Save Draft
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          disabled={isSending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
        <button
          type="button"
          onClick={rhfHandleSubmit(handleSend)}
          disabled={isSending}
          className="min-w-[180px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={14} />{" "}
              {isProposal
                ? isResend
                  ? "Resend Proposal"
                  : "Send Proposal"
                : "Send via Email"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const modalTitle = isProposal
    ? isResend
      ? "Resend Proposal"
      : "Send Proposal"
    : "Quick Quote";
  const modalSubtitle = isProposal
    ? isResend
      ? "Existing scope and pricing loaded. Edit, preview, and resend."
      : "Pick a preset, edit the scope, preview, then send via email."
    : "Pick a preset, edit the scope, then send or print.";

  return (
    <Modal
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={isSending ? undefined : onClose}
      footer={footer}
      maxWidth="max-w-[1100px]"
      maxHeight="max-h-[95vh]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* Form pane */}
        <div className="modal-no-print">
          {/* Preset is editable in standalone Quote mode but locked in
              Proposal mode (it was chosen during inquiry creation). */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Property Preset</SectionHeader>
              <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-text">
                    {presetKey.replace(/^(\d+)(BHK)$/i, "$1 BHK")}
                    {formData.propertyType ? ` / ${formData.propertyType}` : ""}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {formData.sizeRange ||
                      getConfigForType(presetKey, formData.propertyType)
                        ?.sizeRange ||
                      ""}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  From inquiry
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <SectionHeader>Preset</SectionHeader>
              <InputField
                name="presetKey"
                label="Property Preset"
                type="select"
                value={presetKey}
                onChange={handlePresetChange}
                options={getPresetKeys()}
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Switching presets reloads scope items. Existing edits will be
                lost.
              </p>
            </div>
          )}

          <div className="border-t border-border my-5" />

          {/* Recipient — proposal mode shows just the email; the standalone
              Quote mode keeps the full name/phone/email block. */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Recipient Email</SectionHeader>
              <InputField
                name="recipientEmail"
                label="Email"
                type="email"
                register={register("recipientEmail")}
                onChange={(e) => updateField("recipientEmail", e.target.value)}
                error={errors.recipientEmail?.message}
                placeholder="example@domain.com"
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Sample quotation will be sent to this address.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <SectionHeader>Recipient</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="recipientName"
                    label="Name"
                    type="text"
                    register={register("recipientName")}
                    onChange={(e) =>
                      updateField("recipientName", e.target.value)
                    }
                    error={errors.recipientName?.message}
                    placeholder="Full name"
                  />
                  <InputField
                    name="recipientPhone"
                    label="Phone"
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) =>
                      updateField("recipientPhone", e.target.value)
                    }
                    placeholder="10-digit number"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="recipientEmail"
                    label="Email"
                    type="email"
                    register={register("recipientEmail")}
                    onChange={(e) =>
                      updateField("recipientEmail", e.target.value)
                    }
                    error={errors.recipientEmail?.message}
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="border-t border-border my-5" />

              <div className="mb-5">
                <SectionHeader>Property</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="propertyType"
                    label="Property Type"
                    type="select"
                    value={formData.propertyType}
                    onChange={handlePropertyTypeChange}
                    options={getPropertyTypesForPreset(presetKey)}
                  />
                  <InputField
                    name="sizeRange"
                    label="Size"
                    type="text"
                    value={formData.sizeRange}
                    onChange={(e) => updateField("sizeRange", e.target.value)}
                    placeholder="e.g. 800–1100 sq ft"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="validityDays"
                    label="Validity (days)"
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) =>
                      updateField("validityDays", e.target.value)
                    }
                    placeholder="30"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <SectionHeader>Scope of Work</SectionHeader>
              <button
                type="button"
                onClick={() => setLibraryPickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg transition-all -mt-3"
              >
                <Pipette size={12} /> Pick from Library
              </button>
            </div>
            {errors.scopeItems && (
              <p className="text-red-500 text-[10px] mb-2">
                {errors.scopeItems.message}
              </p>
            )}
            <div className="space-y-4">
              {groupedScope.map((group) => {
                const roomColorObj = roomColor(group.room.split(" ")[0]);
                const groupOpen = isGroupOpen(group.room);
                return (
                  <div key={group.room} className="border border-bordergray rounded-xl bg-white overflow-hidden shadow-sm">
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.room)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-bg-soft/40 hover:bg-bg-soft/70 transition-colors cursor-pointer border-b border-bordergray"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {groupOpen ? (
                          <ChevronDown size={13} className="text-text-muted shrink-0" />
                        ) : (
                          <ChevronRight size={13} className="text-text-muted shrink-0" />
                        )}
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${roomColorObj.dot}`} />
                        <h4 className="text-[12px] font-bold text-textcolor uppercase tracking-wide truncate">
                          {group.room}
                        </h4>
                        <span className="text-[10px] font-semibold text-text-muted bg-bg-soft px-1.5 py-0.5 rounded-md border border-bordergray">
                          {group.rows.length}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-textcolor tabular-nums shrink-0">
                        {formatAmount(group.total)}
                      </span>
                    </button>

                    {/* Accordion Content */}
                    {groupOpen && (
                      <div className="p-3 space-y-3 bg-white">
                        {group.rows.map(({ item, idx }) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-bg-soft/30 p-2 space-y-2"
                          >
                            <div className="flex items-center justify-between text-[10px] text-text-muted font-bold tracking-wide uppercase">
                              <span>Scope Block: {item._displayCategory}</span>
                            </div>
                            <div className="grid grid-cols-[1fr_1.5fr_110px_28px] gap-2 items-start">
                              <CategorySelect
                                value={item.area}
                                onChange={(v) => updateScope(idx, "area", v)}
                                placeholder="Room…"
                                className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full cursor-pointer focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                              />
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  updateScope(idx, "description", e.target.value)
                                }
                                placeholder="Description"
                                className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                              />
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) =>
                                  updateScope(idx, "amount", e.target.value)
                                }
                                placeholder="₹"
                                className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                              />
                              <button
                                type="button"
                                onClick={() => removeScopeRow(idx)}
                                className="h-8 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Remove row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Dimensions row */}
                            <div className="grid grid-cols-6 gap-2 pt-1 border-t border-dashed border-bordergray">
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted  mb-0.5">L (ft)</label>
                                <input
                                  type="number"
                                  placeholder="0.0"
                                  value={item.length ?? ""}
                                  onChange={(e) => updateScope(idx, "length", e.target.value)}
                                  className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted  mb-0.5">D (ft)</label>
                                <input
                                  type="number"
                                  placeholder="0.0"
                                  value={item.breadth ?? ""}
                                  onChange={(e) => updateScope(idx, "breadth", e.target.value)}
                                  className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted  mb-0.5">H (ft)</label>
                                <input
                                  type="number"
                                  placeholder="0.0"
                                  value={item.height ?? ""}
                                  onChange={(e) => updateScope(idx, "height", e.target.value)}
                                  className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted mb-0.5">AREA</label>
                                <input
                                  type="text"
                                  readOnly
                                  value={item.calculatedArea ? Number(item.calculatedArea).toFixed(2) : "0.00"}
                                  className="bg-bg-soft border border-bordergray text-[11px] text-text-muted rounded-md px-2 py-1.5 w-full cursor-not-allowed focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted uppercase mb-0.5">QTY</label>
                                <input
                                  type="number"
                                  placeholder="Use Area"
                                  value={item.qty ?? ""}
                                  onChange={(e) => updateScope(idx, "qty", e.target.value)}
                                  className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-text-muted uppercase mb-0.5">RATE ₹</label>
                                <input
                                  type="number"
                                  placeholder="Rate"
                                  value={item.rate ?? ""}
                                  onChange={(e) => updateScope(idx, "rate", e.target.value)}
                                  className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                                />
                              </div>
                            </div>

                            {/* Material specs */}
                            {(item.materials || []).length > 0 && (
                              <div className="pl-3 border-l-2 border-select-blue/30 space-y-1.5">
                                {item.materials.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="grid grid-cols-[100px_1fr_22px] gap-2 items-center"
                                  >
                                    <input
                                      type="text"
                                      value={m.name}
                                      onChange={(e) =>
                                        updateMaterial(idx, mIdx, "name", e.target.value)
                                      }
                                      placeholder="Plywood"
                                      className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                    />
                                    <input
                                      type="text"
                                      value={m.spec}
                                      onChange={(e) =>
                                        updateMaterial(idx, mIdx, "spec", e.target.value)
                                      }
                                      placeholder="BWP 19mm"
                                      className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeMaterial(idx, mIdx)}
                                      className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Remove material"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end gap-4 text-[12px]">
              <span className="text-text-muted">
                Subtotal:{" "}
                <span className="font-bold text-text">
                  {formatAmount(totals.subtotal)}
                </span>
              </span>
              <span className="text-text-muted">
                GST:{" "}
                <span className="font-bold text-orange-500">
                  {formatAmount(totals.gst)}
                </span>
              </span>
              <span className="text-text-muted">
                Total:{" "}
                <span className="font-bold text-primary">
                  {formatAmount(totals.grandTotal)}
                </span>
              </span>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div className="mb-5">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <SectionHeader>Terms & Conditions</SectionHeader>
                {isResend && (
                  <button
                    type="button"
                    onClick={() => {
                      const categoryInclusions = {};
                      const categoryExclusions = {};
                      const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
                      categoriesList.forEach((cat) => {
                        const global = getGlobalTerms(cat);
                        categoryInclusions[cat] = global.inclusions.filter((t) => t.isDefault).map((t) => t.text);
                        categoryExclusions[cat] = global.exclusions.filter((t) => t.isDefault).map((t) => t.text);
                      });
                      const flatIn = [];
                      const flatEx = [];
                      categoriesList.forEach((cat) => {
                        flatIn.push(...(categoryInclusions[cat] || []));
                        flatEx.push(...(categoryExclusions[cat] || []));
                      });

                      setFormData((prev) => ({
                        ...prev,
                        inclusions: flatIn,
                        exclusions: flatEx,
                        categoryInclusions,
                        categoryExclusions,
                      }));
                      setTermOptions({
                        inclusions: flatIn,
                        exclusions: flatEx,
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
                    title="Restore default Terms & Conditions from the master module"
                  >
                    <RotateCcw size={12} /> Reset to Default
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 -mt-1.5">
                <button
                  type="button"
                  onClick={() => setTermsParentModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-select-blue bg-select-blue/5 text-select-blue text-[11.5px] font-bold hover:bg-select-blue/10 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <Plus size={14} className="text-select-blue group-hover:scale-110 transition-transform" />
                  <span>Add Conditions</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {CATEGORIES_META.map((cat) => {
                const Icon = cat.icon;
                const activeIncs = formData.categoryInclusions?.[cat.id] || [];
                const activeExcs = formData.categoryExclusions?.[cat.id] || [];
                const totalCount = activeIncs.length + activeExcs.length;
                const isExpanded = !!expandedCategories[cat.id];

                return (
                  <div key={cat.id} className="border border-bordergray rounded-xl overflow-hidden bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-bg-soft/40 hover:bg-bg-soft transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-select-blue" />
                        <span className="text-[12px] font-bold text-textcolor">
                          {cat.label}
                        </span>
                        <span className="text-[9.5px] text-text-muted bg-white border border-bordergray px-1.5 py-0.5 rounded-md font-medium">
                          {totalCount} selected
                        </span>
                      </div>
                      <div className="text-text-muted">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-textcolor/60" />
                        ) : (
                          <ChevronRight size={14} className="text-textcolor/60" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-bordergray/50 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
                        {/* Included */}
                        <div>
                          <h4 className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mb-2">
                            Included
                          </h4>
                          <div className="space-y-2">
                            {activeIncs.length > 0 ? (
                              activeIncs.map((item, idx) => (
                                <label
                                  key={idx}
                                  className="flex items-start gap-2 cursor-pointer group font-semibold text-[11px]"
                                >
                                  <CustomCheckbox
                                    accent="green"
                                    checked={true}
                                    onChange={() => toggleInclusion(item)}
                                  />
                                  <span className="text-[11.5px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                                    {item}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <p className="text-[10.5px] text-text-subtle italic">
                                No inclusions selected.
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Not Included */}
                        <div>
                          <h4 className="text-[10px] font-bold text-red-500 tracking-wider uppercase mb-2">
                            Not Included
                          </h4>
                          <div className="space-y-2">
                            {activeExcs.length > 0 ? (
                              activeExcs.map((item, idx) => (
                                <label
                                  key={idx}
                                  className="flex items-start gap-2 cursor-pointer group font-semibold text-[11px]"
                                >
                                  <CustomCheckbox
                                    accent="red"
                                    checked={true}
                                    onChange={() => toggleExclusion(item)}
                                  />
                                  <span className="text-[11.5px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                                    {item}
                                  </span>
                                </label>
                              ))
                            ) : (
                              <p className="text-[10.5px] text-text-subtle italic">
                                No exclusions selected.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div>
            <SectionHeader>Notes / Terms</SectionHeader>
            <InputField
              name="notes"
              label=""
              type="textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes for the client (payment terms, timelines, etc.)"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="text-[10px] uppercase tracking-widest text-text-subtle font-bold mb-2 modal-no-print">
            Live Preview
          </p>
          <div className="quote-print-area rounded-xl border border-border bg-white p-6 shadow-sm">
            <QuotePreview quote={previewQuote} />
          </div>
        </div>
      </div>

      {/* Library Picker — direct pick from saved items */}
      {libraryPickerOpen && (
        <LibraryPickerModal
          onClose={() => setLibraryPickerOpen(false)}
          onPick={handleLibraryPick}
        />
      )}

      {/* Add Conditions Parent Modal */}
      {termsParentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] animate-fade-in p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-bordergray transform scale-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-bg-soft border-b border-bordergray">
              <div>
                <h3 className="text-[14px] font-bold text-textcolor">Add Conditions</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Select a category to customize Terms & Conditions</p>
              </div>
              <button
                type="button"
                onClick={() => setTermsParentModalOpen(false)}
                className="text-text-subtle hover:text-textcolor p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-bordergray transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categories List */}
            <div className="p-5 space-y-2.5">
              {CATEGORIES_META.map((cat) => {
                const Icon = cat.icon;
                const count = getActiveCatCount(cat.id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategoryModal(cat.id);
                      setTermsParentModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-bordergray bg-white hover:border-select-blue/30 hover:bg-bg-soft/40 transition-all shadow-xs cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-select-blue/5 text-select-blue group-hover:bg-select-blue group-hover:text-white transition-all">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-textcolor group-hover:text-select-blue transition-colors">
                          {cat.label}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Customize {cat.label.toLowerCase()} clauses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-150">
                          {count} selected
                        </span>
                      )}
                      <ChevronRight size={14} className="text-text-muted group-hover:text-textcolor transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 bg-bg-soft border-t border-bordergray">
              <button
                type="button"
                onClick={() => setTermsParentModalOpen(false)}
                className="px-4 py-2 bg-white border border-bordergray rounded-xl text-textcolor hover:bg-bg-soft text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated category Terms & Conditions modal */}
      {activeCategoryModal && (
        <CategoryTermsModal
          category={activeCategoryModal}
          categoryLabel={
            CATEGORIES_META.find((c) => c.id === activeCategoryModal)?.label || ""
          }
          initialInclusions={formData.categoryInclusions?.[activeCategoryModal] || []}
          initialExclusions={formData.categoryExclusions?.[activeCategoryModal] || []}
          onApply={(newInclusions, newExclusions) => {
            const updatedCatIn = {
              ...formData.categoryInclusions,
              [activeCategoryModal]: newInclusions,
            };
            const updatedCatEx = {
              ...formData.categoryExclusions,
              [activeCategoryModal]: newExclusions,
            };

            // Reconstruct flat arrays
            const flatIn = [];
            const flatEx = [];
            const categoriesList = ["STATUATORY", "DELIVERY", "PAYMENTS", "TECHNICAL", "GENERAL"];
            categoriesList.forEach((cat) => {
              flatIn.push(...(updatedCatIn[cat] || []));
              flatEx.push(...(updatedCatEx[cat] || []));
            });

            setFormData((prev) => ({
              ...prev,
              inclusions: flatIn,
              exclusions: flatEx,
              categoryInclusions: updatedCatIn,
              categoryExclusions: updatedCatEx,
            }));

            // Sync termOptions so they display on the main form
            setTermOptions({
              inclusions: flatIn,
              exclusions: flatEx,
            });

            setActiveCategoryModal(null);
            setTermsParentModalOpen(true);
          }}
          onClose={() => {
            setActiveCategoryModal(null);
            setTermsParentModalOpen(true);
          }}
        />
      )}
    </Modal>
  );
};

export default QuoteModal;
