import { useEffect, useMemo, useState } from "react";
import { GrLocation } from "react-icons/gr";
import { Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

const newInquirySchema = yup.object().shape({
  fullName: yup.string().required("Full Name is required"),
  phoneNumber: yup
    .string()
    .required("Phone Number is required")
    .transform((v) => v?.replace(/\s/g, ""))
    .matches(/^\d{10}$/, "Must be a 10-digit number"),
  email: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  inquirySource: yup.string().required("Inquiry Source is required"),
  referralPersonName: yup.string().when("inquirySource", {
    is: "Referral",
    then: (s) => s.required("Referral Person Name is required"),
    otherwise: (s) => s.notRequired(),
  }),
  referralPersonEmail: yup.string().when("inquirySource", {
    is: "Referral",
    then: (s) =>
      s
        .required("Referral Person Email is required")
        .trim()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
    otherwise: (s) => s.notRequired(),
  }),
  quotePreset: yup.string().required("Property Preset is required"),
  propertyType: yup.string().required("Property Type is required"),
  investmentRange: yup.string().required("Investment Range is required"),
  processionDate: yup.string().required("Possession Date is required"),
  location: yup.string().required("City / Location is required"),
});
import {
  getPreset,
  getPresetKeys,
  computeTotals,
  generateInvestmentBands,
  getPropertyTypesForPreset,
  getConfigForType,
  getPresetTotalDays,
} from "../../data/QuotePresets";
import { addWorkingDaysISO } from "../../data/scheduleStorage";

const DEFAULT_PRESET = "";

// Pull preset-defined defaults so a single dropdown change drives
// propertyType + sizeRange — these mirror the fields managed in
// Settings → Proposal Master.
const buildPresetState = (key) => {
  const cfg = getConfigForType(key);
  return {
    quotePreset: key,
    quoteSizeRange: cfg?.sizeRange || "",
    propertyType: cfg?.propertyType || "",
  };
};

const INITIAL_FORM_STATE = {
  fullName: "",
  phoneNumber: "",
  email: "",
  inquirySource: "",
  referralPersonName: "",
  referralPersonEmail: "",
  investmentRange: "",
  processionDate: "",
  location: "",
  inquiryStatus: "Inquiry",
  architecturalNotes: "",
  // populated by buildPresetState below
  quotePreset: "",
  quoteSizeRange: "",
  propertyType: "",
};

const inquirySources = [
  "Referral",
  "Walk-in",
  "Social Media",
  "Website",
  "Cold Call",
  "Other",
];

const CLIENT_INFO_FIELDS = [
  {
    name: "fullName",
    label: "Full Name",
    type: "text",
    placeholder: "Enter full name",
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    placeholder: "10-digit number",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "example@domain.com",
  },
  {
    name: "inquirySource",
    label: "Inquiry Source",
    type: "select",
    options: inquirySources,
  },
];

const PROJECT_DETAIL_FIELDS = [
  {
    name: "location",
    label: "City / Location",
    type: "text",
    placeholder: "e.g. Chennai, Tamil Nadu",
    icon: GrLocation,
  },
];

const SectionHeader = ({ children, hint }) => (
  <div className="mb-4">
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue">
      <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
      {children}
    </h2>
    {hint && <p className="text-[11px] text-text-subtle mt-1 ml-3.5">{hint}</p>}
  </div>
);

const formatLakhs = (rupees) => `₹${(rupees / 100000).toFixed(1)}L`;

function NewInquiriesform({ onClose, onAddLead }) {
  const presetKeys = useMemo(() => getPresetKeys(), []);
  const defaultPresetKey = presetKeys.includes(DEFAULT_PRESET)
    ? DEFAULT_PRESET
    : presetKeys[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(newInquirySchema),
    defaultValues: {
      ...INITIAL_FORM_STATE,
      ...buildPresetState(defaultPresetKey),
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Once the user edits the possession date manually we stop auto-filling it.
  const [possessionTouched, setPossessionTouched] = useState(false);

  const quotePreset = watch("quotePreset");
  const propertyType = watch("propertyType");
  const investmentRange = watch("investmentRange");
  const inquirySource = watch("inquirySource");
  const possessionValue = watch("processionDate");

  // Total scope duration (sum of all rooms' working days) for the chosen preset.
  const totalScopeDays = useMemo(
    () => getPresetTotalDays(quotePreset, propertyType),
    [quotePreset, propertyType],
  );
  // Earliest date we can realistically deliver (today + total scope days).
  const estimateISO = useMemo(
    () => (totalScopeDays > 0 ? addWorkingDaysISO(new Date(), totalScopeDays) : ""),
    [totalScopeDays],
  );
  // The client's possession date is tighter than we can deliver.
  const timelineTight =
    !!possessionValue && !!estimateISO && possessionValue < estimateISO;

  const activePreset = useMemo(() => getPreset(quotePreset), [quotePreset]);

  const presetTotals = useMemo(() => {
    const cfg = getConfigForType(quotePreset, propertyType);
    return cfg ? computeTotals(cfg.scopeItems || []) : null;
  }, [quotePreset, propertyType]);

  // Baseline = sum of the preset's scope (incl. GST). No property-type scaling.
  const baseline = presetTotals?.grandTotal || 0;

  // Investment-range bands derived from the baseline. If the current form value
  // is something the user typed before (e.g. while editing) and not in the
  // generated bands, prepend it so the select can render it without losing it.
  const investmentBands = useMemo(() => {
    const bands = generateInvestmentBands(baseline);
    if (investmentRange && !bands.includes(investmentRange)) {
      return [investmentRange, ...bands];
    }
    return bands;
  }, [baseline, investmentRange]);

  useEffect(() => {
    if (quotePreset && propertyType) {
      const cfg = getConfigForType(quotePreset, propertyType);
      if (cfg) {
        setValue("quoteSizeRange", cfg.sizeRange || "");
      }
    }
  }, [quotePreset, propertyType, setValue]);

  // Auto-fill the possession date = today + total scope days (working days),
  // unless the user has already set it by hand. Recomputes when the preset
  // changes so a different property type re-estimates the completion date.
  useEffect(() => {
    if (possessionTouched) return;
    if (estimateISO) setValue("processionDate", estimateISO);
  }, [estimateISO, possessionTouched, setValue]);

  const handlePresetChange = (e) => {
    const key = e.target.value;
    const presetState = buildPresetState(key);
    setValue("quotePreset", presetState.quotePreset, { shouldValidate: true });
    setValue("quoteSizeRange", presetState.quoteSizeRange);
    setValue("propertyType", presetState.propertyType, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Older consumers (Leads.jsx, table column "scope") still read
      // `projectScope` — derive it from the property type so the column
      // shows something meaningful without re-asking the user.
      await onAddLead?.({
        ...data,
        projectScope: data.propertyType,
        timelineTight,
      });
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (cfg) => (
    <InputField
      key={cfg.name}
      name={cfg.name}
      label={cfg.label}
      type={cfg.type}
      register={register(cfg.name)}
      error={errors[cfg.name]?.message}
      placeholder={cfg.placeholder}
      options={cfg.options}
      icon={cfg.icon}
    />
  );

  const footer = (
    <div className="flex justify-end items-center gap-4">
      <button
        type="button"
        onClick={() => {
          setPossessionTouched(false);
          reset({
            ...INITIAL_FORM_STATE,
            ...buildPresetState(defaultPresetKey),
          });
        }}
        disabled={isSubmitting}
        className="text-sm font-medium cursor-pointer hover:text-red-500 text-text-muted hover:text-text transition-colors disabled:opacity-50"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-5 py-2.5 cursor-pointer rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="new-inquiry-form"
        disabled={isSubmitting}
        className="min-w-[140px] cursor-pointer flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating…
          </>
        ) : (
          "Create Inquiry"
        )}
      </button>
    </div>
  );

  return (
    <Modal
      title="Add New Inquiry"
      subtitle="Fill in the client and property details to create a new inquiry"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form id="new-inquiry-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Client Information ─────────────────────────────────────── */}
        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {CLIENT_INFO_FIELDS.slice(0, 2).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {CLIENT_INFO_FIELDS.slice(2, 4).map(field)}
          </div>

          {/* Referral-specific fields — shown only when inquirySource is 'Referral' */}
          <div className={inquirySource === "Referral" ? "grid grid-cols-2 gap-4 mt-4" : "hidden"}>
            <InputField
              name="referralPersonName"
              label="Referral Person Name"
              type="text"
              register={register("referralPersonName")}
              error={errors.referralPersonName?.message}
              placeholder="Name of the referring person"
            />
            <InputField
              name="referralPersonEmail"
              label="Referral Person Email"
              type="email"
              register={register("referralPersonEmail")}
              error={errors.referralPersonEmail?.message}
              placeholder="referrer@domain.com"
            />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Property Configuration (proposal-master driven) ────────── */}
        <div className="mb-6">
          <SectionHeader hint="The preset defines which property types it can be used for — pick one here.">
            Property Configuration
          </SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="quotePreset"
              label="Property Preset"
              type="select"
              register={register("quotePreset")}
              onChange={handlePresetChange}
              options={presetKeys}
              error={errors.quotePreset?.message}
            />
            <InputField
              name="propertyType"
              label="Property Type"
              type="select"
              register={register("propertyType")}
              options={getPropertyTypesForPreset(quotePreset)}
              error={errors.propertyType?.message}
            />
          </div>

          {activePreset && (
            <div className="mt-3 rounded-lg border border-bordergray bg-bg-soft px-3 py-2.5 ml-3.5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                    Size Range
                  </span>
                  <strong className="text-text">
                    {`${getConfigForType(quotePreset, propertyType)?.sizeRange ||
                      "—"} sq ft`}
                  </strong>
                </span>
                {presetTotals && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                      Baseline
                    </span>
                    <strong className="text-text">
                      {formatLakhs(baseline)}
                    </strong>
                    <span className="text-text-subtle">incl. GST</span>
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-text-subtle mt-1.5">
                Edit these values in <strong>Master → Master Details</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Project Details (schedule + commercials + location) ────── */}
        <div className="mb-6">
          <SectionHeader>Project Details</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="investmentRange"
              label="Investment Range"
              type="select"
              register={register("investmentRange")}
              options={investmentBands}
              placeholder={
                investmentBands.length
                  ? "Choose a range"
                  : "Pick a preset first"
              }
              error={errors.investmentRange?.message}
            />
            <div>
              <InputField
                name="processionDate"
                label="Possession Date"
                type="date"
                register={{
                  ...register("processionDate"),
                  onChange: (e) => {
                    setPossessionTouched(true);
                    return register("processionDate").onChange(e);
                  },
                }}
                error={errors.processionDate?.message}
              />
              {!possessionTouched && totalScopeDays > 0 && (
                <p className="text-[10.5px] text-text-subtle mt-1">
                  Auto-estimated · {totalScopeDays} working days from today. Edit
                  if the client gave a date.
                </p>
              )}
              {timelineTight && (
                <p className="text-[10.5px] text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} className="shrink-0" />
                  Tighter than our estimate (
                  {new Date(estimateISO).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  ). This client will be flagged as at-risk.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {PROJECT_DETAIL_FIELDS.map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Notes ──────────────────────────────────────────────────── */}
        <div className="mb-2">
          <SectionHeader>Notes</SectionHeader>
          <InputField
            type="textarea"
            name="architecturalNotes"
            label="Architectural Notes"
            register={register("architecturalNotes")}
            error={errors.architecturalNotes?.message}
            placeholder="Mention design preferences, mood, or constraints…"
            rows={4}
          />
          <p className="text-[11px] text-text-subtle mt-3">
            New inquiries start as <strong>Inquiry</strong>. Move them through
            the pipeline from the lead detail page.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default NewInquiriesform;
