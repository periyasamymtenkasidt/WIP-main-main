import { useMemo, useState, useEffect, useRef } from "react";
import {
  Trash2,
  Printer,
  Check,
  Pipette,
  ListPlus,
  ChevronDown,
  ChevronRight,
  Scale,
  Truck,
  CreditCard,
  Wrench,
  FileText,
  Plus,
  X,
} from "lucide-react";
import Modal from "./Modal";
import InputField from "./InputField";
import {
  getDefaultTermStrings,
  getGlobalTerms,
} from "../data/termsStorage";
import CategoryTermsModal from "./CategoryTermsModal";
import QuotePreview from "./QuotePreview";
import {
  getPresetKeys,
  computeTotals,
  generateQuoteId,
  getConfigForType,
} from "../data/QuotePresets";
import { computeLibraryItemAmount } from "../data/itemLibrary";
import { formatAmount } from "../utils/formatAmount";
import { assignCategoryNames } from "../utils/scopeNaming";
import { roomColor } from "../data/categoryColors";
import CategorySelect from "./CategorySelect";
import LibraryPickerModal from "./LibraryPickerModal";
import { getRoomDefaultDays } from "../data/scheduleConfig";

// ── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-3">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

// ── Custom Checkbox ─────────────────────────────────────────────────────────
const SQCheckbox = ({
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

// ── Helpers ──────────────────────────────────────────────────────────────────
// assignCategoryNames is now imported from ../utils/scopeNaming

const CATEGORIES_META = [
  { id: "STATUATORY", label: "Statutory", icon: Scale },
  { id: "DELIVERY", label: "Delivery", icon: Truck },
  { id: "PAYMENTS", label: "Payment", icon: CreditCard },
  { id: "TECHNICAL", label: "Technical", icon: Wrench },
  { id: "GENERAL", label: "General", icon: FileText },
];

// ── Build initial data ──────────────────────────────────────────────────────
const buildSampleQuoteData = ({
  presetKey,
  recipient,
  defaultPropertyType,
  presetData,
}) => {
  const presetKeys = getPresetKeys();
  const defaultTerms = getDefaultTermStrings();
  const activePresetKey =
    presetKey ||
    (presetData?.presetKey && presetKeys.includes(presetData.presetKey)
      ? presetData.presetKey
      : presetKeys[0] || "2BHK");
  const activePropertyType =
    presetData?.propertyType || defaultPropertyType || "";
  const cfg = getConfigForType(activePresetKey, activePropertyType) || {};
  const quoteId = generateQuoteId();
  const createdAt = new Date().toISOString();
  const scopeItems = presetData?.scopeItems
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
  const categoriesList = [
    "STATUATORY",
    "DELIVERY",
    "PAYMENTS",
    "TECHNICAL",
    "GENERAL",
  ];

  categoriesList.forEach((cat) => {
    const global = getGlobalTerms(cat);
    const defaultIn = global.inclusions
      .filter((t) => t.isDefault)
      .map((t) => t.text);
    const defaultEx = global.exclusions
      .filter((t) => t.isDefault)
      .map((t) => t.text);

    if (presetData?.categoryInclusions?.[cat]) {
      categoryInclusions[cat] = [...presetData.categoryInclusions[cat]];
    } else if (presetData?.inclusions) {
      const catGlobalIntexts = global.inclusions.map((t) => t.text);
      categoryInclusions[cat] = presetData.inclusions.filter((text) =>
        catGlobalIntexts.includes(text),
      );
    } else {
      categoryInclusions[cat] = defaultIn;
    }

    if (presetData?.categoryExclusions?.[cat]) {
      categoryExclusions[cat] = [...presetData.categoryExclusions[cat]];
    } else if (presetData?.exclusions) {
      const catGlobalExtexts = global.exclusions.map((t) => t.text);
      categoryExclusions[cat] = presetData.exclusions.filter((text) =>
        catGlobalExtexts.includes(text),
      );
    } else {
      categoryExclusions[cat] = defaultEx;
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
    recipientName: recipient?.name || "",
    recipientEmail: recipient?.email || "",
    recipientPhone: recipient?.phone || "",
    propertyType: activePropertyType,
    sizeRange: presetData?.sizeRange || cfg.sizeRange || "",
    validityDays: presetData?.validityDays || 30,
    scopeItems,
    inclusions: flatIn,
    exclusions: flatEx,
    categoryInclusions,
    categoryExclusions,
    notes: presetData?.notes || "",
  };
};

const inferSQPresetKey = (presetData) => {
  const keys = getPresetKeys();
  if (presetData?.presetKey && keys.includes(presetData.presetKey))
    return presetData.presetKey;
  return keys.includes("2BHK") ? "2BHK" : keys[0];
};

// ════════════════════════════════════════════════════════════════════════════
// SampleQuoteModal — fully independent from QuoteModal / Proposal Form
// ════════════════════════════════════════════════════════════════════════════
const SampleQuoteModal = ({
  recipient,
  defaultPropertyType,
  presetData,
  onClose,
  onSave,
}) => {
  const [presetKey] = useState(() =>
    inferSQPresetKey(presetData),
  );
  const [formData, setFormData] = useState(() =>
    buildSampleQuoteData({
      presetKey: inferSQPresetKey(presetData),
      recipient,
      defaultPropertyType,
      presetData,
    }),
  );

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSaveRef.current?.({
      quotePreset: presetKey,
      quoteSizeRange: formData.sizeRange,
      quoteScopeItems: formData.scopeItems,
      quoteInclusions: formData.inclusions,
      quoteExclusions: formData.exclusions,
      quoteCategoryInclusions: formData.categoryInclusions,
      quoteCategoryExclusions: formData.categoryExclusions,
      quoteNotes: formData.notes,
    });
  }, [formData, presetKey]);

  // Terms
  const [ setTermOptions] = useState(() => {
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

  // Library picker + Add Conditions modal state
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] = useState(null);
  const [termsParentModalOpen, setTermsParentModalOpen] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState({
    STATUATORY: false,
    DELIVERY: false,
    PAYMENTS: false,
    TECHNICAL: false,
    GENERAL: false,
  });

  const totals = useMemo(
    () => computeTotals(formData.scopeItems),
    [formData.scopeItems],
  );

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

  const getActiveCatCount = (cat) => {
    const incs = formData.categoryInclusions?.[cat] || [];
    const excs = formData.categoryExclusions?.[cat] || [];
    return incs.length + excs.length;
  };

  const updateField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const toggleInclusion = (item) => {
    const categoriesList = [
      "STATUATORY",
      "DELIVERY",
      "PAYMENTS",
      "TECHNICAL",
      "GENERAL",
    ];
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
    const categoriesList = [
      "STATUATORY",
      "DELIVERY",
      "PAYMENTS",
      "TECHNICAL",
      "GENERAL",
    ];
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
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === idx ? { ...s, [key]: value } : s,
      ),
    }));
  };

  // Pick from Library — maps library item to scope row shape (same as QuoteModal)
  const handleLibraryPick = (lib) => {
    const days =
      lib.days != null && lib.days !== ""
        ? lib.days
        : getRoomDefaultDays(lib.category);
    const newRow = {
      area: lib.category || "",
      description: lib.description || "",
      amount: computeLibraryItemAmount(lib),
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

  // Build preview quote object
  const buildPreviewQuote = () => ({
    quoteId: formData.quoteId,
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
    notes: formData.notes,
    createdAt: formData.createdAt,
    subtotal: totals.subtotal,
    gst: totals.gst,
    grandTotal: totals.grandTotal,
    isSampleQuote: true,
  });

  const handlePrint = () => window.print();

  const previewQuote = buildPreviewQuote();

  const footer = (
    <div className="flex flex-wrap justify-between items-center gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all"
      >
        Close
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      title="Sample Quote"
      subtitle="Preview quote with scope from Proposal Master. Edit scope, preview, then print."
      onClose={onClose}
      footer={footer}
      maxWidth="max-w-[1100px]"
      maxHeight="max-h-[95vh]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* ── Form pane ── */}
        <div className="modal-no-print">
          {/* Property Preset (read-only display) */}
          <div className="mb-5">
            <SectionHeader>Property Preset</SectionHeader>
            <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-text">
                  {presetKey.replace(/^(\d+)(BHK)$/i, "$1 BHK")}
                  {formData.propertyType ? ` / ${formData.propertyType}` : ""}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {formData.sizeRange || ""}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                Sample Quote
              </span>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          {/* Recipient info (read-only) */}
          <div className="mb-5">
            <SectionHeader>Client Details</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-bordergray bg-bg-soft px-3 py-2">
                <p className="text-[9px] font-bold uppercase text-text-subtle tracking-wider mb-0.5">
                  Name
                </p>
                <p className="text-[12px] font-semibold text-textcolor">
                  {formData.recipientName || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-bordergray bg-bg-soft px-3 py-2">
                <p className="text-[9px] font-bold uppercase text-text-subtle tracking-wider mb-0.5">
                  Phone
                </p>
                <p className="text-[12px] font-semibold text-textcolor">
                  {formData.recipientPhone || "—"}
                </p>
              </div>
            </div>
            <div className="mt-2 rounded-lg border border-bordergray bg-bg-soft px-3 py-2">
              <p className="text-[9px] font-bold uppercase text-text-subtle tracking-wider mb-0.5">
                Email
              </p>
              <p className="text-[12px] font-semibold text-textcolor">
                {formData.recipientEmail || "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          {/* ── Scope of Work (editable — matches Proposal Form exactly) ── */}
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
            <div className="space-y-4">
              {groupedScope.map((group) => {
                const roomColorObj = roomColor(group.room.split(" ")[0]);
                const groupOpen = isGroupOpen(group.room);
                return (
                  <div
                    key={group.room}
                    className="border border-bordergray rounded-xl bg-white overflow-hidden shadow-sm"
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.room)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-bg-soft/40 hover:bg-bg-soft/70 transition-colors cursor-pointer border-b border-bordergray"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {groupOpen ? (
                          <ChevronDown
                            size={13}
                            className="text-text-muted shrink-0"
                          />
                        ) : (
                          <ChevronRight
                            size={13}
                            className="text-text-muted shrink-0"
                          />
                        )}
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${roomColorObj.dot}`}
                        />
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
                                disabled={true}
                                className="bg-bg-soft border border-bordergray text-[11px] text-text-muted rounded-md px-2 py-2 w-full cursor-not-allowed focus:outline-none"
                              />
                              <input
                                type="text"
                                value={item.description}
                                readOnly={true}
                                placeholder="Description"
                                className="bg-bg-soft border border-bordergray text-[11px] text-text-muted rounded-md px-2 py-2 w-full cursor-not-allowed focus:outline-none"
                              />
                              <input
                                type="number"
                                value={item.amount}
                                readOnly={true}
                                placeholder="₹"
                                className="bg-bg-soft border border-bordergray text-[11px] text-text-muted rounded-md px-2 py-2 w-full cursor-not-allowed focus:outline-none text-right"
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

                            {/* Material specs — read-only in Sample Quote */}
                            {(item.materials || []).length > 0 && (
                              <div className="pl-3 border-l-2 border-select-blue/30 space-y-1.5">
                                {item.materials.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="grid grid-cols-[100px_1fr] gap-2 items-center"
                                  >
                                    <input
                                      type="text"
                                      value={m.name}
                                      readOnly={true}
                                      placeholder="Plywood"
                                      className="bg-bg-soft border border-bordergray text-[10px] text-text-muted rounded-md px-2 py-1.5 w-full cursor-not-allowed focus:outline-none"
                                    />
                                    <input
                                      type="text"
                                      value={m.spec}
                                      readOnly={true}
                                      placeholder="BWP 19mm"
                                      className="bg-bg-soft border border-bordergray text-[10px] text-text-muted rounded-md px-2 py-1.5 w-full cursor-not-allowed focus:outline-none"
                                    />
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

          {/* ── Terms & Conditions (matches Proposal Form) ── */}
          <div className="mb-5">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <SectionHeader>Terms & Conditions</SectionHeader>
              </div>
              <div className="flex flex-wrap gap-2 -mt-1.5">
                <button
                  type="button"
                  onClick={() => setTermsParentModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-select-blue bg-select-blue/5 text-select-blue text-[11.5px] font-bold hover:bg-select-blue/10 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <Plus
                    size={14}
                    className="text-select-blue group-hover:scale-110 transition-transform"
                  />
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
                  <div
                    key={cat.id}
                    className="border border-bordergray rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [cat.id]: !prev[cat.id],
                        }))
                      }
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
                          <ChevronDown
                            size={14}
                            className="text-textcolor/60"
                          />
                        ) : (
                          <ChevronRight
                            size={14}
                            className="text-textcolor/60"
                          />
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
                                  <SQCheckbox
                                    accent="green"
                                    checked={true}
                                    onChange={() => toggleInclusion(item)}
                                  />
                                  <span className="text-[11.5px] text-text-muted group-hover:text-textcolor transition-colors leading-tight font-medium">
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
                                  <SQCheckbox
                                    accent="red"
                                    checked={true}
                                    onChange={() => toggleExclusion(item)}
                                  />
                                  <span className="text-[11.5px] text-text-muted group-hover:text-textcolor transition-colors leading-tight font-medium">
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
              name="sq_notes"
              label=""
              type="textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes for the client (payment terms, timelines, etc.)"
            />
          </div>
        </div>

        {/* ── Preview pane ── */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="text-[10px] uppercase tracking-widest text-text-subtle font-bold mb-2 modal-no-print">
            Live Preview
          </p>
          <div className="quote-print-area rounded-xl border border-border bg-white p-6 shadow-sm">
            <QuotePreview quote={previewQuote} />
          </div>
        </div>
      </div>

      {/* Library Picker — same as Proposal Form */}
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
                <h3 className="text-[14px] font-bold text-textcolor">
                  Add Conditions
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Select a category to customize Terms & Conditions
                </p>
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
                      <ChevronRight
                        size={14}
                        className="text-text-muted group-hover:text-textcolor transition-colors"
                      />
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
            CATEGORIES_META.find((c) => c.id === activeCategoryModal)?.label ||
            ""
          }
          initialInclusions={
            formData.categoryInclusions?.[activeCategoryModal] || []
          }
          initialExclusions={
            formData.categoryExclusions?.[activeCategoryModal] || []
          }
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
            const categoriesList = [
              "STATUATORY",
              "DELIVERY",
              "PAYMENTS",
              "TECHNICAL",
              "GENERAL",
            ];
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

export default SampleQuoteModal;
