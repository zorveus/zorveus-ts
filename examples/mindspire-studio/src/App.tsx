import React, { useState, useEffect } from "react";
import type { Model, ZorveusError } from "@zorveus/sdk";
import {
  ZorveusProvider,
  ConnectWalletButton,
  SpendCapIndicator,
  OAuthCallbackHandler,
  useZorveusInference,
  useZorveusAuth,
  useZorveusModels,
  useZorveusSpend,
  useZorveusContext
} from "@zorveus/react";

/**
 * PUBLIC MARKETING LANDING PAGE
 */
function LandingPage({ onLaunchWorkspace }: { onLaunchWorkspace: () => void }) {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ padding: "80px 20px 60px 20px", textAlign: "center", maxWidth: "1140px", margin: "0 auto" }}>
        <div className="badge-blue" style={{ display: "inline-flex", marginBottom: "24px" }}>
          Next-Generation B2B Content & SEO Platform
        </div>

        <h1
          style={{
            fontSize: "52px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "24px",
            color: "#0F172A"
          }}
        >
          Scale Your B2B Content Engine <br />
          <span style={{ background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            10x Faster with Intelligent AI
          </span>
        </h1>

        <p style={{ fontSize: "19px", color: "#475569", maxWidth: "720px", margin: "0 auto 40px auto", lineHeight: 1.6 }}>
          PulseWrite AI crafts long-form B2B articles, multi-channel social campaigns, and search-optimized meta suites tailored for your brand.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <button type="button" className="btn-blue" style={{ fontSize: "16px", padding: "14px 32px" }} onClick={onLaunchWorkspace}>
            Start Generating Free →
          </button>
          <button
            type="button"
            className="btn-slate"
            style={{ fontSize: "16px", padding: "14px 28px" }}
            onClick={onLaunchWorkspace}
          >
            Explore Platform Features
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 20px 80px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Built for B2B Growth Marketers & Content Leaders
          </h2>
          <p style={{ fontSize: "15px", color: "#64748B", marginTop: "8px" }}>
            High-impact AI tools designed to publish faster and rank higher.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Feature 1 */}
          <div className="saas-card saas-card-hover" style={{ padding: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>
              Long-Form B2B Blog Generator
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
              Draft 2,000-word authoritative B2B articles complete with H1/H2 headings, sub-sections, and key takeaway summaries.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="saas-card saas-card-hover" style={{ padding: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>
              Multi-Channel Social Builder
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
              Turn blog topics into multi-post Twitter/X threads, high-engagement LinkedIn posts, and newsletter digests.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="saas-card saas-card-hover" style={{ padding: "32px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>
              SEO & Metadata Suite
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6 }}>
              Generate search-optimized meta titles, meta descriptions under 160 characters, and target focus keyword clusters.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function getCleanErrorMessage(err: Error | ZorveusError | null): string {
  if (!err) return "";
  const msg = err.message || String(err);
  if (msg.includes("zorveus_unknown_key") || msg.includes("does not exist or has been disabled")) {
    return "This API key does not exist or has been disabled.";
  }
  if (msg.startsWith("{") || msg.startsWith("Error: {")) {
    const match = msg.match(/['"]message['"]\s*:\s*['"]([^'"]+)['"]/);
    if (match?.[1]) return match[1];
  }
  return msg;
}

function getCleanErrorCode(err: Error | ZorveusError | null): string {
  if (!err) return "unknown_error";
  if ("code" in err && (err as ZorveusError).code) {
    return (err as ZorveusError).code!;
  }
  const msg = err.message || "";
  if (msg.includes("zorveus_unknown_key")) {
    return "zorveus_unknown_key";
  }
  return "zorveus_api_error";
}

/**
 * Clean, streaming-safe Markdown parser and renderer.
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const renderInline = (text: string) => {
    // Parse **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} style={{ color: "#0F172A", fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Parse `inline code`
      const codeParts = part.split(/(`.*?`)/g);
      if (codeParts.length > 1) {
        return codeParts.map((sub, j) => {
          if (sub.startsWith("`") && sub.endsWith("`")) {
            return (
              <code
                key={j}
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#0F172A",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.9em",
                  fontFamily: "monospace"
                }}
              >
                {sub.slice(1, -1)}
              </code>
            );
          }
          return sub;
        });
      }

      return part;
    });
  };

  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              backgroundColor: "#0F172A",
              color: "#F8FAFC",
              padding: "16px 20px",
              borderRadius: "8px",
              overflowX: "auto",
              fontSize: "13px",
              fontFamily: "monospace",
              margin: "14px 0"
            }}
          >
            <code>{codeBlockContent.join("\n")}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} style={{ height: "10px" }} />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: "#0F172A",
            marginTop: "24px",
            marginBottom: "12px",
            lineHeight: 1.3
          }}
        >
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          style={{
            fontSize: "19px",
            fontWeight: 700,
            color: "#0F172A",
            marginTop: "22px",
            marginBottom: "10px",
            lineHeight: 1.35,
            borderBottom: "1px solid #F1F5F9",
            paddingBottom: "6px"
          }}
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#1E293B",
            marginTop: "16px",
            marginBottom: "8px",
            lineHeight: 1.4
          }}
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Bullet Lists (*, -, •)
    if (line.match(/^[\*\-•]\s+/)) {
      const text = line.replace(/^[\*\-•]\s+/, "");
      elements.push(
        <li
          key={`li-${i}`}
          style={{
            marginLeft: "24px",
            marginBottom: "8px",
            color: "#334155",
            fontSize: "15px",
            lineHeight: 1.7
          }}
        >
          {renderInline(text)}
        </li>
      );
      continue;
    }

    // Numbered Lists (1., 2., etc.)
    if (line.match(/^\d+\.\s+/)) {
      const text = line.replace(/^\d+\.\s+/, "");
      elements.push(
        <li
          key={`oli-${i}`}
          style={{
            marginLeft: "24px",
            marginBottom: "8px",
            color: "#334155",
            fontSize: "15px",
            lineHeight: 1.7
          }}
        >
          {renderInline(text)}
        </li>
      );
      continue;
    }

    // Blockquote (> )
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          style={{
            borderLeft: "4px solid #3B82F6",
            paddingLeft: "16px",
            margin: "14px 0",
            color: "#475569",
            fontStyle: "italic",
            fontSize: "15px"
          }}
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p
        key={`p-${i}`}
        style={{
          margin: "0 0 14px 0",
          color: "#334155",
          fontSize: "15px",
          lineHeight: 1.75
        }}
      >
        {renderInline(line)}
      </p>
    );
  }

  // Handle unclosed code block during active streaming
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre
        key="code-unclosed"
        style={{
          backgroundColor: "#0F172A",
          color: "#F8FAFC",
          padding: "16px 20px",
          borderRadius: "8px",
          overflowX: "auto",
          fontSize: "13px",
          fontFamily: "monospace",
          margin: "14px 0"
        }}
      >
        <code>{codeBlockContent.join("\n")}</code>
      </pre>
    );
  }

  return <div style={{ width: "100%" }}>{elements}</div>;
}

/**
 * PRODUCTION SAAS WORKSPACE (2-STEP CREATION WIZARD WITH ZERO-NETWORK UNAUTHENTICATED GUARD)
 */
function AppWorkspace() {
  const { isConnected, error: authError } = useZorveusAuth();
  const { gatewayBaseURL } = useZorveusContext();
  const {
    models: availableModels,
    isLoading: isModelsLoading,
    error: modelsError,
    refreshModels
  } = useZorveusModels({ routeStatus: "available" });

  const {
    remainingBalanceFormatted,
    currency,
    refresh: refreshSpend
  } = useZorveusSpend();

  const [step, setStep] = useState<"form" | "canvas">("form");
  const [activeTool, setActiveTool] = useState<"blog" | "social" | "seo">("blog");
  const [model, setModel] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Blog Form State
  const [blogTopic, setBlogTopic] = useState("Why Product-Led Growth is Replacing Traditional B2B Sales Cycles");
  const [targetAudience, setTargetAudience] = useState("B2B SaaS Founders & Product Leaders");
  const [tone, setTone] = useState("Authoritative & Data-Driven");

  // Social Form State
  const [socialTopic, setSocialTopic] = useState("5 Mistakes Early-Stage SaaS Founders Make When Scaling AI Features");
  const [channel, setChannel] = useState("Twitter / X Thread");

  // SEO Form State
  const [seoTitle, setSeoTitle] = useState("The Ultimate Guide to B2B SaaS Growth");
  const [focusKeyword, setFocusKeyword] = useState("B2B SaaS Growth");

  // Automatically select the first live model returned from Zorveus API
  useEffect(() => {
    if (availableModels && availableModels.length > 0 && !availableModels.some((m: Model) => m.id === model)) {
      setModel(availableModels[0].id);
    }
  }, [availableModels, model]);

  const buildPrompt = () => {
    if (activeTool === "blog") {
      return `Write a comprehensive, highly engaging B2B blog article about "${blogTopic}". 
Target Audience: ${targetAudience}. 
Tone of Voice: ${tone}. 
Include a compelling H1 title, an Executive Summary, 3 detailed H2 sections with actionable advice, and a concluding Key Takeaways bullet list. Use Markdown formatting.`;
    }

    if (activeTool === "social") {
      return `Create a high-performing ${channel} about "${socialTopic}". 
Format as a 5-part sequential post sequence with hook headlines, bullet points, line breaks, and a clear call-to-action at the end.`;
    }

    return `Generate an SEO & Metadata Suite for a page titled "${seoTitle}" targeting the focus keyword "${focusKeyword}".
Provide:
1. SEO Meta Title (under 60 characters)
2. SEO Meta Description (under 160 characters)
3. OpenGraph Social Share Summary
4. Top 5 Related LSI Keyword Clusters`;
  };

  const toolPrompts = {
    blog: "You are PulseWrite Blog Generator. Write authoritative, well-structured B2B articles using clear Markdown headings.",
    social: "You are PulseWrite Social Copywriter. Write engaging, high-conversion social media posts and threads.",
    seo: "You are PulseWrite SEO Architect. Produce precise SEO meta titles, meta descriptions, and keyword clusters."
  };

  const {
    messages,
    submitPrompt,
    isStreaming,
    error: inferenceError,
    abort,
    clearMessages
  } = useZorveusInference({
    model,
    systemPrompt: toolPrompts[activeTool],
    zorveusMetadata: {
      externalUserId: "usr_alex_8842",
      displayName: "Alex Creator",
      userEmail: "alex@pulsewrite.io",
      metadata: { app: "pulsewrite-ai", tool: activeTool }
    }
  });

  const latestMessage = messages.filter((m: any) => m.role === "assistant").slice(-1)[0]?.content || "";

  const handleCopy = () => {
    if (latestMessage && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(latestMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = buildPrompt();
    clearMessages();
    setStep("canvas");
    setTimeout(() => {
      void submitPrompt(promptText);
    }, 50);
  };

  const isUnauthenticated =
    (modelsError as ZorveusError)?.code === "unauthenticated" ||
    modelsError?.message?.includes("Authentication required");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
      {/* Main Studio Area */}
      <div className="saas-card" style={{ padding: "28px", display: "flex", flexDirection: "column", minHeight: "580px" }}>
        
        {/* STEP 1: CONFIGURATION FORM PAGE */}
        {step === "form" ? (
          <form onSubmit={handleStartGeneration} style={{ display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            
            {/* Header & Tool Selection */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                  Content Generation Studio
                </h2>
                <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                  Configure your topic, target audience, and AI parameters.
                </p>
              </div>

              <div style={{ display: "flex", backgroundColor: "#F1F5F9", borderRadius: "10px", padding: "4px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTool("blog")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: activeTool === "blog" ? "#2563EB" : "transparent",
                    color: activeTool === "blog" ? "#FFFFFF" : "#64748B",
                    cursor: "pointer"
                  }}
                >
                  B2B Blog Studio
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("social")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: activeTool === "social" ? "#2563EB" : "transparent",
                    color: activeTool === "social" ? "#FFFFFF" : "#64748B",
                    cursor: "pointer"
                  }}
                >
                  Social Builder
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("seo")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: activeTool === "seo" ? "#2563EB" : "transparent",
                    color: activeTool === "seo" ? "#FFFFFF" : "#64748B",
                    cursor: "pointer"
                  }}
                >
                  SEO Suite
                </button>
              </div>
            </div>

            {/* Form Fields Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
              {activeTool === "blog" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                      Blog Topic / Focus Keyword
                    </label>
                    <textarea
                      rows={3}
                      value={blogTopic}
                      onChange={(e) => setBlogTopic(e.target.value)}
                      style={{ width: "100%", fontSize: "14px", padding: "12px 16px" }}
                      placeholder="e.g. Why Product-Led Growth is Replacing Traditional B2B Sales Cycles"
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                        Target Audience
                      </label>
                      <input
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        style={{ width: "100%", fontSize: "14px", padding: "10px 14px" }}
                        placeholder="e.g. B2B SaaS Founders & Product Leaders"
                        required
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                        Tone of Voice
                      </label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        style={{ width: "100%", fontSize: "14px", padding: "10px 14px" }}
                      >
                        <option value="Authoritative & Data-Driven">Authoritative & Data-Driven</option>
                        <option value="Conversational & Engaging">Conversational & Engaging</option>
                        <option value="Technical & Detailed">Technical & Detailed</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTool === "social" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                      Campaign Topic / Main Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={socialTopic}
                      onChange={(e) => setSocialTopic(e.target.value)}
                      style={{ width: "100%", fontSize: "14px", padding: "12px 16px" }}
                      placeholder="e.g. 5 Mistakes Early-Stage SaaS Founders Make When Scaling AI Features"
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                      Target Social Channel
                    </label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      style={{ width: "100%", fontSize: "14px", padding: "10px 14px" }}
                    >
                      <option value="Twitter / X Thread">Twitter / X Thread</option>
                      <option value="LinkedIn Post">LinkedIn Post</option>
                      <option value="Newsletter Digest">Newsletter Digest</option>
                    </select>
                  </div>
                </>
              )}

              {activeTool === "seo" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                      Page Title
                    </label>
                    <input
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      style={{ width: "100%", fontSize: "14px", padding: "10px 14px" }}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "#0F172A", fontWeight: 700 }}>
                      Focus Keyword
                    </label>
                    <input
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      style={{ width: "100%", fontSize: "14px", padding: "10px 14px" }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Dynamic AI Engine Picker or Developer Fallback UI */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                {isUnauthenticated ? (
                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                        Connect AI Wallet to Select Model
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        Sign in with your Zorveus AI Wallet to access available models & inference.
                      </div>
                    </div>
                    <ConnectWalletButton size="sm" variant="default" />
                  </div>
                ) : modelsError ? (
                  <div
                    style={{
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B", fontWeight: 700, fontSize: "14px" }}>
                        <span>Failed to load Zorveus AI Models</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void refreshModels()}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "6px 14px",
                          backgroundColor: "#DC2626",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        Retry Connection
                      </button>
                    </div>

                    <div style={{ fontSize: "13px", color: "#7F1D1D", lineHeight: 1.5 }}>
                      {getCleanErrorMessage(modelsError)}
                    </div>

                    <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#991B1B", fontFamily: "monospace" }}>
                      <span>Error Code: <strong>{getCleanErrorCode(modelsError)}</strong></span>
                      <span>HTTP Status: <strong>{(modelsError as ZorveusError).status || 401}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <label style={{ fontSize: "13px", color: "#64748B", fontWeight: 700 }}>AI Engine Model:</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={isModelsLoading || availableModels.length === 0}
                        style={{ fontSize: "13px", padding: "8px 14px", minWidth: "280px" }}
                      >
                        {isModelsLoading && <option value="">Loading models from Zorveus API...</option>}
                        {!isModelsLoading && availableModels.length === 0 && (
                          <option value="">No models returned from Zorveus API</option>
                        )}
                        {availableModels.map((m: Model) => (
                          <option key={m.id} value={m.id}>
                            {m.id} {m.owned_by ? `(${m.owned_by})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                      {isModelsLoading ? "Fetching models..." : `${availableModels.length} models loaded via Zorveus API`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Primary Submit CTA */}
            <div style={{ paddingTop: "16px", borderTop: "1px solid #E2E8F0" }}>
              <button type="submit" className="btn-blue" style={{ width: "100%", fontSize: "15px", padding: "14px" }} disabled={!model}>
                Generate Content Output →
              </button>
            </div>
          </form>
        ) : (
          
          /* STEP 2: GENERATION CANVAS & STREAMING PAGE */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
            
            {/* Header Navigation & Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px" }}>
              <button
                type="button"
                className="btn-slate"
                onClick={() => setStep("form")}
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                ← Back to Form Setup
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                {latestMessage && (
                  <button
                    type="button"
                    className="btn-slate"
                    onClick={handleCopy}
                    style={{ fontSize: "13px", padding: "8px 16px", color: copied ? "#10B981" : "#1E293B" }}
                  >
                    {copied ? "Copied to Clipboard!" : "Copy Output"}
                  </button>
                )}

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={abort}
                    style={{ padding: "8px 18px", backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                  >
                    Stop Execution
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-blue"
                    onClick={() => {
                      const promptText = buildPrompt();
                      clearMessages();
                      setTimeout(() => {
                        void submitPrompt(promptText);
                      }, 50);
                    }}
                    style={{ fontSize: "13px", padding: "8px 18px" }}
                  >
                    Regenerate Content
                  </button>
                )}
              </div>
            </div>

            {/* Clean White Document Canvas */}
            <div
              style={{
                flex: 1,
                minHeight: "460px",
                maxHeight: "580px",
                overflowY: "auto",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "32px 36px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
              }}
            >
              {/* Document Header Metadata Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                  borderBottom: "1px solid #F1F5F9",
                  fontSize: "12px",
                  color: "#64748B"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "11px" }}>
                    PulseWrite Document
                  </span>
                  <span>•</span>
                  <span style={{ textTransform: "capitalize" }}>{activeTool} Studio</span>
                </div>

                {isStreaming ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563EB", fontWeight: 600 }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#2563EB",
                        display: "inline-block"
                      }}
                    />
                    Generating live draft via Zorveus Gateway ({model})...
                  </div>
                ) : (
                  <div>
                    {latestMessage ? `${latestMessage.split(/\s+/).filter(Boolean).length} words` : "Ready"}
                  </div>
                )}
              </div>

              {/* Rendered Article Content */}
              {!latestMessage && isStreaming ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "14px" }}>
                  Generating article stream...
                </div>
              ) : !latestMessage ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: "14px" }}>
                  Click "Regenerate Content" to create draft.
                </div>
              ) : (
                <MarkdownRenderer content={latestMessage} />
              )}
            </div>

            {inferenceError && (
              <div
                style={{
                  color: "#DC2626",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  fontSize: "13px"
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                  AI Gateway Inference Error: {inferenceError.message}
                </div>
                <div style={{ fontSize: "12px", color: "#991B1B" }}>
                  Check model availability and gateway configuration at {gatewayBaseURL}.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Account & Usage Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Account Connection Card */}
        <div className="saas-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
            AI Account & Billing
          </h3>
          <ConnectWalletButton variant="default" size="md" />
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "14px" }}>
            Status: <strong style={{ color: isConnected ? "#10B981" : "#64748B" }}>{isConnected ? "Connected" : "Disconnected"}</strong>
          </div>
          {authError && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "12px",
                fontSize: "12px"
              }}
            >
              <div style={{ fontWeight: 700, color: "#991B1B", marginBottom: "4px" }}>
                Authentication Error
              </div>
              <div style={{ color: "#B91C1C", lineHeight: 1.4 }}>
                {authError.message}
              </div>
            </div>
          )}
        </div>

        {/* Spend & Usage Limit Card */}
        <div className="saas-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
              Monthly Usage & Limit
            </h3>
            {isConnected && (
              <button
                type="button"
                onClick={() => void refreshSpend()}
                style={{
                  fontSize: "11px",
                  color: "#2563EB",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Refresh
              </button>
            )}
          </div>

          {!isConnected ? (
            <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>
              Connect your AI wallet to view real-time monthly usage and budget limits.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Zero-Config Auto-Powered SpendCapIndicator */}
              <SpendCapIndicator />

              {remainingBalanceFormatted !== null && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#64748B",
                    borderTop: "1px solid #F1F5F9",
                    paddingTop: "12px"
                  }}
                >
                  <span>Remaining Balance:</span>
                  <strong style={{ color: "#10B981" }}>
                    ${remainingBalanceFormatted} {currency}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ROOT APP CONTAINER
 */
export default function App(): React.JSX.Element {
  const [page, setPage] = useState<"landing" | "workspace">("landing");

  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const clientId = env.VITE_ZORVEUS_CLIENT_ID || "zrv_client_92294673f5284df3899b7eaaf43ecd82";
  const clientSecret = env.VITE_ZORVEUS_CLIENT_SECRET || undefined;
  const inferenceKey = env.VITE_ZORVEUS_INFERENCE_KEY || "";
  const apiUrl = (env.VITE_ZORVEUS_API_URL || "https://api.zorveus.com").replace(/\/+$/, "");
  const gatewayBaseURL = env.VITE_ZORVEUS_GATEWAY_URL || `${apiUrl}/v1`;

  return (
    <ZorveusProvider
      clientId={clientId}
      clientSecret={clientSecret}
      redirectUri={env.VITE_ZORVEUS_REDIRECT_URI || "http://localhost:5173/oauth/callback"}
      inferenceKey={inferenceKey}
      baseURL={apiUrl}
      gatewayBaseURL={gatewayBaseURL}
      persistToken={true}
    >
      <OAuthCallbackHandler />

      {/* SaaS Global Header */}
      <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setPage("landing")}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, fontSize: "18px" }}>
              P
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                PulseWrite AI
              </div>
              <div style={{ fontSize: "11px", color: "#64748B" }}>
                B2B Marketing & SEO Studio
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={() => setPage("landing")}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 16px",
                backgroundColor: page === "landing" ? "#F1F5F9" : "transparent",
                color: page === "landing" ? "#2563EB" : "#64748B",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Product Landing
            </button>

            <button
              type="button"
              onClick={() => setPage("workspace")}
              className="btn-blue"
              style={{ fontSize: "13px", padding: "8px 18px" }}
            >
              Open Studio Workspace →
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main>
        {page === "landing" ? (
          <LandingPage onLaunchWorkspace={() => setPage("workspace")} />
        ) : (
          <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 20px" }}>
            <AppWorkspace />
          </div>
        )}
      </main>
    </ZorveusProvider>
  );
}
