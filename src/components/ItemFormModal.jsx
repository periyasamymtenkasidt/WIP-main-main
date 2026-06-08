import { useMemo, useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  Check,
  Package,
  Pipette,
  Sparkles,
  Ruler,
  Calculator,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "./InputField";
import CategorySelect from "./CategorySelect";
import {
  getScheduleConfig,
  getRoomDefaultDays,
  getCategoryFromHeading,
  addScheduleHeading,
  getRoomCategoryPresets,
} from "../data/scheduleConfig";
import { roomColor } from "../data/categoryColors";
import {
  assignCategoryNames,
  getDetailedDescription,
  getCategoryFromItemName,
} from "../utils/scopeNaming";
import DestinationPromptModal from "./DestinationPromptModal";
import EditableHeadingDropdown from "./EditableHeadingDropdown";
import FilteredItemNameDropdown from "./FilteredItemNameDropdown";
import DuplicateScopeWarningModal from "./DuplicateScopeWarningModal";

const itemFormSchema = yup.object().shape({
  heading: yup.string().trim(),
  itemName: yup.string().trim(),
  description: yup.string().trim(),
  spec: yup.string().trim(),
  hsn: yup.string().trim(),
  rate: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Rate cannot be negative")
    .typeError("Rate must be a number"),
  length: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Length cannot be negative")
    .typeError("Length must be a number"),
  breadth: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "depth cannot be negative")
    .typeError("depth must be a number"),
  height: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Height cannot be negative")
    .typeError("Height must be a number"),
  qty: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Qty cannot be negative")
    .typeError("Qty must be a number"),
});

import {
  listLibrary,
  blankLibraryItem,
  computeLibraryItemArea,
  computeLibraryItemQty,
  computeLibraryItemAmount,
} from "../data/itemLibrary";
import { UNITS, HSN_SUGGESTIONS, GST_OPTIONS } from "../data/boqUnits";

const inputBase =
  "bg-white border border-bordergray text-[12px] text-textcolor rounded-lg px-3 py-2 w-full focus:outline-none focus:border-select-blue focus:ring-2 focus:ring-select-blue/15 transition-all placeholder:text-text-subtle";

const ItemFormModal = ({
  initial,
  onSave,
  onClose,
  title,
  submitLabel,
  showCategory = true,
  showTags = true,
  roomCategoryMode = false,
  multiEntryMode = false,
  existingScopeItems = [],
}) => {
  const defaults = {
    ...blankLibraryItem(),
    ...initial,
  };

  // react-hook-form manages the top-level validated fields
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue: rhfSetValue,
    watch,
    reset: rhfReset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(itemFormSchema),
    defaultValues: {
      heading: defaults.heading || defaults.area || "",
      itemName: defaults.itemName || (roomCategoryMode ? defaults.spec : defaults.description) || "",
      description: defaults.description || "",
      spec: defaults.spec || "",
      hsn: defaults.hsn || "",
      rate: defaults.rate || 0,
      length: defaults.length || 0,
      breadth: defaults.breadth || 0,
      height: defaults.height || 0,
      qty: defaults.qty || 0,
    },
  });

  // Remaining fields managed via useState (dimensions with custom display
  // logic, dynamic arrays for materials/tags, selects that feed computed values)
  const [form, setForm] = useState({
    ...defaults,
    materials: initial?.materials ? [...initial.materials] : [],
    tags: initial?.tags ? [...initial.tags] : [],
  });

  // Drafts state for multi-entry mode
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(null);

  const namedDrafts = useMemo(() => {
    return drafts.map((d) => {
      const heading = d.heading || d.area || "";
      const itemName = d.itemName || d.description || "";
      return {
        ...d,
        _displayCategory: itemName,
      };
    });
  }, [drafts]);

  const groupedDrafts = useMemo(() => {
    const groups = {};
    drafts.forEach((d, index) => {
      const heading = d.heading || d.area || "UNASSIGNED";
      if (!groups[heading]) {
        groups[heading] = [];
      }
      groups[heading].push({ draft: d, index });
    });
    return groups;
  }, [drafts]);

  const [destPrompt, setDestPrompt] = useState({
    isOpen: false,
    itemName: "",
    existingHeadings: [],
    headingsWithItem: [],
    onSelect: null,
    onCreateNew: null,
    onCancel: null,
  });

  // ── Duplicate scope warning state ────────────────────────────────────────
  const [duplicateWarning, setDuplicateWarning] = useState({
    isOpen: false,
    itemName: "",
    existingHeading: "",
    onAdd: null,
    onSkip: null,
  });

  const getDestinationHeading = (itemName, category) => {
    return new Promise((resolve, reject) => {
      const allItems = [
        ...(existingScopeItems || []),
        ...drafts,
      ];
      
      const resolvedCategory = category || getCategoryFromItemName(itemName);
      // Use Schedule Master heading to get the root category
      const rootCategory = getCategoryFromHeading(resolvedCategory);

      // Get ALL headings from Schedule Master (all room/category presets)
      const scheduleHeadingNames = getRoomCategoryPresets().map((r) => r.name.toUpperCase());

      // Also include ALL headings from existing scope items (not filtered by category)
      const scopeHeadings = Array.from(
        new Set(allItems.map((item) => (item.area || item.heading || "Unassigned").trim().toUpperCase()))
      );

      // Combine and deduplicate
      const existingHeadings = Array.from(new Set([...scheduleHeadingNames, ...scopeHeadings]));

      // Informational only — not used to hide headings
      const headingsWithItem = allItems
        .filter((item) => (item.itemName || item.description || "").trim().toLowerCase() === itemName.trim().toLowerCase())
        .map((item) => (item.area || item.heading || "Unassigned").trim().toUpperCase());


      setDestPrompt({
        isOpen: true,
        itemName,
        category: rootCategory,
        existingHeadings,
        headingsWithItem,
        onSelect: (selectedHeading) => {
          setDestPrompt((prev) => ({ ...prev, isOpen: false }));
          resolve(selectedHeading);
        },
        onCreateNew: (newHeading) => {
          setDestPrompt((prev) => ({ ...prev, isOpen: false }));
          // Persist new heading to Schedule Master
          addScheduleHeading(newHeading, rootCategory);
          resolve(newHeading);
        },
        onCancel: () => {
          setDestPrompt((prev) => ({ ...prev, isOpen: false }));
          reject(new Error("Cancelled by user"));
        },
      });
    });
  };

  const [pickerOpen, setPickerOpen] = useState(false);

  const update = (changes) => setForm((p) => ({ ...p, ...changes }));
  const addMaterial = () =>
    update({ materials: [...form.materials, { name: "", spec: "" }] });
  const updateMaterial = (idx, key, v) =>
    update({
      materials: form.materials.map((m, i) =>
        i === idx ? { ...m, [key]: v } : m,
      ),
    });
  const removeMaterial = (idx) =>
    update({ materials: form.materials.filter((_, i) => i !== idx) });

  const watchedItemName = watch("itemName");
  const watchedHeading = watch("heading");
  const [prevItemName, setPrevItemName] = useState(defaults.itemName || "");
  useEffect(() => {
    if (roomCategoryMode && watchedItemName && watchedItemName !== prevItemName) {
      const desc = getDetailedDescription(watchedItemName);
      // Only populate description when actual data exists (Req 6)
      if (desc && desc !== watchedItemName) {
        rhfSetValue("spec", desc, { shouldValidate: true });
      }
      setPrevItemName(watchedItemName);
    }
  }, [watchedItemName, roomCategoryMode, rhfSetValue, prevItemName]);

  // Resolve the category from the current heading for filtering dropdowns
  const resolvedHeadingCategory = useMemo(() => {
    if (!watchedHeading) return "";
    return getCategoryFromHeading(watchedHeading);
  }, [watchedHeading]);

  // ── Reset dependent fields when heading/category changes ────────────────
  // Tracks the previous heading so we can detect a genuine category switch
  // (not the initial render or same-heading re-selection).
  const prevHeadingRef = useRef(watchedHeading || "");
  useEffect(() => {
    if (!roomCategoryMode) return;
    const prev = prevHeadingRef.current;
    const next = watchedHeading || "";
    prevHeadingRef.current = next;

    // Skip no-change cases, and skip if next is empty (e.g. cleared)
    if (!next || prev === next) return;

    // Determine if the ROOT category actually changed
    const prevCat = getCategoryFromHeading(prev);
    const nextCat = getCategoryFromHeading(next);

    // Map Number of Days immediately from Schedule Master when heading changes
    // (Req 2) — regardless of whether the category changed or not
    const newDefaultDays = getRoomDefaultDays(nextCat);

    if (prevCat === nextCat) {
      update({
        days: newDefaultDays,
      });
      return;
    }

    // Category changed — clear all dependent fields
    rhfSetValue("itemName", "", { shouldValidate: false });
    rhfSetValue("spec", "", { shouldValidate: false });
    rhfSetValue("rate", 0, { shouldValidate: false });
    rhfSetValue("hsn", "", { shouldValidate: false });
    rhfSetValue("length", 0, { shouldValidate: false });
    rhfSetValue("breadth", 0, { shouldValidate: false });
    rhfSetValue("height", 0, { shouldValidate: false });
    rhfSetValue("qty", 0, { shouldValidate: false });
    update({
      days: newDefaultDays,
      materials: [],
      unit: "sqft",
      gstPercent: 18,
      masterId: undefined,
    });
    setPrevItemName("");
  }, [watchedHeading, roomCategoryMode]);

  // Auto-populate fields when an item is selected from the FilteredItemNameDropdown
  const handleItemNameSelect = (libraryItem) => {
    const itemName = libraryItem.description || "";
    // Only populate spec from actual data — don't fallback to itemName (Req 6)
    const spec = libraryItem.spec || getDetailedDescription(itemName) || "";
    rhfSetValue("itemName", itemName, { shouldValidate: true });
    rhfSetValue("spec", spec, { shouldValidate: true });
    rhfSetValue("rate", libraryItem.rate || 0, { shouldValidate: true });
    rhfSetValue("hsn", libraryItem.hsn || "", { shouldValidate: true });
    rhfSetValue("length", libraryItem.length || 0, { shouldValidate: true });
    rhfSetValue("breadth", libraryItem.breadth || 0, { shouldValidate: true });
    rhfSetValue("height", libraryItem.height || 0, { shouldValidate: true });
    rhfSetValue("qty", libraryItem.qty || 0, { shouldValidate: true });
    const days = libraryItem.days !== "" && libraryItem.days != null
      ? libraryItem.days
      : getRoomDefaultDays(libraryItem.category || resolvedHeadingCategory);
    update({
      unit: libraryItem.unit || "sqft",
      gstPercent: libraryItem.gstPercent || 18,
      days,
      materials: libraryItem.materials ? libraryItem.materials.map((m) => ({ ...m })) : [],
      masterId: libraryItem.id,
    });
    setPrevItemName(itemName);
  };

  // Convert a library item to the unified form state object
  const libraryItemToFormState = (lib) => {
    const defaultHeading = (lib.category || "").toUpperCase();
    const defaultItemName = lib.description || "";
    // Only populate spec from actual data — don't fallback to itemName (Req 6)
    const defaultSpec = lib.spec || getDetailedDescription(defaultItemName) || "";
    return {
      ...blankLibraryItem(),
      ...lib,
      draftId: Math.random().toString(36).substring(2, 9),
      heading: defaultHeading,
      itemName: defaultItemName,
      description: defaultItemName,
      spec: defaultSpec,
      hsn: lib.hsn || "",
      rate: lib.rate || 0,
      length: lib.length || 0,
      breadth: lib.breadth || 0,
      height: lib.height || 0,
      qty: lib.qty || 0,
      gstPercent: lib.gstPercent || 18,
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
      tags: lib.tags ? [...lib.tags] : [],
      days: lib.days !== "" && lib.days != null ? lib.days : getRoomDefaultDays(lib.category || ""),
    };
  };

  // Copy fields from a saved library item into the current form.
  const fillFromLibrary = (lib) => {
    const defaultHeading = (lib.category || "").toUpperCase();
    const defaultItemName = lib.description || "";
    // Only populate spec from actual data — don't fallback to itemName (Req 6)
    const defaultSpec = lib.spec || getDetailedDescription(defaultItemName) || "";
    
    prevHeadingRef.current = defaultHeading;
    setPrevItemName(defaultItemName);

    rhfReset({
      heading: defaultHeading,
      itemName: defaultItemName,
      description: defaultItemName,
      spec: defaultSpec,
      hsn: lib.hsn || "",
      rate: lib.rate || 0,
      length: lib.length || 0,
      breadth: lib.breadth || 0,
      height: lib.height || 0,
      qty: lib.qty || 0,
    });
    setForm((p) => ({
      ...blankLibraryItem(),
      ...lib,
      id: p.id,
      masterId: lib.id,
      heading: defaultHeading,
      itemName: defaultItemName,
      description: defaultItemName,
      spec: defaultSpec,
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
      tags: lib.tags ? [...lib.tags] : [],
    }));
    setPickerOpen(false);
  };

  // Multi-entry library pick handler — groups items by category and shows
  // one destination prompt per category (not per individual scope).
  const handleLibraryPick = async (libOrLibs) => {
    try {
      if (Array.isArray(libOrLibs)) {
        // Group selected items by category
        const categoryGroups = new Map();
        for (const lib of libOrLibs) {
          const cat = getCategoryFromHeading(lib.category || "") || lib.category || "Uncategorized";
          if (!categoryGroups.has(cat)) {
            categoryGroups.set(cat, []);
          }
          categoryGroups.get(cat).push(lib);
        }

        const newDrafts = [];
        const allItems = [...(existingScopeItems || []), ...drafts];

        // Process one category at a time — one destination prompt per category
        for (const [category, items] of categoryGroups) {
          // Get the destination heading for this category (shown once)
          let heading = "";
          if (roomCategoryMode) {
            try {
              heading = await getDestinationHeading(category, category);
            } catch {
              continue; // user cancelled this category, skip all its items
            }
          } else {
            heading = category;
          }

          // Bulk-assign all non-duplicate items in this category
          for (const lib of items) {
            const itemName = lib.description || "";
            const existingItem = [...allItems, ...newDrafts].find(
              (s) =>
                (s.itemName || s.description || "").trim().toLowerCase() === itemName.trim().toLowerCase() &&
                (s.area || s.heading || "").trim().toUpperCase() === heading.trim().toUpperCase()
            );

            if (existingItem) {
              // Duplicate detected — show warning
              const existingHeading = (existingItem.area || existingItem.heading || "").trim().toUpperCase();
              const shouldAdd = await new Promise((resolve) => {
                setDuplicateWarning({
                  isOpen: true,
                  itemName,
                  existingHeading,
                  onAdd: () => {
                    setDuplicateWarning((p) => ({ ...p, isOpen: false }));
                    resolve(true);
                  },
                  onSkip: () => {
                    setDuplicateWarning((p) => ({ ...p, isOpen: false }));
                    resolve(false);
                  },
                });
              });
              if (!shouldAdd) continue; // skip this duplicate
            }

            const itemFormState = libraryItemToFormState(lib);
            itemFormState.heading = heading;
            itemFormState.area = heading;
            newDrafts.push(itemFormState);
          }
        }

        if (newDrafts.length > 0) {
          setDrafts((prev) => {
            const next = [...prev, ...newDrafts];
            const newFirstIndex = prev.length;
            setSelectedDraftIndex(newFirstIndex);
            setTimeout(() => {
              loadDraftIntoForm(newDrafts[0]);
            }, 0);
            return next;
          });
        }
        setPickerOpen(false);
      } else {
        const itemName = libOrLibs.description || "";
        const heading = roomCategoryMode
          ? (initial?.heading || watchedHeading || await getDestinationHeading(itemName, libOrLibs.category))
          : "";
        
        const defaultSpec = libOrLibs.spec || getDetailedDescription(itemName) || "";
        const resolvedDays = libOrLibs.days !== "" && libOrLibs.days != null ? libOrLibs.days : getRoomDefaultDays(libOrLibs.category || "");

        prevHeadingRef.current = heading;
        setPrevItemName(itemName);

        rhfReset({
          heading: heading,
          itemName: itemName,
          description: itemName,
          spec: defaultSpec,
          hsn: libOrLibs.hsn || "",
          rate: libOrLibs.rate || 0,
          length: libOrLibs.length || 0,
          breadth: libOrLibs.breadth || 0,
          height: libOrLibs.height || 0,
          qty: libOrLibs.qty || 0,
        });
        setForm((p) => ({
          ...blankLibraryItem(),
          ...libOrLibs,
          id: p.id,
          masterId: libOrLibs.id,
          heading: heading,
          itemName: itemName,
          description: itemName,
          spec: defaultSpec,
          materials: libOrLibs.materials ? libOrLibs.materials.map((m) => ({ ...m })) : [],
          tags: libOrLibs.tags ? [...libOrLibs.tags] : [],
          days: resolvedDays,
        }));
        setPickerOpen(false);
      }
    } catch (err) {
      setPickerOpen(false);
    }
  };

  const loadDraftIntoForm = (draft) => {
    const heading = draft.heading || draft.area || "";
    const itemName = draft.itemName || draft.description || "";

    prevHeadingRef.current = heading;
    setPrevItemName(itemName);

    rhfReset({
      heading: heading,
      itemName: itemName,
      description: draft.description || "",
      spec: draft.spec || draft.description || "",
      hsn: draft.hsn || "",
      rate: draft.rate || 0,
      length: draft.length || 0,
      breadth: draft.breadth || 0,
      height: draft.height || 0,
      qty: draft.qty || 0,
    });
    setForm({
      ...draft,
    });
  };

  const handleSelectDraft = (index) => {
    setSelectedDraftIndex(index);
    loadDraftIntoForm(drafts[index]);
  };

  const handleNewDraftClick = () => {
    setSelectedDraftIndex(null);
    prevHeadingRef.current = "";
    setPrevItemName("");
    rhfReset({
      heading: "",
      itemName: "",
      description: "",
      spec: "",
      hsn: "",
      rate: 0,
      length: 0,
      breadth: 0,
      height: 0,
      qty: 0,
    });
    setForm({
      ...blankLibraryItem(),
      materials: [],
      tags: [],
    });
  };

  const validateCustom = (data, excludeDraftIndex = null) => {
    if (roomCategoryMode) {
      if (!data.heading?.trim()) {
        setError("heading", { type: "manual", message: "Heading is required" });
        return false;
      }
      if (!data.itemName?.trim()) {
        setError("itemName", { type: "manual", message: "Item Name is required" });
        return false;
      }

      // Check for duplicate itemName under heading
      const currentHeading = data.heading.trim().toUpperCase();
      const currentItemName = data.itemName.trim().toLowerCase();

      // Check against existing scope items
      // When editing, exclude the record currently being edited from duplicate check.
      // Match by id if available, otherwise fall back to matching the original
      // heading + itemName from the initial prop (covers ProposalMaster scope items
      // which are identified by index, not id).
      const initialHeading = (initial?.heading || initial?.area || "").trim().toUpperCase();
      const initialItemName = (initial?.itemName || initial?.description || "").trim().toLowerCase();
      const isEditMode = !!(initial && (initial.id || initialItemName));

      const isDuplicateInScope = (existingScopeItems || []).some((item) => {
        if (initial && initial.id && item.id === initial.id) return false;
        // Fallback: exclude the item that matches the original heading + itemName
        // being edited (only one match is excluded to avoid masking true duplicates)
        if (isEditMode && !initial.id) {
          const itemHeading = (item.area || item.heading || "").trim().toUpperCase();
          const itemName = (item.itemName || "").trim().toLowerCase();
          if (itemHeading === initialHeading && itemName === initialItemName) return false;
        }
        return (
          (item.area || item.heading || "").trim().toUpperCase() === currentHeading &&
          (item.itemName || "").trim().toLowerCase() === currentItemName
        );
      });

      if (isDuplicateInScope) {
        setError("heading", { type: "manual", message: "This item already exists under this heading" });
        return false;
      }

      // Check against other drafts
      const isDuplicateInDrafts = drafts.some((draft, index) => {
        if (excludeDraftIndex !== null && index === excludeDraftIndex) return false;
        return (
          (draft.heading || draft.area || "").trim().toUpperCase() === currentHeading &&
          (draft.itemName || "").trim().toLowerCase() === currentItemName
        );
      });

      if (isDuplicateInDrafts) {
        setError("heading", { type: "manual", message: "This item already exists in your drafts under this heading" });
        return false;
      }
    } else {
      if (!data.description?.trim()) {
        setError("description", { type: "manual", message: "Item Name is required" });
        return false;
      }
      // Req 3: Item Master requires Room / Category selection before saving
      if (showCategory && !form.category?.trim()) {
        setError("description", { type: "manual", message: "Please select a Room / Category before adding the item." });
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = (validatedData) => {
    if (!validateCustom(validatedData, selectedDraftIndex)) return;
    const defaultSpec = getDetailedDescription(roomCategoryMode ? validatedData.itemName : validatedData.description);
    const isDescriptionCustom = roomCategoryMode ? (validatedData.spec !== defaultSpec) : false;
    const draftData = {
      ...form,
      heading: roomCategoryMode ? validatedData.heading.trim().toUpperCase() : "",
      itemName: roomCategoryMode ? validatedData.itemName : validatedData.description,
      description: roomCategoryMode ? validatedData.spec : validatedData.description,
      spec: validatedData.spec || "",
      area: roomCategoryMode ? validatedData.heading.trim().toUpperCase() : "",
      isDescriptionCustom,
      isItemNameCustom: true,
      hsn: validatedData.hsn || "",
      rate: Number(validatedData.rate) || 0,
      gstPercent: Number(form.gstPercent) || 18,
      length: Number(validatedData.length) || 0,
      breadth: Number(validatedData.breadth) || 0,
      height: Number(validatedData.height) || 0,
      qty: Number(validatedData.qty) || 0,
    };

    if (selectedDraftIndex !== null) {
      setDrafts((prev) => {
        const next = [...prev];
        next[selectedDraftIndex] = {
          ...draftData,
          draftId: prev[selectedDraftIndex].draftId,
        };
        return next;
      });
    } else {
      const newDraft = {
        ...draftData,
        draftId: Math.random().toString(36).substring(2, 9),
      };
      setDrafts((prev) => {
        const next = [...prev, newDraft];
        setSelectedDraftIndex(next.length - 1);
        return next;
      });
    }
  };

  const handleDeleteDraft = () => {
    if (selectedDraftIndex !== null) {
      const indexToDelete = selectedDraftIndex;
      setDrafts((prev) => prev.filter((_, i) => i !== indexToDelete));
      handleNewDraftClick();
    } else {
      handleNewDraftClick();
    }
  };

  const handleFinalAddScope = () => {
    if (drafts.length === 0) {
      alert("Please save at least one draft entry before adding to Scope of Work.");
      return;
    }
    onSave(drafts);
  };

  const handleFormSubmit = (validatedData) => {
    if (!validateCustom(validatedData)) return;
    const defaultSpec = getDetailedDescription(roomCategoryMode ? validatedData.itemName : validatedData.description);
    const isDescriptionCustom = roomCategoryMode ? (validatedData.spec !== defaultSpec) : false;
    onSave({
      ...form,
      heading: roomCategoryMode ? validatedData.heading.trim().toUpperCase() : "",
      itemName: roomCategoryMode ? validatedData.itemName : validatedData.description,
      description: roomCategoryMode ? validatedData.spec : validatedData.description,
      spec: validatedData.spec || "",
      area: roomCategoryMode ? validatedData.heading.trim().toUpperCase() : "",
      isDescriptionCustom,
      isItemNameCustom: true,
      hsn: validatedData.hsn || "",
      rate: Number(validatedData.rate) || 0,
      gstPercent: Number(form.gstPercent) || 18,
      length: Number(validatedData.length) || 0,
      breadth: Number(validatedData.breadth) || 0,
      height: Number(validatedData.height) || 0,
      qty: Number(validatedData.qty) || 0,
    });
  };

  const isEditing = !!initial?.id;
  const unitLabel = UNITS.find((u) => u.code === form.unit)?.label || form.unit;
  const watchedLength = watch("length");
  const watchedBreadth = watch("breadth");
  const watchedHeight = watch("height");
  const watchedQty = watch("qty");
  const watchedRate = watch("rate");

  const watchedFields = {
    length: watchedLength,
    breadth: watchedBreadth,
    height: watchedHeight,
    qty: watchedQty,
    rate: watchedRate
  };
  const computeForm = { ...form, ...watchedFields };
  const derivedArea = computeLibraryItemArea(computeForm);
  const derivedQty = computeLibraryItemQty(computeForm);
  const derivedAmount = computeLibraryItemAmount(computeForm);
  const dimsHint =
    form.unit === "sqft" || form.unit === "sqm"
      ? "Area = L × D · Qty overrides for wastage"
      : form.unit === "rmt" || form.unit === "mm"
        ? "Area = L · Qty overrides if different"
        : "Enter Qty directly";

  const resolvedTitle =
    title || (isEditing ? "Edit Item" : "Add Item");
  const resolvedSubmit =
    submitLabel || (isEditing ? "Save Changes" : "Add Item");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-hidden flex flex-col transition-all ${
          multiEntryMode ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
              <Sparkles size={14} />
            </span>
            <h3 className="text-[14px] font-bold text-textcolor">
              {resolvedTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg transition-all cursor-pointer"
              title="Start from an existing library item"
            >
              <Pipette size={12} /> Pick from Library
            </button>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {multiEntryMode && (
            <div className="w-[240px] border-r border-bordergray bg-bg-soft/30 flex flex-col shrink-0">
              <div className="p-3 border-b border-bordergray flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Draft Entries ({drafts.length})
                </span>
                <button
                  type="button"
                  onClick={handleNewDraftClick}
                  className="text-select-blue hover:text-primary text-[10.5px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Create new blank draft"
                >
                  <Plus size={12} /> NEW
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {drafts.length === 0 ? (
                  <div className="text-center py-10 px-4 text-text-subtle text-[11px] italic">
                    No drafts saved.
                    <br />
                    Select "Pick from Library" or fill form and click Save.
                  </div>
                ) : (
                  Object.keys(groupedDrafts).map((catName) => {
                    const groupItems = groupedDrafts[catName];
                    return (
                      <div key={catName} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-1 py-0.5 mt-2 first:mt-0">
                          <span className="w-1 h-3 bg-select-blue rounded-full shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-select-blue">
                            {catName}
                          </span>
                          <span className="text-[9px] font-semibold text-text-muted bg-white border border-bordergray px-1.5 py-0.2 rounded-md">
                            {groupItems.length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {groupItems.map(({ draft: d, index }) => {
                            const isSelected = selectedDraftIndex === index;
                            const amount = computeLibraryItemAmount(d) || Number(d.rate) || 0;
                            return (
                              <button
                                key={d.draftId || index}
                                type="button"
                                onClick={() => handleSelectDraft(index)}
                                className={`w-full text-left rounded-xl p-2.5 transition-all border ${
                                  isSelected
                                    ? "bg-active-bg border-select-blue/40 shadow-sm font-semibold text-select-blue"
                                    : "bg-white border-bordergray hover:bg-bg-soft text-textcolor"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold truncate text-[11.5px]">
                                    {namedDrafts[index]?._displayCategory || d.description || "Untitled Room"}
                                  </span>
                                  {d.days && (
                                    <span className="text-[9.5px] text-text-subtle shrink-0">
                                      {d.days}d
                                    </span>
                                  )}
                                </div>
                                {d.spec && (
                                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                                    {d.spec}
                                  </p>
                                )}
                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                  <span className="text-text-subtle font-medium">Draft #{index + 1}</span>
                                  <span className="font-bold text-textcolor tabular-nums">
                                    ₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {roomCategoryMode ? (
              <>
                <div>
                  <Label>Heading *</Label>
                  <EditableHeadingDropdown
                    value={watchedHeading || ""}
                    category={resolvedHeadingCategory}
                    onChange={(val) => {
                      rhfSetValue("heading", val, { shouldValidate: true });
                    }}
                    existingScopeItems={[
                      ...(existingScopeItems || []),
                      ...drafts,
                    ]}
                    error={errors.heading?.message}
                    placeholder="Select or create a heading…"
                  />
                </div>
                <div>
                  <Label>Item Name *</Label>
                  <FilteredItemNameDropdown
                    value={watchedItemName || ""}
                    headingOrCategory={resolvedHeadingCategory || watchedHeading || ""}
                    onChange={(val) => {
                      rhfSetValue("itemName", val, { shouldValidate: true });
                    }}
                    onItemSelect={handleItemNameSelect}
                    error={errors.itemName?.message}
                    placeholder="Select or type an item name…"
                  />
                </div>
                <div>
                  <Label>Detailed Description</Label>
                  <textarea
                    rows={3}
                    {...register("spec")}
                    placeholder="Enter detailed description…"
                    className={inputBase}
                  />
                </div>
              </>
            ) : (
              <>
                {showCategory && (
                  <div>
                    <Label>Room / Category *</Label>
                    <CategorySelect
                      value={form.category}
                      onChange={(v) => {
                        const d = getRoomDefaultDays(v);
                        update({
                          category: v,
                          days: d,
                        });
                      }}
                      className={`${inputBase} cursor-pointer`}
                    />
                  </div>
                )}
                <div>
                  <Label>Item Name *</Label>
                  <InputField
                    name="description"
                    register={register("description")}
                    placeholder="e.g. False ceiling area"
                    error={errors.description?.message}
                  />
                </div>
                <div>
                  <Label>Detailed Specification</Label>
                  <InputField
                    type="textarea"
                    name="spec"
                    register={register("spec")}
                    rows={3}
                    placeholder="e.g. Supply, transport and Installation of Gypsum ceiling. 12.5 mm thk Gyproc board with Gypliner channel sections at every 450mm with fixing brackets, angles and channels connectors also with premium emulsion paint finish."
                    error={errors.spec?.message}
                  />
                </div>
              </>
            )}

            {(showCategory || roomCategoryMode) && (
              <div>
                <Label>Duration (working days)</Label>
                <input
                  type="number"
                  min={0}
                  value={form.days ?? ""}
                  onChange={(e) => update({ days: e.target.value })}
                  placeholder="e.g. 20"
                  className={inputBase}
                />
                <p className="text-[10px] text-text-subtle mt-1">
                  Seeds the project schedule when this item is added to a scope.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>HSN Code</Label>
                <InputField
                  name="hsn"
                  register={register("hsn")}
                  placeholder="9403"
                  error={errors.hsn?.message}
                />
                <datalist id="hsn-suggestions-shared">
                  {HSN_SUGGESTIONS.map((h) => (
                    <option key={h.code} value={h.code}>{h.desc}</option>
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Unit</Label>
                <select
                  value={form.unit}
                  onChange={(e) => update({ unit: e.target.value })}
                  className={`${inputBase} cursor-pointer`}
                >
                  {UNITS.map((u) => (
                    <option key={u.code} value={u.code}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>GST %</Label>
                <select
                  value={form.gstPercent}
                  onChange={(e) => update({ gstPercent: Number(e.target.value) })}
                  className={`${inputBase} cursor-pointer`}
                >
                  {GST_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}%</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="mb-0 flex items-center gap-1">
                  <Ruler size={11} /> Dimensions, Area, Qty & Rate
                </Label>
                <span className="text-[9.5px] text-text-subtle">{dimsHint}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <NumField label="Length" value={watchedFields.length} onChange={(v) => rhfSetValue("length", v, { shouldValidate: true })} error={errors.length?.message} />
                <NumField label="Depth" value={watchedFields.breadth} onChange={(v) => rhfSetValue("breadth", v, { shouldValidate: true })} error={errors.breadth?.message} />
                <NumField label="Height" value={watchedFields.height} onChange={(v) => rhfSetValue("height", v, { shouldValidate: true })} error={errors.height?.message} />
                <ReadOnlyField label="Area" value={derivedArea} unitLabel={unitLabel} />
                <NumField label="Qty" value={watchedFields.qty} onChange={(v) => rhfSetValue("qty", v, { shouldValidate: true })} tabular bold placeholder={derivedArea > 0 ? String(derivedArea) : "0"} error={errors.qty?.message} />
                <NumField label={`Rate (₹/${unitLabel})`} value={watchedFields.rate} onChange={(v) => rhfSetValue("rate", v, { shouldValidate: true })} tabular prefix="₹" error={errors.rate?.message} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-bg-soft border border-bordergray rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
                <Calculator size={11} /> Computed
              </span>
              <div className="flex items-center gap-4 text-[11.5px]">
                <span className="text-text-muted">
                  Area:{" "}
                  <span className="font-bold text-textcolor tabular-nums">
                    {derivedArea.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>{" "}
                  {unitLabel}
                </span>
                <span className="text-text-muted">
                  Qty:{" "}
                  <span className="font-bold text-textcolor tabular-nums">
                    {derivedQty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>{" "}
                  {unitLabel}
                </span>
                <span className="text-text-muted">
                  Amount:{" "}
                  <span className="font-bold text-textcolor tabular-nums">
                    ₹{derivedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="mb-0">Materials & Specifications</Label>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary cursor-pointer"
                >
                  <Plus size={11} /> Add Material
                </button>
              </div>
              <div className="space-y-1.5">
                {form.materials.length === 0 && (
                  <p className="text-[10.5px] text-text-subtle border border-dashed border-bordergray rounded-lg py-3 text-center">
                    No materials yet — add brand & spec to lock in quality
                  </p>
                )}
                {form.materials.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-[140px_1fr_28px] gap-2 items-center">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMaterial(idx, "name", e.target.value)}
                      placeholder="Plywood"
                      className={`${inputBase} font-medium text-[11.5px] py-1.5`}
                    />
                    <input
                      type="text"
                      value={m.spec}
                      onChange={(e) => updateMaterial(idx, "spec", e.target.value)}
                      placeholder="BWP 19mm Greenply"
                      className={`${inputBase} text-[11.5px] py-1.5`}
                    />
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {showTags && (
              <div>
                <Label>Tags (comma separated)</Label>
                <input
                  type="text"
                  value={(form.tags || []).join(", ")}
                  onChange={(e) =>
                    update({
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="wardrobe, bedroom, premium"
                  className={inputBase}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-bordergray bg-bg-soft flex items-center justify-between gap-2 shrink-0">
          {multiEntryMode ? (
            <>
              <div>
                {selectedDraftIndex !== null ? (
                  <span className="text-[10px] text-select-blue font-bold uppercase tracking-wider bg-active-bg border border-select-blue/20 px-2 py-1 rounded-md">
                    Editing Draft #{selectedDraftIndex + 1}
                  </span>
                ) : (
                  <span className="text-[10px] text-text-subtle font-bold uppercase tracking-wider bg-white border border-bordergray px-2 py-1 rounded-md">
                    New Unsaved Draft
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-[12px] font-semibold text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={rhfHandleSubmit(handleSaveDraft)}
                  className="px-4 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[12px] font-semibold hover:bg-active-bg transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleFinalAddScope}
                  className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={12} /> Add Scope
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={rhfHandleSubmit(handleFormSubmit)}
                className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={12} /> {resolvedSubmit}
              </button>
            </>
          )}
        </div>
      </div>

      {pickerOpen && (
        <LibraryPicker
          excludeId={form.id}
          onClose={() => setPickerOpen(false)}
          onPick={handleLibraryPick}
          multiSelectMode={multiEntryMode}
        />
      )}

      <DestinationPromptModal
        isOpen={destPrompt.isOpen}
        onClose={destPrompt.onCancel}
        itemName={destPrompt.itemName}
        itemCategory={destPrompt.category}
        existingHeadings={destPrompt.existingHeadings}
        headingsWithItem={destPrompt.headingsWithItem}
        onSelect={destPrompt.onSelect}
        onCreateNew={destPrompt.onCreateNew}
      />

      <DuplicateScopeWarningModal
        isOpen={duplicateWarning.isOpen}
        itemName={duplicateWarning.itemName}
        existingHeading={duplicateWarning.existingHeading}
        onAddAnyway={duplicateWarning.onAdd}
        onSkip={duplicateWarning.onSkip}
      />
    </div>
  );
};

const LibraryPicker = ({ excludeId, onClose, onPick, multiSelectMode = false }) => {
  const [items] = useState(() => listLibrary());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const roomNames = useMemo(
    () => getScheduleConfig().rooms.map((r) => r.name),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => it.id !== excludeId)
      .filter((it) => {
        if (category !== "all" && it.category !== category) return false;
        if (!q) return true;
        return (
          (it.description || "").toLowerCase().includes(q) ||
          (it.hsn || "").toLowerCase().includes(q) ||
          (it.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [items, query, category, excludeId]);

  const handleItemClick = (it) => {
    if (multiSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(it.id)) {
          next.delete(it.id);
        } else {
          next.add(it.id);
        }
        return next;
      });
    } else {
      onPick(it);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
              <Pipette size={14} />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-textcolor">
                Pick from Library
              </h3>
              <p className="text-[10.5px] text-text-muted">
                {multiSelectMode
                  ? "Choose one or more items to add to the drafts list"
                  : "Choose an item to copy its fields into the form"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-bordergray space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, HSN, tag"
              className="bg-bg-soft border border-transparent rounded-lg pl-7 pr-3 py-1.5 text-[11.5px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30 w-full"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {["all", ...roomNames].map((value) => {
              const isAll = value === "all";
              const count = isAll
                ? items.filter((it) => it.id !== excludeId).length
                : items.filter(
                    (it) => it.id !== excludeId && it.category === value,
                  ).length;
              const cm = roomColor(value);
              const active = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all border ${
                    active
                      ? isAll
                        ? "bg-active-bg text-select-blue border-select-blue/40"
                        : `${cm.bg} ${cm.text} ${cm.border}`
                      : "bg-transparent text-text-muted hover:bg-bg-soft border-transparent cursor-pointer"
                  }`}
                >
                  {isAll ? (
                    <Package size={10} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                  )}
                  {isAll ? "All" : value}
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[11.5px] text-text-subtle py-8">
              No items match
            </p>
          ) : (
            filtered.map((it) => {
              const c = roomColor(it.category);
              const unitLabel =
                UNITS.find((u) => u.code === it.unit)?.label || it.unit;
              const isSelected = selectedIds.has(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleItemClick(it)}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "border-select-blue bg-active-bg/40"
                      : "border-bordergray bg-white hover:border-select-blue hover:bg-active-bg/30"
                  }`}
                >
                  {multiSelectMode && (
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-select-blue bg-select-blue text-white" : "border-bordergray bg-white"
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  )}
                  <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-textcolor truncate">
                      {it.description}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {unitLabel} · ₹{Number(it.rate || 0).toLocaleString("en-IN")} · GST {it.gstPercent}%
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {multiSelectMode && (
          <div className="px-5 py-3 border-t border-bordergray bg-bg-soft flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const selectedItems = items.filter((it) => selectedIds.has(it.id));
                onPick(selectedItems);
              }}
              disabled={selectedIds.size === 0}
              className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
            >
              Add Selected ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Label = ({ children, className = "" }) => (
  <label className={`block text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 ${className}`}>
    {children}
  </label>
);

const NumField = ({ label, value, onChange, tabular, bold, prefix, placeholder = "0", error }) => {
  const [focused, setFocused] = useState(false);
  const display =
    value === 0 || value === "0" || value === "" || value == null
      ? focused
        ? ""
        : ""
      : value;
  return (
    <div>
      <Label className="mb-1">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle text-[11px]">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={display}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Number(e.target.value))
          }
          placeholder={placeholder}
          className={`${inputBase} ${prefix ? "pl-6" : ""} ${tabular ? "tabular-nums text-right" : ""} ${bold ? "font-bold" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
};

const ReadOnlyField = ({ label, value, unitLabel }) => (
  <div>
    <Label className="mb-1">{label}</Label>
    <div
      className={`${inputBase} bg-bg-soft text-textcolor font-semibold tabular-nums text-right cursor-default select-none flex items-center justify-end gap-1`}
      title={unitLabel ? `${value} ${unitLabel}` : undefined}
    >
      {value > 0
        ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
        : <span className="text-text-subtle font-normal">—</span>}
    </div>
  </div>
);

export default ItemFormModal;
