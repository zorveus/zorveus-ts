import { useState, useMemo } from "react";
import {
  ZorveusProvider,
  ConnectWalletButton,
  OAuthCallbackHandler,
  SpendCapIndicator,
  useZorveusAuth,
  useZorveusContext,
  useZorveusInference,
  useZorveusModels
} from "@zorveus/react";

// Tab navigation types
type ActiveTab = "chat" | "images" | "audio" | "models";

/**
 * Text chat generation workspace demonstrating useZorveusInference streaming.
 */
function ChatTab() {
  const { models } = useZorveusModels();
  const [selectedModel, setSelectedModel] = useState("gemini/gemini-2.5-flash-lite");

  const modelOptions = useMemo(() => {
    const defaultId = "gemini/gemini-2.5-flash-lite";
    const fetchedIds = models.map((m) => m.id);
    if (!fetchedIds.includes(defaultId)) {
      return [defaultId, ...fetchedIds];
    }
    return fetchedIds;
  }, [models]);

  const { messages, input, setInput, submitPrompt, isStreaming, error } = useZorveusInference({
    model: selectedModel,
    systemPrompt: "You are a concise, helpful AI assistant running inside a pure client-side SPA."
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    await submitPrompt();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "260px" }}>
          <label className="form-label">Model</label>
          <select
            className="form-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {modelOptions.map((modelId) => (
              <option key={modelId} value={modelId}>
                {modelId} {modelId === "gemini/gemini-2.5-flash-lite" ? "(Default)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)", paddingBottom: "8px" }}>
          {models.length > 0 ? `${models.length} gateway models loaded` : "Using default model"}
        </div>
      </div>

      <form onSubmit={handleGenerate}>
        <div className="form-group">
          <label className="form-label">Prompt</label>
          <textarea
            className="form-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or enter instructions..."
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? "Generating (Streaming)..." : "Generate Response"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>
          Error: {error.message}
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div className="form-label">Conversation</div>
          <div className="output-box">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, idx) => (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  <span style={{ fontWeight: 700, color: m.role === "user" ? "var(--accent-cyan)" : "var(--accent-blue)" }}>
                    {m.role === "user" ? "You" : "Assistant"}:
                  </span>{" "}
                  <span>{m.content}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Image generation workspace demonstrating first-class client.images.generate.
 */
function ImagesTab() {
  const { client } = useZorveusContext();
  const [prompt, setPrompt] = useState("A minimalist geometric logo for an AI technology company, neon blue on dark background");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!client || !prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await client.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024"
      });

      if (res.data?.[0]?.url) {
        setImageUrl(res.data[0].url);
      } else if (res.data?.[0]?.b64_json) {
        setImageUrl(`data:image/png;base64,${res.data[0].b64_json}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="form-group">
        <label className="form-label">Image Prompt</label>
        <textarea
          className="form-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
        />
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleGenerateImage}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? "Synthesizing Image..." : "Generate Image (client.images.generate)"}
      </button>

      {error && (
        <div style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>
          Error: {error}
        </div>
      )}

      {imageUrl && (
        <div style={{ marginTop: "24px" }}>
          <div className="form-label">Generated Output</div>
          <div style={{ borderRadius: "12px", overflow: "hidden", maxWidth: "480px", border: "1px solid var(--border-subtle)" }}>
            <img src={imageUrl} alt="Generated output" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Audio voice synthesis workspace demonstrating first-class client.audio.speech.
 */
function AudioTab() {
  const { client } = useZorveusContext();
  const [input, setInput] = useState("Hello! This audio is synthesized using Zorveus first-class audio speech SDK methods directly inside your browser.");
  const [voice, setVoice] = useState("alloy");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSynthesizeAudio = async () => {
    if (!client || !input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await client.audio.speech({
        model: "tts-1",
        voice,
        input
      });

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "16px", marginBottom: "16px" }}>
        <div className="form-group">
          <label className="form-label">Voice Text</label>
          <input
            className="form-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Text to speak..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Voice</label>
          <select className="form-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="alloy">Alloy</option>
            <option value="echo">Echo</option>
            <option value="fable">Fable</option>
            <option value="onyx">Onyx</option>
            <option value="nova">Nova</option>
            <option value="shimmer">Shimmer</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleSynthesizeAudio}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? "Synthesizing Voice..." : "Synthesize Voice (client.audio.speech)"}
      </button>

      {error && (
        <div style={{ color: "#ef4444", marginTop: "12px", fontSize: "14px" }}>
          Error: {error}
        </div>
      )}

      {audioUrl && (
        <div style={{ marginTop: "24px" }}>
          <div className="form-label">Audio Playback</div>
          <audio controls src={audioUrl} style={{ width: "100%", maxWidth: "480px" }} />
        </div>
      )}
    </div>
  );
}

/**
 * Models status browser demonstrating useZorveusModels.
 */
function ModelsTab() {
  const { models, isLoading, error } = useZorveusModels();

  if (isLoading) {
    return <div style={{ color: "var(--text-secondary)" }}>Loading available models...</div>;
  }

  if (error) {
    return <div style={{ color: "#ef4444" }}>Failed to load models: {error.message}</div>;
  }

  return (
    <div>
      <div className="form-label" style={{ marginBottom: "12px" }}>Available Gateway Models ({models.length})</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
        {models.map((m) => (
          <div
            key={m.id}
            style={{
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)"
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>{m.id}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Owned by: {m.owned_by}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main application workspace.
 */
function MainApp() {
  const { isConnected, disconnect } = useZorveusAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [authMode, setAuthMode] = useState<"popup" | "redirect">("popup");

  const isCallback = typeof window !== "undefined" && window.location.pathname.includes("/oauth/callback");

  if (isCallback) {
    return <OAuthCallbackHandler redirectTo="/" />;
  }

  return (
    <div className="container">
      {/* App Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">N</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="brand-title">Nexus AI</span>
              <span className="badge-pkce">Client-Only PKCE</span>
            </div>
            <span className="brand-tagline">Pure Single-Page Application (No Backend Required)</span>
          </div>
        </div>

        <div>
          {isConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={disconnect}
                style={{
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                value={authMode}
                onChange={(e) => setAuthMode(e.target.value as "popup" | "redirect")}
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontSize: "12px"
                }}
              >
                <option value="popup">Mode: Popup Window</option>
                <option value="redirect">Mode: SPA Redirect</option>
              </select>

              <ConnectWalletButton authMode={authMode} variant="dark" size="md">
                Connect AI Wallet
              </ConnectWalletButton>
            </div>
          )}
        </div>
      </header>

      {/* Info Banner */}
      <div className="info-banner">
        <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>Zero Client Secret:</div>
        <div>
          This app runs 100% in your browser. It uses standard RFC 7636 PKCE (code verifier and challenge)
          to authenticate directly with Zorveus without exposing confidential secrets or requiring a backend exchange server.
        </div>
      </div>

      {!isConnected ? (
        <div className="card hero">
          <h1 className="hero-title">
            Authenticate Securely with <span className="hero-gradient">Just Client ID</span>
          </h1>
          <p className="hero-desc">
            Connect your Zorveus AI Wallet to access LLM chat completions, image synthesis,
            and voice streaming with zero backend proxy routes.
          </p>

          <div style={{ display: "inline-block" }}>
            <ConnectWalletButton authMode={authMode} variant="default" size="lg">
              Connect AI Wallet (PKCE)
            </ConnectWalletButton>
          </div>
        </div>
      ) : (
        <div>
          {/* Live Spend Indicator Card */}
          <div style={{ marginBottom: "24px" }}>
            <SpendCapIndicator theme="dark" />
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Text Generation
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "images" ? "active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              Image Synthesis
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "audio" ? "active" : ""}`}
              onClick={() => setActiveTab("audio")}
            >
              Voice Synthesis
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "models" ? "active" : ""}`}
              onClick={() => setActiveTab("models")}
            >
              Available Models
            </button>
          </div>

          {/* Tab Content */}
          <div className="card">
            {activeTab === "chat" && <ChatTab />}
            {activeTab === "images" && <ImagesTab />}
            {activeTab === "audio" && <AudioTab />}
            {activeTab === "models" && <ModelsTab />}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Root Application wrapping with ZorveusProvider.
 * Note: Only clientId is passed. NO clientSecret!
 */
export default function App() {
  const env = ((import.meta as unknown as { env?: Record<string, string> }).env) || {};
  const clientId = env.VITE_ZORVEUS_CLIENT_ID || "zrv_client_df14dec1fab84ef0b8cda655da162515";
  const apiUrl = (env.VITE_ZORVEUS_API_URL || "http://localhost:8000").replace(/\/+$/, "");
  const gatewayUrl = (env.VITE_ZORVEUS_GATEWAY_URL || "http://localhost:4000/v1").replace(/\/+$/, "");
  const redirectUri = env.VITE_ZORVEUS_REDIRECT_URI || "http://localhost:5175/oauth/callback";

  return (
    <ZorveusProvider
      clientId={clientId}
      redirectUri={redirectUri}
      baseURL={apiUrl}
      gatewayBaseURL={gatewayUrl}
      persistToken={true}
    >
      <MainApp />
    </ZorveusProvider>
  );
}
