import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa6";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import { FaRegFilePdf } from "react-icons/fa6";
import {
  Mail,
  Lock,
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  Home,
  CreditCard,
  Image as ImageIcon,
  Calendar,
  MessageCircleMore,
  LogOut,
  Download,
  User,
  MapPin,
  Building,
  Phone,
  Upload,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  FileCheck,
  Printer,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Activity
} from "lucide-react";
import { getClient, getAllClients } from "../../data/clientStorage";
import { getActiveClientId, clientLogout } from "../../auth/clientAuth";
import { PAYMENT_MILESTONES } from "../../data/MilestoneConfig";
import wipLogo from "../../assets/images/Logo.png";
import ClientAvatar from "../../assets/images/Client_avatar.png";
import QuotePreviewModal from "../../components/QuotePreviewModal";
import { getQuotesForParent } from "../../data/QuotePresets";
import { getOrSeedSchedule } from "../../data/scheduleStorage";

const parseBudget = (budgetString) => {
  if (!budgetString) return 5000000;
  let cleanStr = budgetString.replace("₹", "").trim();
  if (cleanStr.includes("Cr")) {
    const val = parseFloat(cleanStr.replace("Cr", "").split("-")[0]);
    return val * 10000000;
  }
  if (cleanStr.includes("L")) {
    const parts = cleanStr.replace("L", "").split("-");
    const val = parseFloat(parts[0]);
    const val2 = parts[1] ? parseFloat(parts[1]) : val;
    return ((val + val2) / 2) * 100000;
  }
  return 5000000;
};

const formatAmount = (amount) => {
  if (!amount || amount <= 0) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState(getActiveClientId());
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("milestones");
  const [milestones, setMilestones] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState(null);
  
  const [associatedLead, setAssociatedLead] = useState(null);

  useEffect(() => {
    if (!client) return;
    const savedLeads = localStorage.getItem("newLeadsData");
    const leadsList = savedLeads ? JSON.parse(savedLeads) : [];
    const foundLead = leadsList.find(
      (l) =>
        l.proposalId === client.sourceLeadId ||
        l.convertedClientID === client.clientID
    ) || null;
    setAssociatedLead(foundLead);

    // Keep schedule seeded in background for consistency
    const seedLead = foundLead || {
      proposalId: client.sourceLeadId || client.clientID,
      quotePreset: client.quotePreset || "2BHK",
      propertyType: client.propertyType || client.location || "Apartment",
      quoteSizeRange: "",
      clientName: client.clientName,
    };
    getOrSeedSchedule(seedLead);
  }, [client]);

  // Appointments / Site Visits state
  const [meetingSubject, setMeetingSubject] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [appointments, setAppointments] = useState([
    {
      date: "12",
      month: "JAN",
      title: "Site Visit – Luxury Villa Review",
      time: "10:00 – 12:00",
      status: "Done",
      statusColor: "bg-[#E6F4EA] text-[#16A34A] border-[#DCFCE7]",
      type: "Site Review",
    },
    {
      date: "28",
      month: "JAN",
      title: "Electrical & Ceiling Layout Discussion",
      time: "14:00 – 15:30",
      status: "Done",
      statusColor: "bg-[#E6F4EA] text-[#16A34A] border-[#DCFCE7]",
      type: "Drawing Review",
    },
    {
      date: "14",
      month: "FEB",
      title: "Material & Flooring Selection",
      time: "11:00 – 12:30",
      status: "Done",
      statusColor: "bg-[#E6F4EA] text-[#16A34A] border-[#DCFCE7]",
      type: "Selection",
    },
    {
      date: "10",
      month: "JUN",
      title: "Site Progress Walkthrough",
      time: "10:00 – 11:30",
      status: "Scheduled",
      statusColor: "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]",
      type: "Site Visit",
    },
  ]);

  // Support / Message Log state
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "designer",
      text: "Hello! We have uploaded the finalized 3D renders for the Living Room in the Designs gallery. Let us know your thoughts.",
      time: "Today, 10:15 AM",
    },
  ]);

  // Gallery items (Moodboards, Drawings, Renders)
  const [gallery, setGallery] = useState([
    {
      id: "gal-1",
      title: "Living Room 3D Render (Theme: Warm Contemporary)",
      category: "3D Render",
      url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
      uploaded: "02.06.2026",
    },
    {
      id: "gal-2",
      title: "Floor Plan & Partition Details Layout",
      category: "CAD Drawing",
      url: "https://images.unsplash.com/photo-1503387762458-7e52f42855f9?auto=format&fit=crop&w=800&q=80",
      uploaded: "28.05.2026",
    },
    {
      id: "gal-3",
      title: "Moodboard - Master Bedroom Textures & Veneers",
      category: "Moodboard",
      url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
      uploaded: "20.05.2026",
    },
  ]);

  useEffect(() => {
    const activeId = getActiveClientId();
    setClientId(activeId);
    const cData = getClient(activeId);
    if (!cData) {
      const list = getAllClients();
      if (list.length > 0) {
        setClient(list[0]);
        loadMilestones(list[0].clientID, list[0]);
      }
    } else {
      setClient(cData);
      loadMilestones(activeId, cData);
    }
  }, [clientId]);

  const loadMilestones = (cid, cData) => {
    const saved = localStorage.getItem(`clientMilestones_${cid}`);
    if (saved) {
      try {
        setMilestones(JSON.parse(saved));
      } catch (e) {
        generateDefaultMilestones(cid, cData);
      }
    } else {
      generateDefaultMilestones(cid, cData);
    }
  };

  const generateDefaultMilestones = (cid, cData) => {
    const val = parseBudget(cData.budget);
    const initialMilestones = PAYMENT_MILESTONES.map((m) => {
      const base = Math.round(val * (m.pct / 100));
      const gstAmt = Math.round(base * 0.18);
      const total = base + gstAmt;
      return {
        id: m.id,
        name: m.name,
        pct: m.pct,
        base,
        gstAmt,
        total,
        status: m.id === 1 ? "paid" : "pending",
        paidDate: m.id === 1 ? "15.05.2026" : "",
      };
    });
    localStorage.setItem(`clientMilestones_${cid}`, JSON.stringify(initialMilestones));
    setMilestones(initialMilestones);
  };

  const handleOpenPayment = (m) => {
    setSelectedMilestone(m);
    setPaymentReference("");
    setPaymentBank("");
    setIsPaymentSuccess(false);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!paymentReference || !paymentBank) return;

    setIsSubmittingPayment(true);
    setTimeout(() => {
      setIsSubmittingPayment(false);
      setIsPaymentSuccess(true);
      
      const today = new Date();
      const paidDate = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}.${today.getFullYear()}`;
      
      const updated = milestones.map((m) =>
        m.id === selectedMilestone.id ? { ...m, status: "paid", paidDate, paymentReference, paymentBank } : m
      );
      
      setMilestones(updated);
      localStorage.setItem(`clientMilestones_${client.clientID}`, JSON.stringify(updated));

      if (updated.every((m) => m.status === "paid")) {
        const savedClients = localStorage.getItem("newClientsData");
        let newClients = savedClients ? JSON.parse(savedClients) : [];
        const idx = newClients.findIndex((c) => c.clientID === client.clientID);
        if (idx >= 0) {
          newClients[idx] = { ...newClients[idx], paymentStatus: "completed" };
        } else {
          newClients.push({ ...client, paymentStatus: "completed" });
        }
        localStorage.setItem("newClientsData", JSON.stringify(newClients));
        setClient((prev) => ({ ...prev, paymentStatus: "completed" }));
      }
      
      setTimeout(() => {
        setPaymentModalOpen(false);
      }, 1000);
    }, 1500);
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!meetingSubject || !meetingDate || !meetingTime) return;

    const dateParts = meetingDate.split("-");
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[parseInt(dateParts[1], 10) - 1] || "JUN";
    const day = dateParts[2] || "15";

    const newApt = {
      date: day,
      month,
      title: meetingSubject,
      time: meetingTime,
      status: "Pending Approval",
      statusColor: "bg-[#FEF3C7] text-pending border-[#FEEBBE]",
      type: "Client Request",
    };

    setAppointments([...appointments, newApt]);
    setMeetingSubject("");
    setMeetingDate("");
    setMeetingTime("");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMsg = {
      sender: "client",
      text: chatMessage,
      time: "Just now",
    };

    setMessages([...messages, newMsg]);
    setChatMessage("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "designer",
          text: "Thanks for writing! We have received your query. A project architect will get back to you shortly.",
          time: "Just now",
        },
      ]);
    }, 1500);
  };

  const handleLogout = () => {
    clientLogout();
    navigate("/client/login");
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-overallbg flex justify-center items-center">
        <Loader2 className="animate-spin text-purple w-10 h-10" />
      </div>
    );
  }

  // Calculate metrics
  const paidCount = milestones.filter((m) => m.status === "paid").length;
  const pendingCount = milestones.length - paidCount;
  const totalContract = milestones.reduce((s, m) => s + m.total, 0);
  const totalCollected = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.total, 0);
  const remainingCollected = totalContract - totalCollected;

  const isConverted = !!client.sourceLeadId;
  const progressPct = totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0;

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "bg-[#FFF4E5] text-pending border-[#FFEDD5]";
    if (s === "completed") return "bg-[#E6F4EA] text-[#16A34A] border-[#DCFCE7]";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  // Define client sidebar module menus
  const clientModules = [
    { id: "milestones", label: "Payment Milestones", icon: RiMoneyRupeeCircleFill },
    { id: "quotes", label: "Project Quotes", icon: FaRegFilePdf },
    { id: "appointments", label: "Site Visits & Calendar", icon: Calendar },
    { id: "gallery", label: "Designs & Renders", icon: ImageIcon },
    { id: "support", label: "Support & Chat", icon: MessageCircleMore },
    { id: "invoices", label: "GST Invoice", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-overallbg text-textcolor flex w-full font-sans overflow-hidden h-screen">
      
      {/* Left Sidebar Module Bar */}
      <aside className="w-20 md:w-64 bg-white border-r border-bordergray flex flex-col justify-between shrink-0 h-full p-4 z-40 shadow-sm">
        <div className="flex flex-col gap-2">
          {/* Logo */}
          <div className="mb-6 hidden md:flex items-center gap-3 px-2">
            <img src={wipLogo} alt="WIP Logo" className="h-8 w-auto object-contain" />
            <div className="flex flex-col border-l border-paleorange/40 pl-3 leading-none">
              <p className="text-[10px] uppercase tracking-[0.3em] text-dark-yellow font-bold">
                Client Portal
              </p>
            </div>
          </div>

          {/* Module list */}
          {clientModules.map((m) => {
            const Icon = m.icon;
            const active = activeTab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`flex flex-col font-semibold md:flex-row items-center gap-1 md:gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  active
                    ? "bg-active-bg text-select-blue md:border-r-4 md:border-select-blue font-bold shadow-sm"
                    : "text-grey hover:bg-active-bg hover:text-darkgray"
                }`}
              >
                <Icon size={20} />
                <span className="text-[9px] md:text-[13.5px] leading-tight text-center md:text-left whitespace-nowrap">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-bordergray/60 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <img src={ClientAvatar} alt="Client" className="w-8 h-8 rounded-full object-cover border border-bordergray" />
            <div className="hidden md:block text-left leading-none">
              <p className="text-xs font-bold text-darkgray truncate w-32">{client.clientName}</p>
              <p className="text-[10px] text-text-subtle mt-0.5">{client.clientID}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start gap-3 w-full px-3 py-2.5 rounded-xl border border-bordergray text-grey hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer shadow-sm"
            title="Log Out"
          >
            <LogOut size={16} />
            <span className="hidden md:inline text-xs font-bold">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Title bar */}
        <div className="px-6 sm:px-10 pt-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-bordergray hover:bg-gray-50 text-gray-500 transition-all shadow-sm cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-[26px] font-bold text-darkgray leading-tight">
                Client Profile
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                Clients — {client.clientName}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col lg:flex-row gap-6 overflow-y-auto scroll-hidden-bar">
          
          {/* Left Column - Sidebar Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 min-w-0 shrink-0">
            {/* Profile Card */}
            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col items-center text-center">
              <div className="relative mb-5">
                <img
                  src={ClientAvatar}
                  alt=""
                  className="w-28 h-28 rounded-full border-[3px] border-white shadow-md object-cover"
                />
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full" />
              </div>

              <h3 className="text-[22px] font-bold text-dark-blue mb-1">
                {client.clientName}
              </h3>
              <p className="text-[12px] font-medium text-gray-400 mb-2">
                {client.clientID}
              </p>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(client.paymentStatus || "pending")}`}
              >
                {client.paymentStatus || "PENDING"}
              </span>

              {isConverted && (
                <span className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-teal-600">
                  Converted from Lead #{client.sourceLeadId}
                </span>
              )}

              {client.joinDate && (
                <p className="mt-2 text-[11px] text-text-muted">
                  Client since {client.joinDate}
                </p>
              )}

              <div className="w-full border-t border-border mt-5 pt-5 flex flex-col gap-2.5">
                <button 
                  onClick={() => setActiveTab("appointments")}
                  className="w-full py-2.5 bg-dark-blue hover:bg-blue-950 text-white rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Phone size={15} /> Schedule Call
                </button>
                <div className="flex gap-2.5">
                  <a
                    href={`https://wa.me/${client.clientPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 bg-palewhite hover:bg-bg-soft text-grey rounded-[12px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-border text-center cursor-pointer"
                  >
                    <FaWhatsapp size={14} /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${client.clientEmail}`}
                    className="flex-1 py-2.5 bg-palewhite hover:bg-bg-soft text-grey rounded-[12px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-border text-center cursor-pointer"
                  >
                    <Mail size={14} /> Email
                  </a>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">
                Client Details
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    label: "Phone Number",
                    value: `+91 ${client.clientPhone}`,
                    color: "text-darkgray",
                  },
                  {
                    label: "Email",
                    value: client.clientEmail,
                    color: "text-sky-blue truncate",
                  },
                  {
                    label: "Property Preset",
                    value: (client.quotePreset || associatedLead?.quotePreset || "2BHK").replace(/^(\d+)(BHK)$/i, "$1 BHK"),
                    color: "text-darkgray uppercase",
                  },
                  {
                    label: "Property Type",
                    value: client.propertyType || associatedLead?.propertyType || client.location || "Apartment",
                    color: "text-darkgray uppercase",
                  },
                  {
                    label: "Location",
                    value: client.locationSecondary,
                    color: "text-darkgray",
                  },
                  {
                    label: "Budget",
                    value: client.budget,
                    color: "text-darkgray",
                  },
                  ...(totalContract > 0
                    ? [
                        {
                          label: "Total Payable (incl. GST)",
                          value: formatAmount(totalContract),
                          color: "text-select-blue font-extrabold",
                        },
                      ]
                    : []),
                  ...(client.joinDate
                    ? [
                        {
                          label: "Client Since",
                          value: client.joinDate,
                          color: "text-darkgray",
                        },
                      ]
                    : []),
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center p-3 border border-bg-soft bg-palewhite rounded-[12px]"
                  >
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      {label}
                    </p>
                    <p
                      className={`font-bold text-[13px] text-right max-w-[55%] ${color}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Sub-Module View */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6 min-w-0">
            {/* Stats Metric Cards */}
            {/* Stats Metric Cards - Plain Textual 6-Card Grid */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] p-6 shrink-0 text-left">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-darkgray border-b border-gray-100 pb-3 mb-4">
                <Activity size={16} className="text-gray-500" /> Activity Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Stages</p>
                  <div className="text-[18px] font-extrabold text-slate-800">{milestones.length}</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Stages Completed</p>
                  <div className="text-[18px] font-extrabold text-emerald-700">{paidCount}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Stages Pending</p>
                  <div className="text-[18px] font-extrabold text-amber-700">{pendingCount}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Project Value</p>
                  <div className="text-[18px] font-extrabold text-select-blue font-sans">
                    {formatAmount(totalContract)}
                  </div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Amount Paid</p>
                  <div className="text-[18px] font-extrabold text-emerald-700 font-sans">{formatAmount(totalCollected)}</div>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Balance Amount</p>
                  <div className="text-[18px] font-extrabold text-rose-700 font-sans">
                    {formatAmount(remainingCollected)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-module View Wrapper Card */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col flex-1 min-h-[450px]">
              
              {/* TAB: PAYMENT MILESTONES */}
              {activeTab === "milestones" && (
                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Summary progress card - Textual Only */}
                    <div className="mb-6 p-5 rounded-[16px] bg-[#E9E9FF]/20 border border-border text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
                            Total Payable (incl. GST)
                          </p>
                          <p className="text-[22px] font-bold text-dark-blue font-sans">
                            {formatAmount(totalContract)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
                            Collected
                          </p>
                          <p className="text-[22px] font-bold text-emerald-600 font-sans">
                            {formatAmount(totalCollected)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[12px] text-text-muted">
                        <span>Milestones Progression</span>
                        <span className="font-bold text-darkgray">{paidCount} of {milestones.length} Paid</span>
                      </div>
                    </div>

                    {/* Milestone rows */}
                    <div className="flex flex-col gap-3.5">
                      {milestones.map((m, idx) => {
                        const isPaid = m.status === "paid";
                        const isPreviousPaid = idx === 0 || milestones[idx - 1].status === "paid";
                        const base = m.base ?? m.amount ?? 0;
                        const gstAmt = m.gstAmt ?? Math.round(base * 0.18);
                        const total = m.total ?? base + gstAmt;

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-[16px] border transition-all ${
                              isPaid
                                ? "bg-emerald-50/40 border-emerald-100"
                                : !isPreviousPaid
                                  ? "bg-gray-50/70 border-gray-100 opacity-60 cursor-not-allowed select-none"
                                  : "bg-white border-border hover:border-blue-100 hover:bg-palewhite"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold border-2 ${
                                  isPaid
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : !isPreviousPaid
                                      ? "bg-gray-100/80 border-gray-200 text-gray-400"
                                      : "bg-white border-border text-text-muted"
                                }`}
                              >
                                {isPaid ? <Check size={14} strokeWidth={3} /> : idx + 1}
                              </div>
                              <div className="text-left">
                                <p
                                  className={`text-[14px] font-bold ${
                                    isPaid ? "text-emerald-700" : !isPreviousPaid ? "text-gray-400" : "text-darkgray"
                                  }`}
                                >
                                  {m.name}
                                </p>
                                {isPaid && m.paidDate ? (
                                  <p className="text-[11px] text-emerald-600 font-medium">
                                    Paid on {m.paidDate}
                                  </p>
                                ) : (
                                  <p className={`text-[11px] font-medium ${!isPreviousPaid ? "text-gray-400" : "text-text-muted"}`}>
                                    {formatAmount(base)} + GST {formatAmount(gstAmt)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-5 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-left sm:text-right">
                                <p
                                  className={`text-[15px] font-bold ${
                                    isPaid ? "text-emerald-700" : !isPreviousPaid ? "text-gray-400" : "text-darkgray"
                                  }`}
                                >
                                  {formatAmount(total)}
                                </p>
                                <p className={`text-[11px] ${!isPreviousPaid ? "text-gray-400/80" : "text-text-muted"}`}>
                                  {m.pct}% + 18% GST
                                </p>
                              </div>

                              <div>
                                {isPaid ? (
                                  <button className="py-2 px-3.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 transition-all cursor-pointer">
                                    <FileText size={13} />
                                    Receipt
                                  </button>
                                ) : isPreviousPaid ? (
                                  <button
                                    onClick={() => handleOpenPayment(m)}
                                    className="py-2 px-4 bg-purple hover:bg-dark-blue text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                                  >
                                    Log Payment
                                  </button>
                                ) : (
                                  <button disabled className="py-2 px-4 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl text-xs font-bold">
                                    Locked
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project execution tracker timeline at bottom */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-[13px] font-bold text-darkgray uppercase tracking-wider mb-5">Project Execution Phase</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {[
                        { title: "Design Signoff", desc: "Drawings approved", completed: true },
                        { title: "Procurement", desc: "Material sourced", completed: true },
                        { title: "First Fix", desc: "Carpentry & Electrical", completed: true },
                        { title: "Finishing", desc: "Paint & Veneer", completed: false },
                        { title: "Handover", desc: "Final delivery", completed: false }
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-gray-100">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-bold ${
                            step.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-text-subtle"
                          }`}>
                            {step.completed ? <Check size={12} strokeWidth={3} /> : idx + 1}
                          </div>
                          <p className={`text-xs font-bold mt-2 ${step.completed ? 'text-darkgray' : 'text-text-subtle'}`}>{step.title}</p>
                          <p className="text-[9.5px] text-text-subtle mt-0.5 leading-tight">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PROJECT QUOTES */}
              {activeTab === "quotes" && (
                <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-6">
                      <h4 className="text-[14px] font-bold text-darkgray uppercase tracking-wider">
                        Project Estimates & Quotes
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9E9FF] text-select-blue text-[10px] font-bold">
                        {getQuotesForParent(client.sourceLeadId || client.clientID).length} Quotes
                      </span>
                    </div>

                    {/* Quotes list */}
                    {(() => {
                      const parentId = client.sourceLeadId || client.clientID;
                      const list = getQuotesForParent(parentId);
                      if (list.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                              <FileText className="text-gray-400" size={24} />
                            </div>
                            <p className="text-[14px] font-bold text-text mb-1">No Estimates Yet</p>
                            <p className="text-[13px] text-text-muted">
                              Your finalized project quotation will appear here for download once released by the architect.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-4">
                          {list.map((q) => {
                            const grandTotal = q.grandTotal || (q.scopeItems || []).reduce((s, it) => s + (Number(it.amount) || 0), 0) * 1.18;
                            return (
                              <div
                                key={q.quoteId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-bordergray rounded-2xl shadow-sm hover:border-blue-100 hover:bg-palewhite transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center text-purple shrink-0">
                                    <FileText size={18} />
                                  </div>
                                  <div className="text-left">
                                    <h4 className="font-extrabold text-darkgray text-sm leading-snug">
                                      {q.quoteId}
                                    </h4>
                                    <p className="text-[11px] text-text-subtle mt-0.5">
                                      Created on {new Date(q.createdAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })} · {q.propertyType}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 mt-4 sm:mt-0 justify-between sm:justify-end">
                                  <div className="text-left sm:text-right">
                                    <p className="text-sm font-extrabold text-darkgray">
                                      {formatAmount(grandTotal)}
                                    </p>
                                    <p className="text-[10px] text-text-subtle">
                                      Incl. 18% GST
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setSelectedQuoteForPreview(q)}
                                      className="py-2 px-3.5 bg-palewhite hover:bg-bg-soft text-grey hover:text-darkgray border border-bordergray hover:border-border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      Preview
                                    </button>
                                    <button
                                      onClick={() => setSelectedQuoteForPreview(q)}
                                      className="py-2 px-3.5 bg-purple hover:bg-dark-blue text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Printer size={13} />
                                      Save PDF
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB: APPOINTMENTS */}
              {activeTab === "appointments" && (
                <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                  {/* Request form */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between h-fit">
                    <h4 className="text-[13px] font-bold text-darkgray uppercase tracking-wider mb-4">Request Consultation</h4>
                    <form onSubmit={handleCreateAppointment} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-grey uppercase tracking-wider">Subject / Purpose</label>
                        <input
                          type="text"
                          required
                          value={meetingSubject}
                          onChange={(e) => setMeetingSubject(e.target.value)}
                          placeholder="E.g. Material review, site walk"
                          className="w-full text-xs border border-bordergray rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-purple"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-grey uppercase tracking-wider">Preferred Date</label>
                        <input
                          type="date"
                          required
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full text-xs border border-bordergray rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-purple"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-grey uppercase tracking-wider">Preferred Time</label>
                        <input
                          type="text"
                          required
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          placeholder="E.g. 10:00 AM - 12:00 PM"
                          className="w-full text-xs border border-bordergray rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-purple"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full mt-4 py-2.5 bg-purple hover:bg-dark-blue text-white rounded-full text-xs font-bold shadow-sm transition-all text-center cursor-pointer"
                      >
                        Submit Request
                      </button>
                    </form>
                  </div>

                  {/* Appointments list */}
                  <div className="lg:col-span-2 flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h4 className="text-[13px] font-bold text-darkgray uppercase tracking-wider">
                        Appointment History & Calendar
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                        {appointments.length} total
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[340px] scrollbar-thin">
                      {appointments.map((apt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-100 hover:bg-palewhite transition-all">
                          <div className="flex items-center gap-4">
                            <div className="text-center w-12 h-12 bg-white rounded-xl flex flex-col justify-center items-center border border-bordergray shadow-sm shrink-0">
                              <div className="text-[15px] font-bold text-darkgray leading-none">{apt.date}</div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{apt.month}</div>
                            </div>
                            <div className="text-left">
                              <h4 className="font-bold text-darkgray text-xs leading-snug">{apt.title}</h4>
                              <p className="text-[11px] text-text-subtle mt-0.5">{apt.time} · {apt.type}</p>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${apt.statusColor}`}>
                            {apt.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INVOICES */}
              {activeTab === "invoices" && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-8">
                  <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                    <FileText className="text-gray-400" size={24} />
                  </div>
                  <p className="text-[14px] font-bold text-text mb-1">
                    Invoices Coming Soon
                  </p>
                  <p className="text-[13px] text-text-muted">
                    Invoice generation and downloads will be available in the next release.
                  </p>
                </div>
              )}

              {/* TAB: DESIGNS & RENDERS */}
              {activeTab === "gallery" && (
                <div className="p-6 sm:p-8 space-y-6 flex-1">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-[14px] font-bold text-darkgray uppercase tracking-wider">Drawings & Moodboards</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gallery.map((g) => (
                      <div key={g.id} className="border border-bordergray/60 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all bg-white">
                        <div className="relative aspect-video overflow-hidden bg-bg-soft">
                          <img src={g.url} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] uppercase font-bold bg-[#0F172A]/90 text-white rounded-md tracking-wider">
                            {g.category}
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-darkgray leading-tight group-hover:text-purple transition-colors">
                              {g.title}
                            </h4>
                            <p className="text-[10px] text-text-subtle mt-1.5 flex items-center gap-1">
                              <Clock size={11} />
                              Uploaded on {g.uploaded}
                            </p>
                          </div>
                          <div className="border-t border-bordergray/60 mt-3 pt-3 flex justify-between">
                            <button className="text-[11px] font-bold text-grey hover:text-purple flex items-center gap-1 transition-colors">
                              Fullscreen
                            </button>
                            <a href={g.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-purple hover:text-dark-blue flex items-center gap-1.5 transition-colors">
                              <Download size={12} />
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SUPPORT & CHAT */}
              {activeTab === "support" && (
                <div className="p-6 sm:p-8 flex flex-col h-[500px] flex-1 justify-between">
                  <div className="border-b border-gray-100 pb-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple/10 text-purple rounded-xl flex items-center justify-center font-bold text-xs">
                        PR
                      </div>
                      <div className="text-left leading-none">
                        <h4 className="text-xs font-bold text-darkgray">Prakash Raj</h4>
                        <span className="text-[9.5px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Designer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message Log */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-4 scroll-hidden-bar flex flex-col-reverse max-h-[300px]">
                    <div className="space-y-4">
                      {messages.map((m, idx) => {
                        const isClient = m.sender === "client";
                        return (
                          <div key={idx} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                              isClient
                                ? "bg-purple text-white rounded-br-none shadow-sm"
                                : "bg-light-gray border border-bordergray text-darkgray rounded-bl-none"
                            }`}>
                              <p>{m.text}</p>
                              <span className={`text-[8.5px] block mt-1.5 text-right ${isClient ? "text-white/60" : "text-text-subtle"}`}>
                                {m.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} className="border-t border-bordergray/60 pt-3 flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message to your design team..."
                      className="flex-1 text-xs border border-bordergray rounded-xl px-4 py-3 bg-light-gray focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/10"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-purple hover:bg-dark-blue text-white rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] p-6 sm:p-8 max-w-[420px] w-full border border-bordergray shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-darkgray uppercase tracking-wider mb-2">Record Offline Payment</h3>
            <p className="text-xs text-text-subtle leading-relaxed mb-5">
              Submit details of your bank transfer or UPI transfer for stage: <strong>{selectedMilestone.name}</strong>.
            </p>

            {isPaymentSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Check size={24} strokeWidth={3} />
                </div>
                <p className="text-sm font-bold text-emerald-800">Payment Details Logged!</p>
                <p className="text-xs text-text-subtle mt-1">Our accountant will verify the bank clearance soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="p-3 bg-palewhite border border-bordergray rounded-xl flex justify-between items-center text-xs">
                  <span className="text-text-subtle">Amount Due (incl. GST):</span>
                  <strong className="text-purple font-extrabold text-sm">{formatAmount(selectedMilestone.total)}</strong>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-grey uppercase tracking-wider">Transaction ID / Reference Number</label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="E.g. TXN987654321 or UPI ref"
                    className="w-full text-xs border border-bordergray rounded-xl px-3.5 py-2.5 bg-light-gray focus:outline-none focus:border-purple"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-grey uppercase tracking-wider">Sender Bank Name</label>
                  <input
                    type="text"
                    required
                    value={paymentBank}
                    onChange={(e) => setPaymentBank(e.target.value)}
                    placeholder="E.g. HDFC Bank, GPay, ICICI"
                    className="w-full text-xs border border-bordergray rounded-xl px-3.5 py-2.5 bg-light-gray focus:outline-none focus:border-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="py-2.5 rounded-full border border-bordergray text-xs font-bold text-grey hover:bg-bg-soft transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="py-2.5 bg-purple hover:bg-dark-blue text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingPayment && <Loader2 className="animate-spin w-4 h-4" />}
                    <span>{isSubmittingPayment ? "Submitting..." : "Submit Proof"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {selectedQuoteForPreview && (
        <QuotePreviewModal
          quote={selectedQuoteForPreview}
          fileName={`${selectedQuoteForPreview.quoteId}_Estimate.png`}
          onClose={() => setSelectedQuoteForPreview(null)}
        />
      )}

    </div>
  );
};

export default ClientDashboard;
