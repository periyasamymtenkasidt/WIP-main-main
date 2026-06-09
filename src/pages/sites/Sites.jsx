import { useState, useEffect, useMemo } from "react";
<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import Table from "../../components/Table";
import AddSiteModal from "./components/AddSiteModal";
import {
  getAllSites,
  createCustomSite,
  SUPERVISORS,
=======
import { FiPlusCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import Table from "../../components/Table";
import TabBar from "../../components/TabBar";
import Modal from "../../components/Modal";
import GeneralInfoTab from "./components/GeneralInfoTab";
import SurveyMediaTab from "./components/SurveyMediaTab";
import AddSiteModal from "./components/AddSiteModal";
import {
  getAllSites,
  saveSite,
  createCustomSite,
  fetchSurveyMedia,
  SUPERVISORS,
  SITE_STATUSES,
>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
} from "../../data/siteStorage";

const SUB_TABS = ["All", "Survey", "Design", "In Progress", "Completed"];

const SUB_TAB_STATUS = {
  0: null,
  1: "survey",
  2: "design",
  3: "in progress",
  4: "completed",
};

const Sites = () => {
<<<<<<< HEAD
  const navigate = useNavigate();
  const [allSites, setAllSites] = useState(() => getAllSites());
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

=======
  const [allSites, setAllSites] = useState(() => getAllSites());
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal tab and survey API states
  const [modalTab, setModalTab] = useState("general"); // "general" | "survey"
  const [surveyData, setSurveyData] = useState(null);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Form states for Editing Site Details (General Info Tab)
  const [editStatus, setEditStatus] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editSupervisor, setEditSupervisor] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const handleStatusChange = (val) => {
    setEditStatus(val);
    if (val === "Survey") setEditProgress(25);
    else if (val === "Design") setEditProgress(50);
    else if (val === "In Progress") setEditProgress(75);
    else if (val === "Completed") setEditProgress(100);
    else if (!val) setEditProgress(0);
  };

  const handleProgressChange = (val) => {
    const num = Number(val);
    setEditProgress(num);
    if (num === 0) setEditStatus("");
    else if (num <= 25) setEditStatus("Survey");
    else if (num <= 50) setEditStatus("Design");
    else if (num <= 75) setEditStatus("In Progress");
    else setEditStatus("Completed");
  };

>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
  useEffect(() => {
    const handler = () => {
      setAllSites(getAllSites());
    };
    window.addEventListener("siteDataChanged", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("siteDataChanged", handler);
      window.removeEventListener("focus", handler);
    };
  }, []);

<<<<<<< HEAD
=======
  // Set edit form values when selected site changes
  useEffect(() => {
    if (selectedSite) {
      setEditStatus(selectedSite.status);
      setEditProgress(selectedSite.progress);
      setEditSupervisor(selectedSite.supervisor);
      setEditTargetDate(selectedSite.targetDate || "");
      setEditNotes(selectedSite.notes || "");
      setEditAddress(selectedSite.fullAddress || "");
      setModalTab("general");
      setSurveyData(null);
    }
  }, [selectedSite]);

  // Load survey media from API when survey tab is clicked
  useEffect(() => {
    if (modalTab === "survey" && selectedSite && !surveyData) {
      setLoadingSurvey(true);
      fetchSurveyMedia(selectedSite.siteID).then((data) => {
        setSurveyData(data);
        setLoadingSurvey(false);
      });
    }
  }, [modalTab, selectedSite, surveyData]);

>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
  // Filter and format data for the Table component
  const filteredData = useMemo(() => {
    const targetStatus = SUB_TAB_STATUS[activeSubTab];
    const filtered = targetStatus
      ? allSites.filter((s) => s.status?.toLowerCase() === targetStatus)
      : allSites;

    return filtered.map((site, index) => ({
      ...site,
      sno: String(index + 1).padStart(2, "0"),
    }));
  }, [allSites, activeSubTab]);

  const handleOpenDetails = (site) => {
<<<<<<< HEAD
    navigate(`/sitevisit/${site.siteID}`);
=======
    setSelectedSite(site);
  };

  const handleSaveChanges = async () => {
    if (!selectedSite) return;
    setIsSaving(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const updatedSite = {
      ...selectedSite,
      status: editStatus,
      progress: Number(editProgress),
      supervisor: editSupervisor,
      targetDate: editTargetDate,
      notes: editNotes,
      fullAddress: editAddress,
    };

    saveSite(updatedSite);
    setAllSites(getAllSites());
    setSelectedSite(null);
    setIsSaving(false);
>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
  };

  const handleAddSiteSubmit = async (siteData) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    createCustomSite({
      ...siteData,
      status: null,
      progress: 0,
    });

    setAllSites(getAllSites());
    setShowAddModal(false);
    setIsSaving(false);
  };

<<<<<<< HEAD
=======
  const handleExpandSurveyPhoto = (images, initialIdx, title) => {
    setLightboxImg({ images, currentIndex: initialIdx, title });
  };

>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
  const columns = [
    { key: "sno", label: "S.No" },
    {
      key: "siteID",
      label: "Site ID",
      render: (val) => (
<<<<<<< HEAD
        <span className="cursor-pointer hover:underline font-medium text-gray-900">
=======
        <span className="cursor-pointer hover:underline font-semibold text-gray-900">
>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
          {val}
        </span>
      ),
    },
    {
      key: "clientName",
      label: "Client Name",
      render: (val) => (
        <span className="cursor-pointer hover:underline font-medium text-gray-900">
          {val}
        </span>
      ),
    },
    {
      key: "scope",
      label: "Scope",
      render: (_, row) => {
        const preset = row.propertyPreset;
        const siteType = row.siteType || "";
        const formattedPreset = preset ? preset.replace(/^(\d+)(BHK)$/i, "$1 BHK") : "";
        return formattedPreset ? `${formattedPreset} / ${siteType}` : siteType;
      },
    },
    {
      key: "location",
      label: "Location",
      render: (val) => {
        if (!val) return "—";
        const parts = val.includes(",") ? val.split(",") : [val, ""];
        const primary = parts[0]?.trim() || "—";
        const secondary = parts.slice(1).join(",").trim() || "";
        return (
          <div className="flex flex-col text-left">
            <span className="text-gray-900 leading-normal">{primary}</span>
            {secondary && (
              <span className="text-select-blue text-xs leading-tight mt-0.5">
                {secondary}
              </span>
            )}
          </div>
        );
      },
    },
    { key: "supervisor", label: "Supervisor" },
    {
      key: "progress",
      label: "Progress",
      render: (val) => {
        const percentage = Number(val || 0);
        return (
          <div className="flex items-center gap-3 justify-center min-w-[120px]">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-select-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-semibold text-darkgray">
              {percentage}%
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const statusColors = {
          survey: "bg-blue-100 text-blue-700",
          design: "bg-purple-100 text-purple-700",
          "in progress": "bg-amber-100 text-amber-700",
          completed: "bg-green-100 text-green-700",
        };
        const style =
          statusColors[val?.toLowerCase()] || "bg-gray-100 text-gray-600";
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${style}`}
          >
            {val}
          </span>
        );
      },
    },
    { key: "targetDate", label: "Target Completion" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <Table
        title="Project Sites"
        subtitle={`Sites - ${SUB_TABS[activeSubTab]}`}
        columns={columns}
        data={filteredData}
        emptyMessage="No sites found in this category."
        rowsPerPage={8}
        subTabs={SUB_TABS}
        onSubTabChange={setActiveSubTab}
        activeRowKey="siteID"
        onRowClick={handleOpenDetails}
        clickableColumns={["siteID", "clientName"]}
        onCellClick={handleOpenDetails}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
<<<<<<< HEAD
            className="flex items-center gap-2 bg-linear-to-r from-select-blue to-dark-blue text-white rounded-lg px-8 py-2.5 text-sm font-medium cursor-pointer hover:shadow-select-blue/30 hover:hover:scale-[1.02]"
=======
            className="flex items-center gap-2 bg-linear-to-r from-select-blue to-dark-blue text-white rounded-lg px-8 py-2.5 text-sm font-medium cursor-pointer hover:shadow-md transition-all animate-all"
>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
          >
            <FiPlusCircle />
            Add Site
          </button>
        }
        sortFields={[
          { key: "clientName", label: "Client Name" },
          { key: "siteID", label: "Site ID" },
          { key: "progress", label: "Progress" },
          { key: "status", label: "Status" },
        ]}
        filterFields={[
          {
            key: "status",
            label: "Status",
            options: ["Survey", "Design", "In Progress", "Completed"],
          },
          {
            key: "supervisor",
            label: "Supervisor",
            options: SUPERVISORS,
          },
        ]}
        dateRangeField={{
          key: "targetDate",
          parse: (value) => {
            const parts = value?.split(".");
            if (parts?.length === 3)
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            return null;
          },
        }}
        exportConfig={{
          filename: "sites_export",
          columns: [
            { label: "S.No", key: "sno" },
            { label: "Site ID", key: "siteID" },
            { label: "Client Name", key: "clientName" },
            {
              label: "Scope",
              render: (row) => {
                const preset = row.propertyPreset;
                const siteType = row.siteType || "";
                const formattedPreset = preset ? preset.replace(/^(\d+)(BHK)$/i, "$1 BHK") : "";
                return formattedPreset ? `${formattedPreset} / ${siteType}` : siteType;
              },
            },
            { label: "Location", key: "location" },
            { label: "Supervisor", key: "supervisor" },
            { label: "Progress (%)", key: "progress" },
            { label: "Status", key: "status" },
            { label: "Target Completion", key: "targetDate" },
          ],
        }}
      />

<<<<<<< HEAD
=======
      {/* Details Side Modal / Edit View */}
      {selectedSite && (
        <Modal
          title={`Site Details - ${selectedSite.siteID}`}
          subtitle="View and edit site details, progress, and mobile survey media"
          onClose={() => setSelectedSite(null)}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedSite(null)}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all"
              >
                Cancel
              </button>
              {modalTab === "general" && (
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="min-w-[120px] flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              )}
            </div>
          }
        >
          {/* Tab Switcher inside Modal using reusable TabBar */}
          <TabBar
            tabs={[
              "General Information",
              `Mobile App Survey (${selectedSite.status === "Survey" ? "Active" : "Synced"})`,
            ]}
            active={modalTab === "general" ? 0 : 1}
            onChange={(idx) => setModalTab(idx === 0 ? "general" : "survey")}
            variant="underline"
          />

          {modalTab === "general" ? (
            <GeneralInfoTab
              selectedSite={selectedSite}
              editAddress={editAddress}
              setEditAddress={setEditAddress}
              editStatus={editStatus}
              setEditStatus={handleStatusChange}
              editSupervisor={editSupervisor}
              setEditSupervisor={setEditSupervisor}
              editProgress={editProgress}
              setEditProgress={handleProgressChange}
              editTargetDate={editTargetDate}
              setEditTargetDate={setEditTargetDate}
              editNotes={editNotes}
              setEditNotes={setEditNotes}
              SITE_STATUSES={SITE_STATUSES}
              SUPERVISORS={SUPERVISORS}
            />
          ) : (
            <SurveyMediaTab
              loadingSurvey={loadingSurvey}
              surveyData={surveyData}
              setSurveyData={setSurveyData}
              onExpand={handleExpandSurveyPhoto}
            />
          )}
        </Modal>
      )}

      {/* Lightbox / Zoom View */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-200 bg-black/95 flex flex-col items-center justify-center p-4 transition-all select-none"
          onClick={() => setLightboxImg(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 text-white/75 hover:text-white text-xs bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all font-semibold uppercase tracking-wider z-210"
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
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-210"
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
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all cursor-pointer z-210"
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

>>>>>>> 88cd3d50588fe949154a932ec18fedc11a79a200
      {/* Add Site Modal */}
      {showAddModal && (
        <AddSiteModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSiteSubmit}
          isSaving={isSaving}
          SUPERVISORS={SUPERVISORS}
        />
      )}
    </div>
  );
};

export default Sites;
