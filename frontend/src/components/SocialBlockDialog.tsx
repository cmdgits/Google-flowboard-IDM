import { useEffect, useRef, useState } from "react";
import { useSocialBlockStore } from "../store/socialBlock";
import { useBoardStore, type FlowboardNodeData } from "../store/board";

const PLATFORM_LIST = ["facebook", "tiktok", "youtube", "instagram"] as const;

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "f",
  tiktok: "♪",
  youtube: "▶",
  instagram: "📷",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  tiktok: "#000000",
  youtube: "#FF0000",
  instagram: "#E4405F",
};

/** Collect text context from all blocks connected to the target social block. */
function collectLinkedContext(rfId: string): string {
  const { nodes, edges } = useBoardStore.getState();
  const texts: string[] = [];

  for (const edge of edges) {
    const connectedNodeId =
      edge.target === rfId ? edge.source :
      edge.source === rfId ? edge.target :
      null;
    if (!connectedNodeId) continue;

    const node = nodes.find((n) => n.id === connectedNodeId);
    if (!node) continue;

    const d = node.data as FlowboardNodeData;

    if (d.type === "prompt" || d.type === "note") {
      const text = (d.prompt || d.title || "").trim();
      if (text) texts.push(text);
    } else if (d.aiBrief) {
      texts.push(d.aiBrief as string);
    } else if (d.title) {
      texts.push(d.title);
    }
  }

  return texts.join(". ");
}

export function SocialBlockDialog() {
  const openRfId = useSocialBlockStore((s) => s.openRfId);
  const close = useSocialBlockStore((s) => s.closeSocialBlockDialog);
  const nodes = useBoardStore((s) => s.nodes);

  const node = nodes.find((n) => n.id === openRfId);
  const data = node?.data as FlowboardNodeData | undefined;

  // Form state
  const [prompt, setPrompt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [generating, setGenerating] = useState(false);
  const [autoPromptUsed, setAutoPromptUsed] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (!openRfId || !data) return;

    setPlatforms(Array.isArray(data.platforms) ? (data.platforms as string[]) : []);
    setPrompt((data.content as string) || "");
    setScheduledTime((data.scheduled_time as string) || "");
    setGenerating(false);
    setAutoPromptUsed(false);

    setTimeout(() => textareaRef.current?.focus(), 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRfId]);

  // ESC to close, Ctrl+Enter to generate
  useEffect(() => {
    if (!openRfId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  if (!openRfId || !data) return null;

  const handlePlatformToggle = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Build context from linked blocks
      const linkedContext = collectLinkedContext(openRfId);
      const contextStr = linkedContext
        ? `Based on this content: "${linkedContext}". `
        : "";
      const platformStr = platforms.length > 0
        ? platforms.join(", ")
        : "social media";

      const aiPrompt = prompt.trim()
        ? `${contextStr}Using this direction: "${prompt.trim()}". Generate a creative and engaging social media caption for posting to ${platformStr}. Keep it concise, use relevant emojis, and include a call to action.`
        : `${contextStr}Generate a creative and engaging social media caption for posting to ${platformStr}. Keep it concise, use relevant emojis, and include a call to action.`;

      const response = await fetch("/api/llm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, maxTokens: 300 }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const result = await response.json();
      const content = result.text || result.content;

      if (content) {
        setPrompt(content);
        setAutoPromptUsed(true);
      }
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    useBoardStore.getState().updateNodeData(openRfId, {
      platforms,
      content: prompt,
      content_type: autoPromptUsed ? "ai_generated" : "manual",
      scheduled_time: scheduledTime || undefined,
    });
    close();
  };

  // Count linked blocks
  const edges = useBoardStore.getState().edges;
  const linkedBlockCount = edges.filter(
    (e) => e.target === openRfId || e.source === openRfId
  ).length;

  return (
    <div
      className="gen-dialog-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="gen-dialog"
        role="dialog"
        aria-labelledby="social-dialog-title"
        aria-modal="true"
        ref={dialogRef}
      >
        {/* ── Header ── */}
        <div className="gen-dialog__header">
          <div>
            <h2 id="social-dialog-title" className="gen-dialog__title">
              Social Post
            </h2>
            <span className="gen-dialog__subtitle">
              Node #{data.shortId}
              {linkedBlockCount > 0 && (
                <span style={{ marginLeft: 8, color: "var(--accent)" }}>
                  · {linkedBlockCount} linked block{linkedBlockCount > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
          <button
            className="gen-dialog__close"
            onClick={close}
            aria-label="Close dialog (Escape)"
          >
            esc
          </button>
        </div>

        {/* ── Prompt (same position as GenerationDialog) ── */}
        <div className="gen-dialog__field">
          <div className="gen-dialog__label-row">
            <label className="gen-dialog__label" htmlFor="social-prompt">
              Prompt
              {autoPromptUsed && (
                <span className="gen-dialog__auto-badge" title="Generated by AI">
                  ✨ auto
                </span>
              )}
            </label>
            <span className="gen-dialog__char-count">{prompt.length}/2000</span>
          </div>
          <textarea
            id="social-prompt"
            ref={textareaRef}
            className="gen-dialog__textarea"
            rows={5}
            maxLength={2000}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (autoPromptUsed) setAutoPromptUsed(false);
            }}
            placeholder={
              linkedBlockCount > 0
                ? "Bỏ trống để tự generate từ linked blocks ✨"
                : "Nhập nội dung bài đăng hoặc bấm Generate để AI tạo ✨"
            }
            disabled={generating}
          />
        </div>

        {/* ── Platforms (replaces Aspect Ratio section) ── */}
        <div className="gen-dialog__field">
          <label className="gen-dialog__label">Platforms</label>
          <div className="social-dialog__platforms">
            {PLATFORM_LIST.map((p) => {
              const active = platforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`social-dialog__platform-chip${active ? " social-dialog__platform-chip--active" : ""}`}
                  onClick={() => handlePlatformToggle(p)}
                  style={active ? { borderColor: PLATFORM_COLORS[p], background: `${PLATFORM_COLORS[p]}22` } : undefined}
                >
                  <span
                    className="social-dialog__platform-icon"
                    style={{ backgroundColor: PLATFORM_COLORS[p] }}
                  >
                    {PLATFORM_ICONS[p]}
                  </span>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Schedule (replaces Variants section) ── */}
        <div className="gen-dialog__field">
          <label className="gen-dialog__label">Schedule</label>
          <input
            type="datetime-local"
            className="gen-dialog__textarea"
            style={{
              padding: "8px 12px",
              fontSize: 13,
              height: "auto",
              minHeight: "unset",
            }}
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
          {scheduledTime && (
            <button
              type="button"
              className="social-dialog__regen-btn"
              onClick={() => setScheduledTime("")}
              style={{ marginTop: 4 }}
            >
              ✕ Clear schedule
            </button>
          )}
        </div>

        {/* ── Footer with Generate + Save (same layout as GenerationDialog) ── */}
        <div className="social-dialog__footer">
          <span className="gen-dialog__subtitle" style={{ flex: 1, alignSelf: "center" }}>
            {data.title} · {nodes.length} nodes
          </span>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--cancel"
            onClick={handleSave}
          >
            💾 Save
          </button>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--save"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "⏳ Generating…" : "Generate ⌘↵"}
          </button>
        </div>
      </div>
    </div>
  );
}
