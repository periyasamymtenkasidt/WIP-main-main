import React, { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import { getGlobalTerms } from "../data/termsStorage";
import MasterNavLink from "./MasterNavLink";

const SQCheckbox = ({ checked, onChange, accent = "green" }) => {
  const isGreen = accent === "green";
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`shrink-0 h-4 w-4 rounded flex items-center justify-center border transition-all duration-200 cursor-pointer ${
          checked
            ? isGreen
              ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700/90 text-white shadow-sm"
              : "bg-red-500/80 hover:bg-red-500 border-red-500/50 text-white shadow-sm"
            : "bg-white border-slate-300 text-transparent hover:border-slate-400"
        }`}
        onClick={onChange}
      >
        <Check size={11} strokeWidth={3} className="shrink-0" />
      </div>
    </div>
  );
};

const CategoryTermsModal = ({
  category,
  categoryLabel,
  initialInclusions = [],
  initialExclusions = [],
  onApply,
  onClose,
}) => {
  // Load global master terms for this category
  const masterTerms = getGlobalTerms(category);
  
  // Separate default and non-default terms
  const defaultInclusions = (masterTerms.inclusions || []).filter((t) => t.isDefault).map((t) => t.text);
  const defaultExclusions = (masterTerms.exclusions || []).filter((t) => t.isDefault).map((t) => t.text);
  
  const masterInclusions = (masterTerms.inclusions || []).filter((t) => !t.isDefault).map((t) => t.text);
  const masterExclusions = (masterTerms.exclusions || []).filter((t) => !t.isDefault).map((t) => t.text);

  const [selectedInclusions, setSelectedInclusions] = useState([]);
  const [selectedExclusions, setSelectedExclusions] = useState([]);

  // Initialize selections with currently active terms
  useEffect(() => {
    setSelectedInclusions(initialInclusions || []);
    setSelectedExclusions(initialExclusions || []);
  }, [initialInclusions, initialExclusions]);

  const toggleInclusion = (text) => {
    setSelectedInclusions((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  const toggleExclusion = (text) => {
    setSelectedExclusions((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  const toggleAllInclusions = () => {
    const allSelected = masterInclusions.every((t) =>
      selectedInclusions.includes(t)
    );
    if (allSelected) {
      setSelectedInclusions((prev) =>
        prev.filter((t) => !masterInclusions.includes(t))
      );
    } else {
      setSelectedInclusions((prev) => [
        ...new Set([...prev, ...masterInclusions]),
      ]);
    }
  };

  const toggleAllExclusions = () => {
    const allSelected = masterExclusions.every((t) =>
      selectedExclusions.includes(t)
    );
    if (allSelected) {
      setSelectedExclusions((prev) =>
        prev.filter((t) => !masterExclusions.includes(t))
      );
    } else {
      setSelectedExclusions((prev) => [
        ...new Set([...prev, ...masterExclusions]),
      ]);
    }
  };

  const hasMasterItems = masterInclusions.length > 0 || masterExclusions.length > 0;

  const footer = (
    <div className="flex justify-end gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          // Merge defaults with the user's selected non-defaults
          const finalInclusions = [
            ...defaultInclusions,
            ...selectedInclusions.filter((t) => masterInclusions.includes(t)),
          ];
          const finalExclusions = [
            ...defaultExclusions,
            ...selectedExclusions.filter((t) => masterExclusions.includes(t)),
          ];
          onApply(finalInclusions, finalExclusions);
        }}
        className="px-5 py-2 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary transition-all shadow-sm"
      >
        Apply Selection
      </button>
    </div>
  );

  return (
    <Modal
      title={`${categoryLabel} Terms & Conditions`}
      subtitle={`Configure additional ${categoryLabel.toLowerCase()} inclusions and exclusions (standard defaults are applied automatically).`}
      onClose={onClose}
      maxWidth="max-w-[720px]"
      maxHeight="max-h-[90vh]"
      footer={footer}
    >
      {!hasMasterItems ? (
        <div className="bg-bg-soft border border-dashed border-bordergray rounded-xl p-8 text-center my-4 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-text-subtle" />
          <div>
            <p className="text-[13px] font-semibold text-textcolor">
              No Terms & Conditions available
            </p>
            <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
              No Terms & Conditions available. Please navigate to the <MasterNavLink text="Master Module" /> to configure Included and Not Included Terms.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          {/* Included Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-bordergray/50">
              <h3 className="text-[11.5px] font-bold text-emerald-700 tracking-wider uppercase">
                Included
              </h3>
              {masterInclusions.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllInclusions}
                  className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {masterInclusions.every((t) => selectedInclusions.includes(t))
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-2 scroll-hidden-bar">
              {masterInclusions.map((text, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-bg-soft transition-all"
                >
                  <SQCheckbox
                    accent="green"
                    checked={selectedInclusions.includes(text)}
                    onChange={() => toggleInclusion(text)}
                  />
                  <span className="text-[12px] text-text-muted group-hover:text-textcolor transition-colors leading-snug pt-px">
                    {text}
                  </span>
                </label>
              ))}
              {masterInclusions.length === 0 && (
                <div className="text-[11px] text-text-muted py-4 px-2 text-center bg-bg-soft/50 rounded-lg border border-dashed border-bordergray my-2 leading-relaxed">
                  No Included Terms & Conditions available. Please navigate to the <MasterNavLink text="Master Module" /> to add Included Terms.
                </div>
              )}
            </div>
          </div>

          {/* Not Included Column */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-bordergray/50">
              <h3 className="text-[11.5px] font-bold text-red-500 tracking-wider uppercase">
                Not Included
              </h3>
              {masterExclusions.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllExclusions}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  {masterExclusions.every((t) => selectedExclusions.includes(t))
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-2 scroll-hidden-bar">
              {masterExclusions.map((text, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-bg-soft transition-all"
                >
                  <SQCheckbox
                    accent="red"
                    checked={selectedExclusions.includes(text)}
                    onChange={() => toggleExclusion(text)}
                  />
                  <span className="text-[12px] text-text-muted group-hover:text-textcolor transition-colors leading-snug pt-px">
                    {text}
                  </span>
                </label>
              ))}
              {masterExclusions.length === 0 && (
                <div className="text-[11px] text-text-muted py-4 px-2 text-center bg-bg-soft/50 rounded-lg border border-dashed border-bordergray my-2 leading-relaxed">
                  No Not Included Terms & Conditions available. Please navigate to the <MasterNavLink text="Master Module" /> to add Not Included Terms.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CategoryTermsModal;
