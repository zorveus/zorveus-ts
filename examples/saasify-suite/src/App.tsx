import React, { useState, useRef } from "react";
import {
  Zorveus,
  ZorveusServiceClient,
  type ProductUserResponse,
  type ProductUserCreditGrantResponse
} from "@zorveus/sdk";
import initialCandidates from "./data/candidates.json";

// ==========================================
// 1. CLEAN SVG ICON LIBRARY (ZERO EMOJIS)
// ==========================================

function FileTextIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SparklesIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function SearchIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UsersIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CreditCardIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function CopyIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SettingsIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PlusIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function RefreshIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

// ==========================================
// 2. CANDIDATE ACCOUNT TYPES & INTERFACES
// ==========================================

export interface CandidateAccount {
  id: string;
  name: string;
  email: string;
  tier: "Starter" | "Pro" | "Executive";
  baseCap: number;
  spentMonth: number;
  extraGrants: number;
  apiKey: string;
  status: "Active" | "Suspended";
  tokensUsed: number;
}



// ==========================================
// 3. STREAMING MARKDOWN RENDERER
// ==========================================

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginTop: "18px", marginBottom: "8px", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>
          {line.replace(/^#\s+/, "")}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B", marginTop: "14px", marginBottom: "6px" }}>
          {line.replace(/^##\s+/, "")}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} style={{ fontSize: "14px", fontWeight: 600, color: "#334155", marginTop: "10px", marginBottom: "4px" }}>
          {line.replace(/^###\s+/, "")}
        </h3>
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} style={{ marginLeft: "18px", marginBottom: "4px", color: "#334155", lineHeight: 1.6 }}>
          {renderFormattedInline(line.replace(/^[-*]\s+/, ""))}
        </li>
      );
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "8px" }} />);
      continue;
    }

    elements.push(
      <p key={i} style={{ marginBottom: "8px", color: "#334155", lineHeight: 1.7 }}>
        {renderFormattedInline(line)}
      </p>
    );
  }

  return <div>{elements}</div>;
}

function renderFormattedInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} style={{ fontWeight: 600, color: "#0F172A" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} style={{ backgroundColor: "#F1F5F9", color: "#0F172A", padding: "2px 5px", borderRadius: "4px", fontSize: "12px", border: "1px solid #E2E8F0" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ==========================================
// 4. MARKETING LANDING PAGE
// ==========================================

function LandingPage({
  onLaunchStudio,
  onSignIn,
  onOpenAdmin
}: {
  onLaunchStudio: () => void;
  onSignIn: () => void;
  onOpenAdmin: () => void;
}) {
  return (
    <div>
      {/* Top Header */}
      <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}>
              R
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
              ResumeCraft
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button type="button" onClick={onOpenAdmin} className="btn-secondary" style={{ fontSize: "12px", padding: "7px 12px" }}>
              <SettingsIcon size={14} /> Admin Portal
            </button>
            <button type="button" onClick={onSignIn} className="btn-secondary" style={{ fontSize: "12px", padding: "7px 12px" }}>
              Sign In
            </button>
            <button type="button" onClick={onLaunchStudio} className="btn-primary" style={{ fontSize: "12px", padding: "7px 14px" }}>
              Launch Studio <ArrowRightIcon size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "72px 20px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#475569", fontWeight: 600, marginBottom: "20px" }}>
          <span className="live-dot" /> Zorveus AI Infrastructure Architecture
        </div>

        <h1 style={{ fontSize: "40px", fontWeight: 800, color: "#0F172A", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "16px" }}>
          AI Career Document & Resume Studio
        </h1>
        <p style={{ fontSize: "17px", color: "#64748B", maxWidth: "600px", margin: "0 auto 32px", lineHeight: 1.6 }}>
          Generate tailored cover letters, refine resume bullet points with quantified metrics, and analyze ATS job keyword matches.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button type="button" onClick={onLaunchStudio} className="btn-primary" style={{ padding: "11px 22px", fontSize: "14px" }}>
            Start Generation <ArrowRightIcon size={14} />
          </button>
          <button type="button" onClick={onOpenAdmin} className="btn-secondary" style={{ padding: "11px 20px", fontSize: "14px" }}>
            Startup Admin View
          </button>
        </div>
      </section>

      {/* Pricing & AI Tier Allocations */}
      <section style={{ maxWidth: "1040px", margin: "0 auto", padding: "20px 20px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>Starter Plan</div>
            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>For active job applicants</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", margin: "14px 0 4px" }}>$10<span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/mo</span></div>
            <div className="badge-neutral" style={{ marginBottom: "18px" }}>$10.00 Monthly AI Allowance</div>
            <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, marginBottom: "22px", paddingLeft: "16px" }}>
              <li>50 Cover Letter Drafts</li>
              <li>Resume Action Bullets</li>
              <li>Standard ATS Matcher</li>
            </ul>
            <button type="button" onClick={onSignIn} className="btn-secondary" style={{ width: "100%" }}>Select Starter</button>
          </div>

          <div className="card" style={{ padding: "24px", border: "2px solid #0F172A" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>Pro Career Plan</div>
              <span className="badge-neutral" style={{ backgroundColor: "#0F172A", color: "#FFFFFF", border: "none" }}>Popular</span>
            </div>
            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>For senior professionals</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", margin: "14px 0 4px" }}>$50<span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/mo</span></div>
            <div className="badge-neutral" style={{ marginBottom: "18px" }}>$50.00 Monthly AI Allowance</div>
            <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, marginBottom: "22px", paddingLeft: "16px" }}>
              <li>Unlimited Cover Letters</li>
              <li>Executive Resume Rewrites</li>
              <li>Deep ATS Keyword Optimizer</li>
              <li>Instant Bonus Grant Eligible</li>
            </ul>
            <button type="button" onClick={onLaunchStudio} className="btn-primary" style={{ width: "100%" }}>Launch Pro Studio</button>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>Executive Tier</div>
            <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>For leadership & directors</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", margin: "14px 0 4px" }}>$250<span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B" }}>/mo</span></div>
            <div className="badge-emerald" style={{ marginBottom: "18px" }}>$250.00 Monthly AI Allowance</div>
            <ul style={{ fontSize: "13px", color: "#475569", lineHeight: 1.7, marginBottom: "22px", paddingLeft: "16px" }}>
              <li>Dedicated Model Routing</li>
              <li>Board Bios & C-Suite CVs</li>
              <li>Personal Career Strategist Co-Pilot</li>
            </ul>
            <button type="button" onClick={onSignIn} className="btn-secondary" style={{ width: "100%" }}>Select Executive</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// 5. SIGN IN / CANDIDATE SETUP
// ==========================================

function SignInPage({
  candidate,
  onSaveCandidate,
  onBack,
  directoryUsers
}: {
  candidate: CandidateAccount;
  onSaveCandidate: (account: CandidateAccount) => void;
  onBack: () => void;
  directoryUsers: CandidateAccount[];
}) {
  const [name, setName] = useState(candidate.name);
  const [email, setEmail] = useState(candidate.email);
  const [tier, setTier] = useState<"Starter" | "Pro" | "Executive">(candidate.tier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capMap = { Starter: 10.0, Pro: 50.0, Executive: 250.0 };
    const keyMap = { Starter: "zrv_live_free_key_10", Pro: "zrv_live_pro_key_50", Executive: "zrv_live_ent_key_500" };
    const id = `usr_${email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_")}`;

    onSaveCandidate({
      id,
      name,
      email,
      tier,
      baseCap: capMap[tier],
      spentMonth: candidate.spentMonth || 0,
      extraGrants: candidate.extraGrants || 0,
      apiKey: keyMap[tier],
      status: "Active",
      tokensUsed: candidate.tokensUsed || 0
    });
  };

  const handleSelectPreset = (preset: CandidateAccount) => {
    setName(preset.name);
    setEmail(preset.email);
    setTier(preset.tier);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#0F172A", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>
            R
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>Sign In to ResumeCraft</h1>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>Candidate Studio & AI Career Account</p>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: "14px", display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
          {directoryUsers.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                backgroundColor: email === p.email ? "#0F172A" : "#FFFFFF",
                border: email === p.email ? "1px solid #0F172A" : "1px solid #CBD5E1",
                borderRadius: "5px",
                color: email === p.email ? "#FFFFFF" : "#475569",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {p.name.split(" ")[0]} ({p.tier})
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%" }} placeholder="Sarah Jenkins" />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} placeholder="sara@gmail.com" />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Plan Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value as any)} style={{ width: "100%" }}>
                <option value="Starter">Starter Plan ($10.00/mo allowance)</option>
                <option value="Pro">Pro Career Plan ($50.00/mo allowance)</option>
                <option value="Executive">Executive Tier ($250.00/mo allowance)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "4px", padding: "10px" }}>
              Continue to Candidate Studio <ArrowRightIcon size={14} />
            </button>

            <button type="button" onClick={onBack} className="btn-secondary" style={{ width: "100%" }}>
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. DEDICATED USER DETAIL PAGE (/users/:id)
// ==========================================

function UserDetailPage({
  user,
  appId,
  backendUser,
  creditGrants,
  isLoadingUser,
  isLoadingGrants,
  error,
  onRetry,
  onCreateInBackend,
  onBack,
  onLogInAsUser,
  onOpenGrantModal
}: {
  user: CandidateAccount;
  appId: string;
  backendUser: ProductUserResponse | null;
  creditGrants: ProductUserCreditGrantResponse[];
  isLoadingUser: boolean;
  isLoadingGrants: boolean;
  error: string | null;
  onRetry: () => void;
  onCreateInBackend: () => void;
  onBack: () => void;
  onLogInAsUser: () => void;
  onOpenGrantModal: () => void;
}) {
  // Read exact numbers strictly from the live backendUser response when available
  const availableCredits = backendUser?.credits?.available_credits
    ? parseFloat(backendUser.credits.available_credits)
    : (backendUser ? 0 : null);

  const spentThisMonth = backendUser?.credits?.spent_this_month
    ? parseFloat(backendUser.credits.spent_this_month)
    : (backendUser ? 0 : null);

  const grantCount = backendUser?.credits?.active_grant_count ?? creditGrants.length;
  const tokensUsed = user.tokensUsed || 0;

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeftIcon size={14} /> Back to Directory
          </button>
          <div style={{ fontSize: "13px", color: "#64748B" }}>
            Startup Admin / Candidates / <span style={{ fontWeight: 700, color: "#0F172A" }}>{user.name}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoadingUser}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <RefreshIcon size={13} /> {isLoadingUser ? "Syncing..." : "Sync with Zorveus"}
          </button>
          <button
            type="button"
            onClick={onOpenGrantModal}
            className="btn-secondary"
            style={{ fontSize: "13px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <CreditCardIcon size={14} /> Grant Credits
          </button>
          <button
            type="button"
            onClick={onLogInAsUser}
            className="btn-primary"
            style={{ fontSize: "13px", padding: "8px 16px" }}
          >
            Log In as {user.name.split(" ")[0]} in Studio <ArrowRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* User Header Profile Card */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A" }}>{user.name}</h1>
                <span className={backendUser?.status === "active" ? "badge-emerald" : "badge-neutral"}>
                  {backendUser ? backendUser.status.toUpperCase() : "SYNCING"}
                </span>
                <span className="badge-neutral">{user.tier} Plan</span>
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isLoadingUser}
                  style={{
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    borderRadius: "5px",
                    padding: "3px 8px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "#334155",
                    fontWeight: 600,
                    marginLeft: "4px"
                  }}
                  title="Refetch live user details from Zorveus backend"
                >
                  <RefreshIcon size={12} /> {isLoadingUser ? "Syncing..." : "Refresh Details"}
                </button>
              </div>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                Email: <strong style={{ color: "#0F172A" }}>{user.email}</strong> · External ID: <code style={{ color: "#0F172A", fontWeight: 600 }}>{user.id}</code> · App: <code>{appId}</code>
              </div>
              {backendUser?.product_end_user_id && (
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                  Zorveus Product User ID: <code style={{ color: "#0F172A" }}>{backendUser.product_end_user_id}</code>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#64748B" }}>Available Credit Balance (Live)</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
              {availableCredits !== null ? `+$${availableCredits.toFixed(2)} USD` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* REAL API ERROR ALERT (ZERO SILENT FALLBACKS) */}
      {error && (
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", padding: "16px 20px", borderRadius: "8px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#991B1B" }}>
                Zorveus Backend API Response:
              </div>
              <div style={{ fontSize: "13px", color: "#B91C1C", marginTop: "4px", fontFamily: "monospace" }}>
                {error}
              </div>
              <div style={{ fontSize: "12px", color: "#7F1D1D", marginTop: "8px" }}>
                Queried: <code>PUT /product-users/by-external-id (App: {appId}, User: {user.id})</code>
              </div>
            </div>

            <button
              type="button"
              onClick={onCreateInBackend}
              className="btn-primary"
              style={{ fontSize: "12px", padding: "8px 14px", whiteSpace: "nowrap" }}
            >
              + Create / Upsert in Zorveus Now
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingUser && (
        <div className="card" style={{ padding: "30px", textAlign: "center", marginBottom: "24px", color: "#64748B" }}>
          <span className="live-dot" style={{ display: "inline-block", marginRight: "8px" }} />
          Syncing with Zorveus backend for <code>{user.id}</code> in app <code>{appId}</code>...
        </div>
      )}

      {/* 4-Metric Product User Stats Grid (Only Displays Live Backend Data) */}
      {!isLoadingUser && !error && backendUser && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div className="card" style={{ padding: "18px", backgroundColor: "#F8FAFC" }}>
            <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600 }}>Available Credit Grants</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
              {availableCredits !== null ? `+$${availableCredits.toFixed(2)}` : "+$0.00"}
            </div>
            <div style={{ fontSize: "11px", color: "#047857", marginTop: "4px" }}>Active Bonus Grants</div>
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Spent this Month</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {spentThisMonth !== null ? `$${spentThisMonth.toFixed(2)}` : "$0.00"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Settled Credit Usage</div>
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Active Credit Grants</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {grantCount} {grantCount === 1 ? "Grant" : "Grants"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Promotional Grants</div>
          </div>

          <div className="card" style={{ padding: "18px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Tokens Processed</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#475569", marginTop: "4px" }}>
              {tokensUsed.toLocaleString()} Tokens
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Candidate AI Generations</div>
          </div>
        </div>
      )}

      {/* Credit Grants Summary & Persistent Backend Credit Grants Ledger */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 440px", gap: "24px", alignItems: "start" }}>
        {/* Credit Management Overview */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                Candidate Promotional Credits (`productUsers.grantCredit`)
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                Issue bonus credits to unlock additional document generations beyond monthly base caps.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenGrantModal}
              className="btn-primary"
              style={{ fontSize: "13px", padding: "8px 14px", whiteSpace: "nowrap" }}
            >
              <PlusIcon size={14} /> Grant Credits
            </button>
          </div>

          <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>Total Active Grants in Zorveus</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                {availableCredits !== null ? `+$${availableCredits.toFixed(2)} USD` : "—"}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenGrantModal}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Issue New Grant →
            </button>
          </div>
        </div>

        {/* Real Backend Credit Grants Ledger (Queried via GET /product-users/{id}/credit-grants) */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
              <CreditCardIcon size={14} /> Credit Grants Ledger
            </div>
            <span className="badge-neutral" style={{ fontSize: "11px" }}>
              {creditGrants.length} {creditGrants.length === 1 ? "Grant" : "Grants"}
            </span>
          </div>

          {isLoadingGrants ? (
            <div style={{ color: "#94A3B8", fontSize: "12px", textAlign: "center", padding: "30px 0" }}>
              <span className="live-dot" style={{ display: "inline-block", marginRight: "6px" }} />
              Loading persistent grants from Zorveus...
            </div>
          ) : creditGrants.length === 0 ? (
            <div style={{ color: "#94A3B8", fontSize: "12px", textAlign: "center", padding: "30px 0", lineHeight: 1.6 }}>
              No credit grants have been issued for this user in Zorveus yet.<br />
              Click <strong>"Grant Credits"</strong> to issue bonus allowance.
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {creditGrants.map((grant) => (
                <div
                  key={grant.credit_grant_id}
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#059669", fontSize: "13px" }}>
                      +${parseFloat(grant.amount || "0").toFixed(2)} {grant.currency || "USD"}
                    </span>
                    <span
                      className={grant.status === "active" ? "badge-emerald" : "badge-neutral"}
                      style={{ fontSize: "10px", textTransform: "uppercase" }}
                    >
                      {grant.status}
                    </span>
                  </div>

                  <div style={{ color: "#334155", fontSize: "12px", fontWeight: 500 }}>
                    {grant.reason || "Candidate Bonus Grant"}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "11px", color: "#94A3B8" }}>
                    <code>{grant.credit_grant_id.slice(0, 16)}...</code>
                    <span>
                      {grant.created_at
                        ? new Date(grant.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Active"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ==========================================
// 7. CREDIT GRANT MODAL DIALOG
// ==========================================

function CreditGrantModal({
  user,
  amount,
  setAmount,
  reason,
  setReason,
  onConfirm,
  onClose,
  isLoading,
  error
}: {
  user: CandidateAccount;
  amount: string;
  setAmount: (val: string) => void;
  reason: string;
  setReason: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
  error?: string | null;
}) {
  const presets = ["10.00", "25.00", "50.00", "100.00"];

  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>Issue Credit Grant</h3>
            <p style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
              Target: <strong style={{ color: "#0F172A" }}>{user.name}</strong> ({user.email})
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
            <XIcon size={16} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", padding: "10px 12px", borderRadius: "6px", color: "#991B1B", fontSize: "12px", marginBottom: "14px" }}>
            <strong>Grant API Error:</strong> {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Quick Preset Buttons */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
              Quick Presets
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: amount === p ? "#0F172A" : "#FFFFFF",
                    color: amount === p ? "#FFFFFF" : "#334155",
                    border: amount === p ? "1px solid #0F172A" : "1px solid #CBD5E1"
                  }}
                >
                  +${p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
              Grant Amount (USD)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: "100%", fontSize: "14px", fontWeight: 600 }}
              placeholder="25.00"
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
              Reason / Audit Note
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{ width: "100%", fontSize: "13px" }}
              placeholder="e.g. Welcome Bonus Grant"
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <button
              type="submit"
              disabled={isLoading || !amount}
              className="btn-primary"
              style={{ flex: 1, padding: "10px", fontSize: "13px" }}
            >
              {isLoading ? "Granting..." : `Confirm & Issue $${parseFloat(amount || "0").toFixed(2)} Grant →`}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 16px" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 8. MAIN APPLICATION CONTROLLER
// ==========================================

export default function App(): React.JSX.Element {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const appId = env.VITE_ZORVEUS_APP_ID || "resumecraft";

  const [page, setPage] = useState<"landing" | "signin" | "studio" | "admin" | "user-detail">("landing");
  const [users, setUsers] = useState<CandidateAccount[]>(initialCandidates as CandidateAccount[]);
  const [activeCandidateId, setActiveCandidateId] = useState<string>("usr_sara_101");
  const [inspectedUserId, setInspectedUserId] = useState<string>("usr_sara_101");
  const [activeTool, setActiveTool] = useState<"cover_letter" | "bullets" | "ats">("cover_letter");

  // Live Backend User Inspection State
  const [backendUser, setBackendUser] = useState<ProductUserResponse | null>(null);
  const [creditGrants, setCreditGrants] = useState<ProductUserCreditGrantResponse[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingGrants, setIsLoadingGrants] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Cover Letter Form
  const [targetRole, setTargetRole] = useState("Staff Frontend Engineer");
  const [targetCompany, setTargetCompany] = useState("Stripe");
  const [experienceHighlights, setExperienceHighlights] = useState("7 years building design systems, React/TypeScript architecture, and low-latency financial SDKs.");

  // Resume Bullets Form
  const [draftBullets, setDraftBullets] = useState("Built customer checkout flow. Improved site load time by 40%. Mentored 4 engineers.");

  // ATS Matcher Form
  const [jobDescription, setJobDescription] = useState("Seeking a Lead Engineer experienced in TypeScript, Distributed AI Gateways, REST/GraphQL APIs, and high-volume billing systems.");

  // Generation & Streaming State
  const [generatedContent, setGeneratedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Startup Admin State
  const serviceKey = env.VITE_ZORVEUS_SERVICE_KEY || "zrv_svc_0XBIefjN4IszcAl8VHfE0RslaYzobxFVUt3O7Qv0K5I";
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");

  // Credit Grant Modal State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTargetUser, setGrantTargetUser] = useState<CandidateAccount | null>(null);
  const [grantAmount, setGrantAmount] = useState("25.00");
  const [grantReason, setGrantReason] = useState("Candidate Career Grant");
  const [grantModalError, setGrantModalError] = useState<string | null>(null);

  // Onboard User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserTier, setNewUserTier] = useState<"Starter" | "Pro" | "Executive">("Pro");

  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminStatusMessage, setAdminStatusMessage] = useState<string | null>(null);

  const activeCandidate = users.find((u) => u.id === activeCandidateId) || users[0];
  const inspectedUser = users.find((u) => u.id === inspectedUserId) || users[0];

  const getServiceClient = () => {
    const baseURL = env.VITE_ZORVEUS_API_URL || "http://localhost:8000";
    return new ZorveusServiceClient({
      apiKey: serviceKey,
      baseURL
    });
  };

  // Real Streaming Generation using Zorveus Gateway
  const handleStartGeneration = async () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    setGeneratedContent("");
    setWordCount(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const apiUrl = env.VITE_ZORVEUS_API_URL || "http://localhost:8000";
    const gatewayBaseURL = env.VITE_ZORVEUS_GATEWAY_URL || `${apiUrl}/v1`;

    let promptText = "";
    if (activeTool === "cover_letter") {
      promptText = `Please draft a high-converting, professional, tailored cover letter for:
Candidate Name: ${activeCandidate.name}
Candidate Email: ${activeCandidate.email}
Target Role: ${targetRole}
Target Company: ${targetCompany}
Experience & Strengths: ${experienceHighlights}

Format cleanly in Markdown with greeting, 3 paragraphs, and sign-off.`;
    } else if (activeTool === "bullets") {
      promptText = `Rewrite the following draft resume bullet points using strong action verbs, quantifiable metrics, and the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"):
Draft Bullets:
${draftBullets}

Format each refined bullet cleanly in Markdown.`;
    } else {
      promptText = `Analyze the candidate profile against this target job description:
Candidate Background: ${experienceHighlights}
Job Description:
${jobDescription}

Provide:
1. **ATS Match Score & Overview**
2. **Top Matching Strengths**
3. **Missing Keywords & Actionable Recommendations**`;
    }

    try {
      const client = new Zorveus({
        apiKey: activeCandidate.apiKey,
        baseURL: apiUrl,
        gatewayBaseURL
      });

      const stream = await client.chat.completions.create({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are an executive resume writer and career strategist. Output cleanly formatted Markdown." },
          { role: "user", content: promptText }
        ],
        stream: true
      });

      let accumulated = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        accumulated += delta;
        setGeneratedContent(accumulated);
        setWordCount(accumulated.trim().split(/\s+/).filter(Boolean).length);
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      const errorMsg = err instanceof Error ? err.message : String(err);
      setGeneratedContent(`**Generation Error**: ${errorMsg}\n\n*Please ensure the local Zorveus backend is active on port 8000.*`);
    } finally {
      setIsStreaming(false);
    }
  };

  // Open User Detail Page and Upsert/Fetch Profile via createOrUpdate
  const handleOpenUserDetail = async (user: CandidateAccount) => {
    setInspectedUserId(user.id);
    setPage("user-detail");
    setBackendUser(null);
    setCreditGrants([]);
    setUserError(null);
    setIsLoadingUser(true);
    setIsLoadingGrants(true);

    try {
      const service = getServiceClient();
      const res = await service.productUsers.createOrUpdate({
        appId,
        externalUserId: user.id,
        displayName: user.name,
        email: user.email,
        metadata: { tier: user.tier, app: appId }
      });

      const userRes = res.product_user;
      setBackendUser(userRes);

      // Console log the full backend response for debugging inspection
      console.log(
        "%c[Zorveus SDK] Product User Full Response:",
        "color: #059669; font-weight: bold; font-size: 13px;",
        res
      );
      console.log("[Zorveus SDK] Product User Object:", userRes);
      console.log("[Zorveus SDK] Raw JSON:\n" + JSON.stringify(res, null, 2));

      // Fetch persistent credit grants list directly from Zorveus backend
      if (userRes.product_end_user_id) {
        try {
          const grantsRes = await service.productUsers.listCreditGrants(userRes.product_end_user_id);
          console.log(
            "%c[Zorveus SDK] Credit Grants Ledger Response:",
            "color: #2563EB; font-weight: bold; font-size: 13px;",
            grantsRes
          );
          setCreditGrants(grantsRes.credit_grants || []);
        } catch (grantErr) {
          console.warn("[Zorveus SDK] Failed to load credit grants:", grantErr);
          setCreditGrants([]);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[Zorveus SDK] createOrUpdate Product User Error:", err);
      setUserError(errorMsg);
    } finally {
      setIsLoadingUser(false);
      setIsLoadingGrants(false);
    }
  };

  // Explicitly Create / Provision Inspected User in Backend
  const handleProvisionInspectedUser = async () => {
    if (!inspectedUser) return;
    setIsAdminLoading(true);
    setUserError(null);
    try {
      const service = getServiceClient();
      await service.productUsers.createOrUpdate({
        externalUserId: inspectedUser.id,
        displayName: inspectedUser.name,
        email: inspectedUser.email,
        metadata: { tier: inspectedUser.tier, app: appId }
      });

      setAdminStatusMessage(`User "${inspectedUser.name}" provisioned in Zorveus!`);

      // Refetch live user profile and grants from backend
      await handleOpenUserDetail(inspectedUser);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setUserError(`Provisioning failed: ${errorMsg}`);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Open Grant Credit Modal Dialog
  const handleOpenGrantDialog = (user: CandidateAccount) => {
    setGrantTargetUser(user);
    setGrantAmount("25.00");
    setGrantReason("Candidate Career Grant");
    setGrantModalError(null);
    setShowGrantModal(true);
  };

  // Submit Credit Grant via grantCredit SDK method
  const handleConfirmGrantCredits = async () => {
    const target = grantTargetUser || inspectedUser;
    if (!target) return;

    setIsAdminLoading(true);
    setGrantModalError(null);
    setAdminStatusMessage(null);
    try {
      const service = getServiceClient();
      const targetId = backendUser?.product_end_user_id || target.id;

      await service.productUsers.grantCredit(targetId, {
        appId,
        amount: grantAmount,
        reason: grantReason
      });

      const grantedNumber = parseFloat(grantAmount || "0");
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, extraGrants: u.extraGrants + grantedNumber } : u))
      );

      setAdminStatusMessage(`Successfully issued $${parseFloat(grantAmount).toFixed(2)} grant to ${target.name}!`);
      setShowGrantModal(false);

      // If viewing this user's details, refresh their live profile and persistent grants ledger
      if (page === "user-detail" && inspectedUserId === target.id) {
        await handleOpenUserDetail(target);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setGrantModalError(errorMsg);
      setAdminStatusMessage(`Credit grant error: ${errorMsg}`);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Admin Onboard New User via createOrUpdate SDK method
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const capMap = { Starter: 10.0, Pro: 50.0, Executive: 250.0 };
    const keyMap = { Starter: "zrv_live_free_key_10", Pro: "zrv_live_pro_key_50", Executive: "zrv_live_ent_key_500" };
    const newId = `usr_${newUserEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_")}`;

    const newAccount: CandidateAccount = {
      id: newId,
      name: newUserName,
      email: newUserEmail,
      tier: newUserTier,
      baseCap: capMap[newUserTier],
      spentMonth: 0,
      extraGrants: 0,
      apiKey: keyMap[newUserTier],
      status: "Active",
      tokensUsed: 0
    };

    try {
      const service = getServiceClient();
      await service.productUsers.createOrUpdate({
        externalUserId: newId,
        displayName: newUserName,
        email: newUserEmail,
        metadata: { tier: newUserTier, app: appId }
      });

      setUsers((prev) => [newAccount, ...prev]);
      setShowAddUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setAdminStatusMessage(`User "${newUserName}" registered in Zorveus successfully!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setAdminStatusMessage(`Onboarding error: ${errorMsg}`);
    }
  };

  const handleCopy = () => {
    if (generatedContent && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter Directory Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "All" || u.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  if (page === "landing") {
    return (
      <LandingPage
        onLaunchStudio={() => setPage("studio")}
        onSignIn={() => setPage("signin")}
        onOpenAdmin={() => setPage("admin")}
      />
    );
  }

  if (page === "signin") {
    return (
      <SignInPage
        candidate={activeCandidate}
        directoryUsers={users}
        onSaveCandidate={(updated) => {
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === updated.id);
            return exists ? prev.map((u) => (u.id === updated.id ? updated : u)) : [updated, ...prev];
          });
          setActiveCandidateId(updated.id);
          setPage("studio");
        }}
        onBack={() => setPage("landing")}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", color: "#0F172A" }}>
      {/* Top Universal App Header */}
      <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 700, fontSize: "14px" }}>
              R
            </div>
            <div>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                ResumeCraft
              </span>
              <span style={{ fontSize: "11px", color: page === "admin" || page === "user-detail" ? "#0F172A" : "#64748B", fontWeight: 600, marginLeft: "8px" }}>
                {page === "admin" || page === "user-detail" ? "STARTUP CONTROL PLANE" : "CANDIDATE STUDIO"}
              </span>
            </div>
          </div>

          {/* Center Tabs */}
          <div style={{ display: "flex", backgroundColor: "#F1F5F9", padding: "3px", borderRadius: "7px", gap: "3px" }}>
            <button
              type="button"
              onClick={() => setPage("studio")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "5px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: page === "studio" ? "#FFFFFF" : "transparent",
                color: page === "studio" ? "#0F172A" : "#64748B",
                boxShadow: page === "studio" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <FileTextIcon size={14} /> Candidate Studio
            </button>
            <button
              type="button"
              onClick={() => setPage("admin")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "5px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: page === "admin" || page === "user-detail" ? "#FFFFFF" : "transparent",
                color: page === "admin" || page === "user-detail" ? "#0F172A" : "#64748B",
                boxShadow: page === "admin" || page === "user-detail" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
              }}
            >
              <SettingsIcon size={14} /> Startup Admin
            </button>
          </div>

          {/* Right Account Pill */}
          <button
            type="button"
            onClick={() => setPage("signin")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#0F172A", color: "#FFFFFF", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeCandidate.name.charAt(0)}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
              {activeCandidate.email}
            </span>
            <span className="badge-neutral" style={{ fontSize: "10px", padding: "1px 5px" }}>{activeCandidate.tier}</span>
          </button>
        </div>
      </header>

      {/* VIEW 1: CANDIDATE STUDIO */}
      {page === "studio" && (
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
          {/* Top Bar */}
          <div className="card" style={{ padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Active Candidate</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                {activeCandidate.name} <span style={{ fontSize: "12px", fontWeight: 400, color: "#64748B" }}>({activeCandidate.email})</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#64748B" }}>Available Promotional Credits</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: activeCandidate.extraGrants > 0 ? "#059669" : "#0F172A" }}>
                  {activeCandidate.extraGrants > 0 ? `+$${activeCandidate.extraGrants.toFixed(2)} USD` : "$0.00 USD"}
                </div>
              </div>
              <span className="badge-blue">{activeCandidate.tier} Plan</span>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "20px", alignItems: "start" }}>
            {/* Tool Selection & Form */}
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", backgroundColor: "#F1F5F9", padding: "3px", borderRadius: "6px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTool("cover_letter")}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: activeTool === "cover_letter" ? "#FFFFFF" : "transparent",
                    color: activeTool === "cover_letter" ? "#0F172A" : "#64748B",
                    boxShadow: activeTool === "cover_letter" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  <FileTextIcon size={12} /> Cover Letter
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool("bullets")}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: activeTool === "bullets" ? "#FFFFFF" : "transparent",
                    color: activeTool === "bullets" ? "#0F172A" : "#64748B",
                    boxShadow: activeTool === "bullets" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  <SparklesIcon size={12} /> Bullets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool("ats")}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: activeTool === "ats" ? "#FFFFFF" : "transparent",
                    color: activeTool === "ats" ? "#0F172A" : "#64748B",
                    boxShadow: activeTool === "ats" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  <SearchIcon size={12} /> ATS Match
                </button>
              </div>

              {/* Form 1: Cover Letter */}
              {activeTool === "cover_letter" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Target Role</label>
                    <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} style={{ width: "100%" }} placeholder="Staff Frontend Engineer" />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Target Company</label>
                    <input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} style={{ width: "100%" }} placeholder="Stripe" />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Key Experience & Strengths</label>
                    <textarea rows={4} value={experienceHighlights} onChange={(e) => setExperienceHighlights(e.target.value)} style={{ width: "100%", fontSize: "13px" }} />
                  </div>
                </div>
              )}

              {/* Form 2: Bullets */}
              {activeTool === "bullets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Draft Experience Bullets</label>
                    <textarea rows={6} value={draftBullets} onChange={(e) => setDraftBullets(e.target.value)} style={{ width: "100%", fontSize: "13px" }} placeholder="Paste draft bullet points..." />
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748B", lineHeight: 1.5 }}>
                    Refines drafts into Google XYZ quantified impact statements.
                  </p>
                </div>
              )}

              {/* Form 3: ATS Match */}
              {activeTool === "ats" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Job Description</label>
                    <textarea rows={5} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} style={{ width: "100%", fontSize: "13px" }} placeholder="Paste job requirements..." />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Candidate Skills & Experience</label>
                    <textarea rows={3} value={experienceHighlights} onChange={(e) => setExperienceHighlights(e.target.value)} style={{ width: "100%", fontSize: "13px" }} />
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={handleStartGeneration}
                style={{ width: "100%", padding: "10px", fontSize: "13px" }}
              >
                {isStreaming ? "Stop Generation" : (
                  <>
                    <SparklesIcon size={14} /> Generate {activeTool === "cover_letter" ? "Cover Letter" : activeTool === "bullets" ? "Refined Bullets" : "ATS Analysis"}
                  </>
                )}
              </button>

              <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", padding: "8px 10px", borderRadius: "6px", fontSize: "11px", color: "#64748B" }}>
                Attributed User: <code style={{ color: "#0F172A", fontWeight: 600 }}>{activeCandidate.id}</code>
              </div>
            </div>

            {/* Document Sheet Canvas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Document Canvas</span>
                  {isStreaming && (
                    <span className="badge-neutral" style={{ fontSize: "11px" }}>
                      <span className="live-dot" /> Streaming
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {wordCount > 0 && <span style={{ fontSize: "12px", color: "#64748B" }}>{wordCount} words</span>}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-secondary"
                    disabled={!generatedContent}
                    style={{ fontSize: "12px", padding: "5px 10px" }}
                  >
                    {copied ? <><CheckIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy Document</>}
                  </button>
                </div>
              </div>

              <div className="document-sheet">
                {!generatedContent && !isStreaming ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "380px", textAlign: "center", color: "#94A3B8" }}>
                    <FileTextIcon size={32} color="#CBD5E1" />
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginTop: "10px" }}>Document Canvas Ready</div>
                    <p style={{ fontSize: "12px", maxWidth: "320px", marginTop: "4px" }}>
                      Configure the parameters on the left and click generate to stream the document in real time.
                    </p>
                  </div>
                ) : (
                  <MarkdownRenderer content={generatedContent} />
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: DEDICATED USER DETAIL PAGE (/users/:id) */}
      {page === "user-detail" && (
        <UserDetailPage
          user={inspectedUser}
          appId={appId}
          backendUser={backendUser}
          creditGrants={creditGrants}
          isLoadingUser={isLoadingUser}
          isLoadingGrants={isLoadingGrants}
          error={userError}
          onRetry={() => handleOpenUserDetail(inspectedUser)}
          onCreateInBackend={handleProvisionInspectedUser}
          onBack={() => setPage("admin")}
          onLogInAsUser={() => {
            setActiveCandidateId(inspectedUser.id);
            setPage("studio");
          }}
          onOpenGrantModal={() => handleOpenGrantDialog(inspectedUser)}
        />
      )}

      {/* VIEW 3: STARTUP ADMIN PORTAL (USER DIRECTORY TABLE) */}
      {page === "admin" && (
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
          {/* Org & Control Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>STARTUP CONTROL PLANE</div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>ResumeCraft User Directory & Cap Management</h1>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span className="badge-neutral">App ID: {appId}</span>
              <span className="badge-emerald">
                <span className="live-dot" /> Zorveus Live
              </span>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Active Service Key</span>
                <SettingsIcon size={14} color="#94A3B8" />
              </div>
              <div style={{ fontSize: "14px", fontFamily: "monospace", color: "#0F172A", fontWeight: 600, marginTop: "8px" }}>
                {serviceKey.slice(0, 18)}...
              </div>
              <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>Control Plane Access Active</div>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Total Registered Users</span>
                <UsersIcon size={14} color="#94A3B8" />
              </div>
              <div style={{ fontSize: "20px", color: "#0F172A", fontWeight: 800, marginTop: "4px" }}>
                {users.length} Candidates
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Across Starter, Pro, and Executive Tiers</div>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Total Issued Grants</span>
                <CreditCardIcon size={14} color="#94A3B8" />
              </div>
              <div style={{ fontSize: "20px", color: "#0F172A", fontWeight: 800, marginTop: "4px" }}>
                ${users.reduce((acc, u) => acc + u.extraGrants, 0).toFixed(2)} USD
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>Active Promotional & Bonus Credits</div>
            </div>
          </div>

          {/* Status Alert Message */}
          {adminStatusMessage && (
            <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #CBD5E1", padding: "10px 14px", borderRadius: "8px", color: "#0F172A", fontSize: "13px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{adminStatusMessage}</span>
              <button type="button" onClick={() => setAdminStatusMessage(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {/* User Directory Table Section */}
          <div className="card" style={{ overflow: "hidden", marginBottom: "24px" }}>
            {/* Table Action Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ position: "relative" }}>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate, email, or ID..."
                    style={{ paddingLeft: "30px", width: "260px", fontSize: "13px" }}
                  />
                  <div style={{ position: "absolute", left: "10px", top: "10px", color: "#94A3B8" }}>
                    <SearchIcon size={13} />
                  </div>
                </div>

                <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} style={{ fontSize: "13px" }}>
                  <option value="All">All Plans</option>
                  <option value="Starter">Starter Plan</option>
                  <option value="Pro">Pro Career Plan</option>
                  <option value="Executive">Executive Tier</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="btn-primary"
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                <PlusIcon size={14} /> Onboard New User
              </button>
            </div>

            {/* Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate / Email</th>
                  <th>External ID</th>
                  <th>Plan Tier</th>
                  <th>Available Credits</th>
                  <th>Spent this Month</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#94A3B8" }}>
                      No product users match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isStudioActive = activeCandidate.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        onClick={() => handleOpenUserDetail(u)}
                        className="clickable-row"
                      >
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: 700, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0" }}>
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0F172A" }}>
                                {u.name} {isStudioActive && <span className="badge-blue" style={{ fontSize: "10px", padding: "1px 4px", marginLeft: "4px" }}>Active in Studio</span>}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748B" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: "12px", color: "#0F172A" }}>{u.id}</code>
                        </td>
                        <td>
                          <span className={u.tier === "Executive" ? "badge-purple" : u.tier === "Pro" ? "badge-blue" : "badge-neutral"}>
                            {u.tier}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: u.extraGrants > 0 ? "#059669" : "#64748B" }}>
                            ${u.extraGrants.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "#475569" }}>${u.spentMonth.toFixed(2)}</span>
                        </td>
                        <td>
                          <span className="badge-emerald" style={{ fontSize: "10px" }}>{u.status}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenGrantDialog(u)}
                              className="btn-secondary"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              Grant +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenUserDetail(u)}
                              className="btn-secondary"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                            >
                              View Details →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Onboard User Modal */}
          {showAddUserModal && (
            <div className="modal-overlay">
              <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>Onboard New Product User</h3>
                  <button type="button" onClick={() => setShowAddUserModal(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                    <XIcon size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Full Name</label>
                    <input
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      style={{ width: "100%" }}
                      placeholder="e.g. Alex Morgan"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Email Address</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      style={{ width: "100%" }}
                      placeholder="alex@example.com"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Plan Tier & Cap</label>
                    <select value={newUserTier} onChange={(e) => setNewUserTier(e.target.value as any)} style={{ width: "100%" }}>
                      <option value="Starter">Starter Plan ($10.00/mo allowance)</option>
                      <option value="Pro">Pro Career Plan ($50.00/mo allowance)</option>
                      <option value="Executive">Executive Tier ($250.00/mo allowance)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                      Register User in Zorveus
                    </button>
                    <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Credit Grant Modal Dialog */}
          {showGrantModal && grantTargetUser && (
            <CreditGrantModal
              user={grantTargetUser}
              amount={grantAmount}
              setAmount={setGrantAmount}
              reason={grantReason}
              setReason={setGrantReason}
              onConfirm={handleConfirmGrantCredits}
              onClose={() => setShowGrantModal(false)}
              isLoading={isAdminLoading}
              error={grantModalError}
            />
          )}
        </main>
      )}

      {/* Credit Grant Modal when on user-detail page */}
      {showGrantModal && page === "user-detail" && grantTargetUser && (
        <CreditGrantModal
          user={grantTargetUser}
          amount={grantAmount}
          setAmount={setGrantAmount}
          reason={grantReason}
          setReason={setGrantReason}
          onConfirm={handleConfirmGrantCredits}
          onClose={() => setShowGrantModal(false)}
          isLoading={isAdminLoading}
          error={grantModalError}
        />
      )}
    </div>
  );
}
