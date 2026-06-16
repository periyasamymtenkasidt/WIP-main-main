import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiImage,
  FiMapPin,
  FiPhone,
  FiMessageCircle,
  FiSave,
  FiX,
  FiUser,
  FiCheckCircle,
  FiAlertTriangle,
  FiMail,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";

import { Loader2 } from "lucide-react";
import {
  getSite,
  saveSite,
  fetchSurveyMedia,
  SUPERVISORS,
  SITE_STATUSES,
} from "../../data/siteStorage";
import InputField from "../../components/InputField";
import ClientAvatar from "../../assets/images/Client_avatar.png";
import DesignWorkspace from "./components/DesignWorkspace";

const toInputDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
  return dateStr;
};

const fromInputDate = (inputVal) => {
  if (!inputVal || typeof inputVal !== "string") return "";
  const parts = inputVal.split("-");
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}.${mm}.${yyyy}`;
  }
  return inputVal;
};

const SiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [editStatus, setEditStatus] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editSupervisor, setEditSupervisor] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Survey media
  const [surveyData, setSurveyData] = useState(null);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem(`siteChecklist_${id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load site checklist:", e);
    }
    return [
      { name: "Civil & Masonry Work", status: "Completed" },
      { name: "Electrical Piping & Wiring", status: "In Progress" },
      { name: "Plumbing Lines & Fittings", status: "Pending" },
      { name: "Wall Plastering & Waterproofing", status: "Pending" },
      { name: "Flooring & Tile Laying", status: "Pending" },
      { name: "Woodwork & Modular Fittings", status: "Pending" },
    ];
  });

  const toggleChecklistItem = (index) => {
    const statusCycle = ["Pending", "In Progress", "Completed"];
    const updated = checklist.map((item, idx) => {
      if (idx === index) {
        const nextStatusIdx = (statusCycle.indexOf(item.status) + 1) % statusCycle.length;
        return { ...item, status: statusCycle[nextStatusIdx] };
      }
      return item;
    });
    setChecklist(updated);
    localStorage.setItem(`siteChecklist_${id}`, JSON.stringify(updated));
  };

  useEffect(() => {
    const data = getSite(id);
    if (data) {
      setTimeout(() => {
        setSite(data);
        setEditStatus(data.status || "");
        setEditProgress(data.progress || 0);
        setEditSupervisor(data.supervisor || "");
        setEditTargetDate(data.targetDate || "");
        setEditNotes(data.notes || "");
        setEditAddress(data.fullAddress || "");
        setLoading(false);
      }, 0);
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  }, [id]);

  // Load survey media from API
  useEffect(() => {
    if (site) {
      setTimeout(() => {
        setLoadingSurvey(true);
      }, 0);
      fetchSurveyMedia(site.siteID).then((data) => {
        setSurveyData(data);
        setLoadingSurvey(false);
      });
    }
  }, [site]);

  const handleStatusChange = (val) => {
    setEditStatus(val);
    if (val === "Survey") setEditProgress(25);
    else if (val === "Design") setEditProgress(50);
    else if (val === "In Progress") setEditProgress(75);
    else if (val === "Completed") setEditProgress(100);
    else if (!val) setEditProgress(0);
  };



  const handleSaveChanges = async () => {
    if (!site) return;
    setIsSaving(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updatedSite = {
      ...site,
      status: editStatus,
      progress: Number(editProgress),
      supervisor: editSupervisor,
      targetDate: editTargetDate,
      notes: editNotes,
      fullAddress: editAddress,
    };

    saveSite(updatedSite);
    setSite(updatedSite);
    setIsSaving(false);
    setIsEditingDetails(false);
  };

  const handleExpandSurveyPhoto = (images, initialIdx, title) => {
    setLightboxImg({ images, currentIndex: initialIdx, title });
  };

  const handleDesignWorkspaceSave = (updatedSite) => {
    saveSite(updatedSite);
    setSite(updatedSite);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-overallbg">
        <Loader2 className="animate-spin text-select-blue" size={36} />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-overallbg p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <FiX size={32} />
        </div>
        <h2 className="text-xl font-bold text-darkgray mb-2">Site Not Found</h2>
        <p className="text-text-muted text-sm mb-6 max-w-sm">
          The site with ID "{id}" could not be found or has been deleted.
        </p>
        <button
          onClick={() => navigate("/sitevisit")}
          className="flex items-center gap-2 px-5 py-2.5 bg-dark-blue text-white cursor-pointer rounded-xl text-sm font-semibold hover:bg-blue-950 transition-all"
        >
          <FiArrowLeft size={16} /> Back to Sites List
        </button>
      </div>
    );
  }

  const getPhaseProgress = (phaseNum) => {
    const start = (phaseNum - 1) * 25;
    if (editProgress <= start) return 0;
    if (editProgress >= phaseNum * 25) return 100;
    return ((editProgress - start) / 25) * 100;
  };

  const statusColors = {
    survey: "bg-blue-100 text-blue-800 border-blue-200",
    design: "bg-purple-100 text-purple-800 border-purple-200",
    "in progress": "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const activeStatusColor =
    statusColors[site.status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";

  if (site.status?.toLowerCase() === "design") {
    return (
      <div className="bg-overallbg p-6 font-sans h-full flex flex-col overflow-y-auto lg:overflow-hidden scroll-hidden-bar">
        <DesignWorkspace
          site={site}
          onSave={handleDesignWorkspaceSave}
          onExpandPhoto={handleExpandSurveyPhoto}
          navigate={navigate}
        />
        {/* Lightbox / Zoom View */}
        {lightboxImg && (
          <div
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 transition-all select-none"
            onClick={() => setLightboxImg(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-6 right-6 text-white/75 hover:text-white text-xs bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all font-semibold uppercase tracking-wider z-[210]"
            >
              ✕ Close View
            </button>

            {/* Left Arrow */}
            {lightboxImg.images?.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImg((prev) => ({
                    ...prev,
                    currentIndex:
                      prev.currentIndex === 0
                        ? prev.images.length - 1
                        : prev.currentIndex - 1,
                  }));
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-[210]"
              >
                <FiChevronLeft size={24} />
              </button>
            )}

            {/* Active Image */}
            <img
              src={lightboxImg.images[lightboxImg.currentIndex]}
              alt={`${lightboxImg.title} view`}
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Right Arrow */}
            {lightboxImg.images?.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxImg((prev) => ({
                    ...prev,
                    currentIndex:
                      prev.currentIndex === prev.images.length - 1
                        ? 0
                        : prev.currentIndex + 1,
                  }));
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-[210]"
              >
                <FiChevronRight size={24} />
              </button>
            )}

            {/* Title & Caption */}
            <h3 className="text-white font-bold text-base mt-6 tracking-wide">
              {lightboxImg.title} (View {lightboxImg.currentIndex + 1} of{" "}
              {lightboxImg.images.length})
            </h3>
            <p className="text-white/60 text-[10px] uppercase tracking-wider mt-1.5">
              Workspace Design Attachment
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-overallbg p-6 font-sans h-full flex flex-col overflow-y-auto lg:overflow-hidden scroll-hidden-bar">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/sitevisit")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-gray-50 hover:border-select-blue/30 text-gray-500 hover:text-select-blue transition-all shadow-sm cursor-pointer animate-all"
            title="Go back to Sites"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-bold text-darkgray leading-tight">
                Site Workspace
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${activeStatusColor}`}>
                {site.status || "Unassigned"}
              </span>
            </div>
            <p className="text-[13px] text-gray-500 mt-1">
              <span
                className="cursor-pointer hover:text-select-blue"
                onClick={() => navigate("/sitevisit")}
              >
                Sites List
              </span>{" "}
              — {site.siteID} ({site.clientName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/sitevisit")}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:bg-bg-soft hover:text-darkgray transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-select-blue text-white cursor-pointer rounded-xl text-sm font-semibold hover:shadow-select-blue/30 hover:scale-[1.02] shadow-sm transition-all min-w-[140px] justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start lg:min-h-0 lg:h-full">
        
        {/* Left Column - Site Info Panels */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-w-0 lg:h-full lg:overflow-y-auto scroll-hidden-bar pr-1 pb-6">
          
          {/* Client & Scope Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="relative shrink-0">
                <img
                  src={ClientAvatar}
                  alt="Client Profile Avatar"
                  className="w-14 h-14 rounded-full border border-gray-100 shadow-sm object-cover"
                />
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-darkgray truncate">{site.clientName}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client Profile</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Site ID</span>
                <span className="font-bold text-darkgray text-[12px]">{site.siteID}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Scope</span>
                <span className="font-bold text-darkgray text-[12px] text-right">
                  {(() => {
                    const preset = site.propertyPreset;
                    const siteType = site.siteType || "";
                    const formattedPreset = preset ? preset.replace(/^(\d+)(BHK)$/i, "$1 BHK") : "";
                    return formattedPreset ? `${formattedPreset} / ${siteType}` : siteType;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Start Date</span>
                {site.startDate === "Awaiting Advance Payment" ? (
                  <span className="font-bold text-amber-600 text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                    <FiAlertTriangle size={11} />
                    Awaiting Advance
                  </span>
                ) : (
                  <span className="font-bold text-darkgray text-[12px]">{site.startDate}</span>
                )}
              </div>
              <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Budget / Value</span>
                <span className="font-bold text-select-blue text-[12px]">{site.budget || "—"}</span>
              </div>
              {site.clientPhone && (
                <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Contact Phone</span>
                  <a href={`tel:${site.clientPhone}`} className="font-bold text-darkgray hover:text-select-blue text-[12px] flex items-center gap-1 transition-colors">
                    <FiPhone size={11} className="text-gray-400" />
                    +91 {site.clientPhone}
                  </a>
                </div>
              )}
              {site.clientEmail && (
                <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px] min-w-0">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Contact Email</span>
                  <span className="font-bold text-darkgray text-[11px] truncate max-w-[55%]" title={site.clientEmail}>
                    {site.clientEmail}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center p-2.5 border border-bg-soft bg-palewhite rounded-[12px]">
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Advance Payment</span>
                {site.isAdvancePaid ? (
                  <span className="font-bold text-emerald-700 text-[9px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Paid ({site.advancePaidDate})
                  </span>
                ) : (
                  <span className="font-bold text-red-600 text-[10px] bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracker Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Work Progress</h4>
            
            {/* Header progress info */}
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overall Status</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-darkgray tracking-tight">{editProgress}%</span>
                  <span className="text-[10px] font-bold text-select-blue uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {editStatus || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Modern Meter */}
            <div className="w-full bg-palewhite border border-bg-soft rounded-xl p-3 mb-5">
              <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                <span>Start</span>
                <span>Active Track</span>
                <span>Handover</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-[2px] border border-gray-200/40">
                <div
                  className="h-full bg-gradient-to-r from-select-blue/70 to-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(30,58,138,0.3)]"
                  style={{ width: `${editProgress}%` }}
                />
              </div>
            </div>

            {/* Phase breakdown metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 1, name: "Survey", short: "PHASE 01" },
                { id: 2, name: "Design", short: "PHASE 02" },
                { id: 3, name: "Execution", short: "PHASE 03" },
                { id: 4, name: "Handover", short: "PHASE 04" },
              ].map((phase) => {
                const phaseProgress = getPhaseProgress(phase.id);
                const isCompleted = phaseProgress === 100;
                const isActive = phaseProgress > 0 && phaseProgress < 100;
                
                let bgClass = "bg-palewhite border-gray-100 text-gray-400";
                let barColor = "bg-gray-300";
                let labelColor = "text-gray-400";
                let badge = (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                    Pending
                  </span>
                );

                if (isCompleted) {
                  bgClass = "bg-emerald-50/40 border-emerald-100 text-emerald-800";
                  barColor = "bg-emerald-500";
                  labelColor = "text-emerald-950 font-bold";
                  badge = (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                      Done
                    </span>
                  );
                } else if (isActive || (editProgress === 0 && phase.id === 1)) {
                  bgClass = "bg-blue-50/50 border-blue-200 text-select-blue shadow-xs";
                  barColor = "bg-select-blue";
                  labelColor = "text-blue-950 font-bold";
                  badge = (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-select-blue bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-sm">
                      Active
                    </span>
                  );
                }

                return (
                  <div key={phase.id} className={`p-3 border rounded-xl flex flex-col gap-1.5 transition-all duration-300 ${bgClass}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold opacity-60 tracking-wider">{phase.short}</span>
                      {badge}
                    </div>
                    <div>
                      <h5 className={`text-xs font-bold tracking-tight ${labelColor}`}>{phase.name}</h5>
                      <span className="text-[9.5px] opacity-60 font-semibold">{phaseProgress.toFixed(0)}% Done</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200/60 rounded-full overflow-hidden mt-1">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${phaseProgress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supervisor Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Site Supervisor</h4>
            <div className="flex items-center gap-4 p-4 border border-bg-soft bg-palewhite rounded-[16px]">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-select-blue flex items-center justify-center">
                <FiUser size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-darkgray truncate">
                  {editSupervisor || "Not Assigned"}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                  Lead Site Operations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button className="py-2.5 bg-dark-blue text-white rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-950 transition-all cursor-pointer shadow-sm">
                <FiPhone size={13} /> Call Ops
              </button>
              <button className="py-2.5 bg-palewhite hover:bg-bg-soft text-darkgray rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-gray-100 cursor-pointer">
                <FaWhatsapp size={13} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Checklist Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Site Checklist</h4>
              <span className="text-[10px] font-bold text-select-blue bg-blue-50 px-2 py-0.5 rounded-full">
                {checklist.filter((item) => item.status === "Completed").length}/{checklist.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item, idx) => {
                const colors = {
                  Pending: "bg-gray-50 text-gray-400 border-gray-200",
                  "In Progress": "bg-amber-50 text-amber-600 border-amber-200",
                  Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
                };
                const badgeStyle = colors[item.status] || "bg-gray-50 text-gray-400 border-gray-200";

                return (
                  <div
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    className="flex justify-between items-center p-2.5 border border-bg-soft hover:bg-palewhite rounded-[12px] cursor-pointer transition-all active:scale-98 select-none"
                  >
                    <span className="text-[11px] font-bold text-darkgray truncate max-w-[65%]">
                      {item.name}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                      {item.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-gray-400 text-center mt-3 uppercase tracking-wider font-semibold">
              💡 Tap any item to cycle status
            </p>
          </div>

        </div>

        {/* Right Columns - Details form & Mobile Survey (Grid span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0 lg:h-full lg:overflow-y-auto scroll-hidden-bar pr-1 pb-6">

          {/* Section 1: Detailed General Information (Inline Editable Dashboard Form) */}
          <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-darkgray flex items-center gap-2">
                <span className="w-2.5 h-4 bg-select-blue rounded-xs inline-block"></span>
                Site details & Logs
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isEditingDetails
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-palewhite border-border hover:bg-bg-soft text-darkgray"
                }`}
              >
                {isEditingDetails ? (
                  <>
                    <FiCheck size={13} strokeWidth={2.5} />
                    Done Editing
                  </>
                ) : (
                  <>
                    <FiEdit3 size={13} />
                    Edit Details
                  </>
                )}
              </button>
            </div>

            {!isEditingDetails ? (
              <div className="space-y-6">
                {/* Status and Supervisor Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-bg-soft bg-palewhite rounded-[16px] flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Site Phase / Status</span>
                    <span className="font-bold text-darkgray text-[13px] bg-white border border-gray-100 px-3 py-1.5 rounded-lg inline-block self-start">
                      {editStatus || "Unassigned"}
                    </span>
                  </div>
                  <div className="p-4 border border-bg-soft bg-palewhite rounded-[16px] flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assigned Supervisor</span>
                    <span className="font-bold text-darkgray text-[13px] bg-white border border-gray-100 px-3 py-1.5 rounded-lg inline-block self-start">
                      {editSupervisor || "Not Assigned"}
                    </span>
                  </div>
                </div>

                {/* Target Date & Address Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-bg-soft bg-palewhite rounded-[16px] flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Completion Date</span>
                    <span className="font-bold text-darkgray text-[13px] bg-white border border-gray-100 px-3 py-1.5 rounded-lg inline-block self-start">
                      {editTargetDate || "Not Set"}
                    </span>
                  </div>

                  <div className="p-4 border border-bg-soft bg-palewhite rounded-[16px] flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Full Site Address</span>
                    <p className="font-semibold text-darkgray text-[13px] leading-relaxed bg-white border border-gray-100 p-3 rounded-lg whitespace-pre-wrap min-h-[50px]">
                      {editAddress || "—"}
                    </p>
                  </div>
                </div>

                {/* Notes Timeline / Logs */}
                <div className="p-5 border border-bg-soft bg-palewhite rounded-[16px] flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Site Operations Log</span>
                  <div className="bg-white border border-gray-100 rounded-xl p-4 text-[13px] text-darkgray leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {editNotes || "No logs entered yet."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Status and Supervisor Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    type="select"
                    label="Site Phase / Status"
                    value={editStatus || ""}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    options={SITE_STATUSES}
                    placeholder="Select site status"
                  />

                  <InputField
                    type="select"
                    label="Assigned Supervisor"
                    value={editSupervisor || ""}
                    onChange={(e) => setEditSupervisor(e.target.value)}
                    options={SUPERVISORS}
                    placeholder="Select supervisor"
                  />
                </div>

                {/* Target Date & Address Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-darkgray mb-2">
                      Target Completion Date
                    </label>
                    <InputField
                      type="date"
                      value={toInputDate(editTargetDate)}
                      onChange={(e) => setEditTargetDate(fromInputDate(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-darkgray mb-2">
                      Full Site Address
                    </label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full text-[13px] bg-palewhite border border-bordergray rounded-xl px-4 py-2.5 focus:border-select-blue focus:bg-white outline-none resize-none transition-all"
                      placeholder="Enter street, block, plot details..."
                    />
                  </div>
                </div>

                {/* Notes Timeline / Logs */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-darkgray mb-2">
                    Site Operations Log
                  </label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-[13px] bg-palewhite border border-bordergray rounded-xl p-4 focus:border-select-blue focus:bg-white outline-none transition-all leading-relaxed"
                    placeholder="Describe status updates, blockages, client feedback, or supervisor reviews..."
                  />
                </div>

              </div>
            )}
          </div>

          {/* Section 2: Mobile App Survey Media (Interactive Room Checklist & Zoom View) */}
          <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-darkgray flex items-center gap-2">
                <span className="w-2.5 h-4 bg-emerald-500 rounded-xs inline-block"></span>
                Mobile Survey Photos
              </h3>
              
              {surveyData && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Synced: {surveyData.device}
                </div>
              )}
            </div>

            {loadingSurvey ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-select-blue" size={32} />
                <p className="text-xs text-text-muted font-medium">Syncing survey rooms & media...</p>
              </div>
            ) : surveyData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {surveyData.rooms.map((room, idx) => {
                  return (
                    <RoomCard key={idx} room={room} onExpand={handleExpandSurveyPhoto} />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-text-muted">
                <FiImage size={24} className="mb-2 text-gray-300" />
                No survey data synced yet.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Lightbox / Zoom View */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 transition-all select-none"
          onClick={() => setLightboxImg(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 text-white/75 hover:text-white text-xs bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all font-semibold uppercase tracking-wider z-[210]"
          >
            ✕ Close View
          </button>

          {/* Left Arrow */}
          {lightboxImg.images?.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg((prev) => ({
                  ...prev,
                  currentIndex:
                    prev.currentIndex === 0
                      ? prev.images.length - 1
                      : prev.currentIndex - 1,
                }));
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-[210]"
            >
              <FiChevronLeft size={24} />
            </button>
          )}

          {/* Active Image */}
          <img
            src={lightboxImg.images[lightboxImg.currentIndex]}
            alt={`${lightboxImg.title} view`}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Right Arrow */}
          {lightboxImg.images?.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg((prev) => ({
                  ...prev,
                  currentIndex:
                    prev.currentIndex === prev.images.length - 1
                      ? 0
                      : prev.currentIndex + 1,
                }));
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-[210]"
            >
              <FiChevronRight size={24} />
            </button>
          )}

          {/* Title & Caption */}
          <h3 className="text-white font-bold text-base mt-6 tracking-wide">
            {lightboxImg.title} (View {lightboxImg.currentIndex + 1} of{" "}
            {lightboxImg.images.length})
          </h3>
          <p className="text-white/60 text-[10px] uppercase tracking-wider mt-1.5">
            Mobile App Survey Upload
          </p>
        </div>
      )}
    </div>
  );
};

/* Interactive Room Media Card */
const RoomCard = ({ room, onExpand }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = room.images || [];

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="border border-bordergray rounded-xl overflow-hidden bg-white shadow-xs group hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Slider / Image block */}
      <div className="relative h-48 bg-gray-100 overflow-hidden select-none">
        <img
          src={images[activeIdx]}
          alt={`${room.name} view ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-500 cursor-pointer"
          onClick={() => onExpand(images, activeIdx, room.name)}
        />

        {/* Zoom View Overlay on Hover */}
        <div 
          onClick={() => onExpand(images, activeIdx, room.name)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none group-hover:pointer-events-auto"
        >
          <span className="text-white text-[10px] font-semibold bg-black/70 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Expand Photo
          </span>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
            >
              <FiChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dimension Badge */}
        <span className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
          {room.dimensions}
        </span>

        {/* Thumbnail Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full">
            {images.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(dotIdx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  activeIdx === dotIdx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Text details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="text-[13px] font-bold text-darkgray">{room.name}</h4>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <FiCheckCircle size={10} /> Synced
            </span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            {room.notes}
          </p>
        </div>
        
        <div className="text-[9px] text-gray-400 border-t border-gray-100 pt-3.5 mt-4 flex justify-between">
          <span>Date: {room.checkedAt}</span>
          <span className="font-medium">Image {activeIdx + 1} of {images.length}</span>
        </div>
      </div>
    </div>
  );
};

export default SiteDetail;
