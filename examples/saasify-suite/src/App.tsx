import React, { useState } from "react";
import { ZorveusServiceClient } from "@zorveus/sdk";

// User Persona Definition for SaaSify Startup Suite
interface UserPersona {
  id: string;
  name: string;
  email: string;
  tier: "Free" | "Pro" | "Enterprise";
  baseCap: number;
  apiKey: string;
  extraGrants: number;
  avatarColor: string;
}

const DEMO_PERSONAS: UserPersona[] = [
  {
    id: "usr_alice_8842",
    name: "Alice Rivera",
    email: "alice@acme.com",
    tier: "Pro",
    baseCap: 50.0,
    apiKey: "zrv_live_pro_key_50",
    extraGrants: 0.0,
    avatarColor: "#4DFFB4"
  },
  {
    id: "usr_bob_1024",
    name: "Bob Smith",
    email: "bob@startup.io",
    tier: "Free",
    baseCap: 10.0,
    apiKey: "zrv_live_free_key_10",
    extraGrants: 0.0,
    avatarColor: "#FFA04D"
  },
  {
    id: "usr_charlie_9901",
    name: "Charlie Zhang",
    email: "charlie@enterprise.org",
    tier: "Enterprise",
    baseCap: 500.0,
    apiKey: "zrv_live_ent_key_500",
    extraGrants: 100.0,
    avatarColor: "#818CF8"
  }
];

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  payload: unknown;
}

/**
 * SAASIFY AI WORKFLOW SUITE (Startup Managed Users & Tier Keys)
 */
export default function App(): React.JSX.Element {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

  const [activePersona, setActivePersona] = useState<UserPersona>(DEMO_PERSONAS[0]);
  const [serviceKey, setServiceKey] = useState(
    env.VITE_ZORVEUS_SERVICE_KEY || "zrv_svc_live_demo_9981"
  );
  const [tierKeys, setTierKeys] = useState({
    Free: env.VITE_ZORVEUS_FREE_KEY || "zrv_live_free_key_10",
    Pro: env.VITE_ZORVEUS_PRO_KEY || "zrv_live_pro_key_50",
    Enterprise: env.VITE_ZORVEUS_ENTERPRISE_KEY || "zrv_live_ent_key_500"
  });

  const [prompt, setPrompt] = useState("Generate an empathetic refund resolution email for an item delayed in shipping.");
  const [grantAmount, setGrantAmount] = useState("25.00");
  const [grantReason, setGrantReason] = useState("Customer Satisfaction Bonus Grant");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (action: string, details: string, payload: unknown) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      payload
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const getServiceClient = () => {
    const baseURL = env.VITE_ZORVEUS_API_URL || "https://api.zorveus.com";
    return new ZorveusServiceClient({
      apiKey: serviceKey,
      baseURL
    });
  };

  const handleGrantCredits = async () => {
    setIsLoading(true);
    try {
      const service = getServiceClient();
      const res = await service.productUsers.grantCredit(activePersona.id, {
        appId: "saasify_workflow_app",
        amount: grantAmount,
        reason: grantReason
      });

      const numAmount = parseFloat(grantAmount);
      setActivePersona((prev) => ({
        ...prev,
        extraGrants: prev.extraGrants + numAmount
      }));

      addLog(
        "GRANT_PRODUCT_CREDITS",
        `Granted $${grantAmount} extra credits to user ${activePersona.name} (${activePersona.id})`,
        res
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog("GRANT_CREDITS_FAILED", errorMsg, { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);
    try {
      const service = getServiceClient();
      const res = await service.productUsers.createOrUpdate({
        externalUserId: activePersona.id,
        displayName: activePersona.name,
        email: activePersona.email,
        metadata: { tier: activePersona.tier, registered_via: "saasify_app" }
      });
      addLog("UPSERT_PRODUCT_USER", `Registered user "${activePersona.id}" in Zorveus`, res);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog("UPSERT_USER_FAILED", errorMsg, { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const totalEffectiveLimit = activePersona.baseCap + activePersona.extraGrants;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07090E" }}>
      {/* Header */}
      <header style={{ backgroundColor: "rgba(12, 16, 25, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid #6366F1", display: "flex", alignItems: "center", justifyContent: "center", color: "#818CF8", fontWeight: 800, fontSize: "18px" }}>
              S
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#F3F4F6", letterSpacing: "-0.02em" }}>
                SaaSify AI Workflow Suite
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                Startup Managed Users & Tier Keys Model
              </div>
            </div>
          </div>

          <span className="badge-indigo">Standalone App 2 (Port 5174)</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Persona Switcher Bar */}
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#F3F4F6" }}>
                Simulated Customer Login Persona
              </h2>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                Select a customer persona to simulate tier-specific inference keys & spend limits.
              </p>
            </div>

            {/* Persona Badges */}
            <div style={{ display: "flex", gap: "12px" }}>
              {DEMO_PERSONAS.map((p) => {
                const isSelected = activePersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePersona(p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 14px",
                      backgroundColor: isSelected ? "#182232" : "transparent",
                      border: isSelected ? `2px solid ${p.avatarColor}` : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 150ms ease"
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: p.avatarColor,
                        color: "#07090E",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px"
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: isSelected ? "#F3F4F6" : "#9CA3AF" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "10px", color: p.avatarColor, fontWeight: 700 }}>
                        {p.tier} Tier (${p.baseCap}/mo)
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Suite Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
          {/* Left Column: SaaSify AI Tool Surface */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#F3F4F6" }}>
                  SaaSify AI Email & Support Generator
                </h3>
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                  Active Account: <strong style={{ color: activePersona.avatarColor }}>{activePersona.name} ({activePersona.email})</strong>
                </p>
              </div>

              <span className="badge-indigo">{activePersona.tier} Tier Key</span>
            </div>

            {/* Active Limits & Credit Grants Display */}
            <div style={{ backgroundColor: "#07090E", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                <span style={{ color: "#9CA3AF" }}>Tier Key Base Limit:</span>
                <span style={{ fontFamily: "monospace", color: "#F3F4F6", fontWeight: 600 }}>${activePersona.baseCap.toFixed(2)}/mo</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "8px" }}>
                <span style={{ color: "#9CA3AF" }}>Startup Credit Grants Boost:</span>
                <span style={{ fontFamily: "monospace", color: "#4DFFB4", fontWeight: 700 }}>+${activePersona.extraGrants.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ color: "#F3F4F6", fontWeight: 700 }}>Total Effective Limit:</span>
                <span style={{ fontFamily: "monospace", color: "#818CF8", fontWeight: 800 }}>${totalEffectiveLimit.toFixed(2)}/mo</span>
              </div>
            </div>

            {/* Generator Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", color: "#9CA3AF" }}>Generation Prompt:</label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ width: "100%", fontSize: "13px", resize: "vertical" }}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                addLog(
                  "GENERATE_AI_WORKFLOW",
                  `Generated AI response for ${activePersona.name} using ${activePersona.tier} tier key`,
                  {
                    user_id: activePersona.id,
                    tier: activePersona.tier,
                    key_used: activePersona.apiKey,
                    base_cap: activePersona.baseCap,
                    extra_grants: activePersona.extraGrants,
                    effective_limit: totalEffectiveLimit
                  }
                );
              }}
            >
              Run SaaSify AI Workflow →
            </button>

            {/* Payload visualizer */}
            <div style={{ backgroundColor: "#07090E", padding: "12px", borderRadius: "8px", fontSize: "11px", color: "#6B7280" }}>
              Automated Gateway Metadata Envelope:{" "}
              <code style={{ color: "#818CF8" }}>{`{ metadata: { external_user_id: "${activePersona.id}", product_user: { display_name: "${activePersona.name}", email: "${activePersona.email}" } } }`}</code>
            </div>
          </div>

          {/* Right Column: Startup Control Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Credit Grants Form */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#4DFFB4", marginBottom: "10px" }}>
                Grant Extra User Credits (`ZorveusServiceClient`)
              </h3>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "14px" }}>
                Issue a credit grant to allow <strong style={{ color: "#F3F4F6" }}>{activePersona.name}</strong> to exceed their key's base limit.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                    Grant Amount (USD Decimal String):
                  </label>
                  <input
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    style={{ width: "100%", fontSize: "12px" }}
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                    Reason:
                  </label>
                  <input
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGrantCredits}
                  disabled={isLoading}
                  style={{ marginTop: "4px", padding: "10px" }}
                >
                  Grant ${grantAmount} Credits to {activePersona.name}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCreateUser}
                  disabled={isLoading}
                  style={{ fontSize: "12px", padding: "8px" }}
                >
                  Register/Upsert Product User
                </button>
              </div>
            </div>

            {/* Tier Keys Configuration Inspector */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#F3F4F6", marginBottom: "10px" }}>
                Organization Service Key & Tier Keys
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                    Service Key (`ZorveusServiceClient`):
                  </label>
                  <input
                    value={serviceKey}
                    onChange={(e) => setServiceKey(e.target.value)}
                    style={{ width: "100%", fontSize: "11px", fontFamily: "monospace" }}
                    placeholder="zrv_svc_..."
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#FFA04D" }}>Free Tier Key ($10/mo):</span>
                  <input
                    value={tierKeys.Free}
                    onChange={(e) => setTierKeys((prev) => ({ ...prev, Free: e.target.value }))}
                    style={{ width: "160px", fontSize: "11px", fontFamily: "monospace", padding: "4px 8px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#4DFFB4" }}>Pro Tier Key ($50/mo):</span>
                  <input
                    value={tierKeys.Pro}
                    onChange={(e) => setTierKeys((prev) => ({ ...prev, Pro: e.target.value }))}
                    style={{ width: "160px", fontSize: "11px", fontFamily: "monospace", padding: "4px 8px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#818CF8" }}>Enterprise Key ($500/mo):</span>
                  <input
                    value={tierKeys.Enterprise}
                    onChange={(e) => setTierKeys((prev) => ({ ...prev, Enterprise: e.target.value }))}
                    style={{ width: "160px", fontSize: "11px", fontFamily: "monospace", padding: "4px 8px" }}
                  />
                </div>
              </div>
            </div>

            {/* Response Inspector */}
            <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", maxHeight: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#F3F4F6" }}>
                  Control Plane Log Inspector
                </h4>
                {logs.length > 0 && (
                  <button type="button" onClick={() => setLogs([])} style={{ fontSize: "10px", background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: "12px" }}>
                  Perform an action to inspect API logs.
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {logs.map((log) => (
                    <div key={log.id} style={{ backgroundColor: "#07090E", padding: "8px", borderRadius: "6px", fontSize: "11px" }}>
                      <div style={{ color: "#818CF8", fontWeight: 700 }}>{log.action}</div>
                      <div style={{ color: "#9CA3AF", fontSize: "10px" }}>{log.details}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
