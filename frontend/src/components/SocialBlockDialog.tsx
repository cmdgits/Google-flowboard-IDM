import { useEffect, useRef, useState } from "react";
import { useSocialBlockStore } from "../store/socialBlock";
import { useBoardStore, type FlowboardNodeData } from "../store/board";
import { mediaUrl } from "../api/client";

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

/** Collect content from all blocks connected to the target social block. */
function collectLinkedContent(rfId: string): {
  texts: string[];
  mediaIds: string[];
  summary: string;
} {
  const { nodes, edges } = useBoardStore.getState();
  const texts: string[] = [];
  const mediaIds: string[] = [];

  for (const edge of edges) {
    const connectedNodeId =
      edge.target === rfId ? edge.source :
      edge.source === rfId ? edge.target :
      null;
    if (!connectedNodeId) continue;

    const node = nodes.find((n) => n.id === connectedNodeId);
    if (!node) continue;

    const d = node.data as FlowboardNodeData;

    // Collect text content
    if (d.type === "prompt" || d.type === "note") {
      const text = (d.prompt || d.title || "").trim();
      if (text) texts.push(text);
    } else if (d.title) {
      texts.push(d.title);
    }

    // Collect media
    if (d.mediaId) {
      mediaIds.push(d.mediaId);
    }
  }

  const summary = texts.length > 0
    ? texts.join(" | ")
    : "No linked content found";

  return { texts, mediaIds, summary };
}

export function SocialBlockDialog() {
  const openRfId = useSocialBlockStore((s) => s.openRfId);
  const close = useSocialBlockStore((s) => s.closeSocialBlockDialog);
  const nodes = useBoardStore((s) => s.nodes);
  const edges = useBoardStore((s) => s.edges);

  const node = nodes.find((n) => n.id === openRfId);
  const data = node?.data as FlowboardNodeData | undefined;

  // Form state
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [contentSource, setContentSource] = useState<"manual" | "linked" | "ai">("manual");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Linked content
  const [linkedContent, setLinkedContent] = useState<ReturnType<typeof collectLinkedContent>>({
    texts: [], mediaIds: [], summary: "",
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if there are linked blocks
  const hasLinks = openRfId
    ? edges.some((e) => e.target === openRfId || e.source === openRfId)
    : false;

  // Reset form state when dialog opens
  useEffect(() => {
    if (!openRfId || !data) return;

    setPlatforms(Array.isArray(data.platforms) ? (data.platforms as string[]) : []);
    setContent((data.content as string) || "");
    setContentSource((data.content_type as "manual" | "linked" | "ai") || "manual");
    setAiGenerating(false);

    const linked = collectLinkedContent(openRfId);
    setLinkedContent(linked);

    // If there are linked blocks and no existing content, auto-select "linked"
    if (linked.texts.length > 0 && !data.content) {
      setContentSource("linked");
      setContent(linked.texts.join("\n\n"));
    }

    setTimeout(() => textareaRef.current?.focus(), 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRfId]);

  // ESC to close, Ctrl+Enter to save
  useEffect(() => {
    if (!openRfId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSave(); }
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

  const handleContentSourceChange = (source: "manual" | "linked" | "ai") => {
    setContentSource(source);
    if (source === "linked") {
      const linked = collectLinkedContent(openRfId);
      setLinkedContent(linked);
      setContent(linked.texts.join("\n\n"));
    } else if (source === "manual") {
      // Keep current content so user can edit
    }
    // AI mode: user clicks Gen AI button
  };

  const handleGenAI = async () => {
    setAiGenerating(true);
    try {
      // Build context from linked blocks
      const linked = collectLinkedContent(openRfId);
      const context = linked.texts.length > 0
        ? `Based on this content: "${linked.texts.join(". ")}". `
        : "";
      const platformStr = platforms.length > 0
        ? platforms.join(", ")
        : "social media";

      const prompt = `${context}Generate a creative and engaging social media caption for posting to ${platformStr}. Keep it concise, use relevant emojis, and include a call to action.`;

      const response = await fetch("/api/llm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens: 300 }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const result = await response.json();
      const generatedContent = result.text || result.content;

      if (generatedContent) {
        setContent(generatedContent);
        setContentSource("ai");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      // Use a toast-like inline error instead of alert
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = () => {
    useBoardStore.getState().updateNodeData(openRfId, {
      platforms,
      content,
      content_type: contentSource,
    });
    close();
  };

  // Count linked blocks
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
        style={{ maxWidth: 560 }}
      >
        {/* ── Header ── */}
        <div className="gen-dialog__header">
          <div>
            <h2 id="social-dialog-title" className="gen-dialog__title">
              📱 Configure Social Block
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

        {/* ── Platform Selector ── */}
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

        {/* ── Content Source ── */}
        <div className="gen-dialog__field">
          <label className="gen-dialog__label">Content source</label>
          <div className="social-dialog__source-tabs">
            <button
              type="button"
              className={`social-dialog__tab${contentSource === "manual" ? " social-dialog__tab--active" : ""}`}
              onClick={() => handleContentSourceChange("manual")}
            >
              ✏️ Manual
            </button>
            <button
              type="button"
              className={`social-dialog__tab${contentSource === "linked" ? " social-dialog__tab--active" : ""}`}
              onClick={() => handleContentSourceChange("linked")}
              disabled={!hasLinks}
              title={!hasLinks ? "Connect blocks to this node first" : "Use content from linked blocks"}
            >
              📎 From Linked Blocks
              {linkedBlockCount > 0 && (
                <span className="social-dialog__tab-badge">{linkedBlockCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`social-dialog__tab${contentSource === "ai" ? " social-dialog__tab--active" : ""}`}
              onClick={() => { handleContentSourceChange("ai"); handleGenAI(); }}
              disabled={aiGenerating}
            >
              {aiGenerating ? "⏳ Generating…" : "🤖 Gen AI"}
            </button>
          </div>
        </div>

        {/* ── Linked Content Preview (when source=linked) ── */}
        {contentSource === "linked" && linkedContent.mediaIds.length > 0 && (
          <div className="gen-dialog__field">
            <label className="gen-dialog__label">Linked media</label>
            <div className="social-dialog__linked-media">
              {linkedContent.mediaIds.slice(0, 4).map((mid) => (
                <img
                  key={mid}
                  src={mediaUrl(mid)}
                  alt="Linked media"
                  className="social-dialog__linked-thumb"
                />
              ))}
              {linkedContent.mediaIds.length > 4 && (
                <span className="social-dialog__more-badge">
                  +{linkedContent.mediaIds.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Content Editor ── */}
        <div className="gen-dialog__field">
          <div className="gen-dialog__label-row">
            <label className="gen-dialog__label" htmlFor="social-content">
              Post Content
              {contentSource === "ai" && (
                <span className="gen-dialog__auto-badge" title="Generated by AI">
                  ✨ AI
                </span>
              )}
              {contentSource === "linked" && (
                <span className="gen-dialog__auto-badge" title="From linked blocks">
                  📎 linked
                </span>
              )}
            </label>
            <span className="gen-dialog__char-count">{content.length}/2000</span>
          </div>
          <textarea
            id="social-content"
            ref={textareaRef}
            className="gen-dialog__textarea"
            rows={6}
            maxLength={2000}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              // If user edits, switch to manual
              if (contentSource !== "manual") setContentSource("manual");
            }}
            placeholder={
              contentSource === "linked"
                ? "Content from linked blocks will appear here…"
                : contentSource === "ai"
                ? "AI-generated content will appear here…"
                : "Write your social media post content…"
            }
            disabled={aiGenerating}
          />
        </div>

        {/* ── AI Regenerate (when already has AI content) ── */}
        {contentSource === "ai" && content && !aiGenerating && (
          <button
            type="button"
            className="social-dialog__regen-btn"
            onClick={handleGenAI}
          >
            🔄 Regenerate AI content
          </button>
        )}

        {/* ── Footer ── */}
        <div className="social-dialog__footer">
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--cancel"
            onClick={close}
          >
            Cancel
          </button>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--save"
            onClick={handleSave}
            disabled={aiGenerating}
          >
            💾 Save
            <span className="social-dialog__shortcut">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
