import { useEffect, useRef, useState } from "react";
import { useSocialBlockStore } from "../store/socialBlock";
import { useBoardStore, type FlowboardNodeData } from "../store/board";
import { mediaUrl } from "../api/client";
import { SocialBlockScheduleModal } from "./SocialBlockScheduleModal";

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

function collectLinkedContent(rfId: string) {
  const { nodes, edges } = useBoardStore.getState();
  const texts: string[] = [];
  const mediaIds: string[] = [];

  for (const edge of edges) {
    const connectedNodeId = edge.target === rfId ? edge.source : edge.source === rfId ? edge.target : null;
    if (!connectedNodeId) continue;
    const node = nodes.find((n) => n.id === connectedNodeId);
    if (!node) continue;
    const d = node.data as FlowboardNodeData;
    if (d.type === "prompt" || d.type === "note") {
      const text = (d.prompt || d.title || "").trim();
      if (text) texts.push(text);
    } else if (d.title) {
      texts.push(d.title);
    }
    
    // Support both d.mediaIds (all variants) and singular d.mediaId
    if (Array.isArray(d.mediaIds)) {
      for (const mid of d.mediaIds) {
        if (mid && !mediaIds.includes(mid)) {
          mediaIds.push(mid);
        }
      }
    } else if (d.mediaId && !mediaIds.includes(d.mediaId)) {
      mediaIds.push(d.mediaId);
    }
  }
  return { texts, mediaIds };
}

export function SocialBlockDialog() {
  const openRfId = useSocialBlockStore((s) => s.openRfId);
  const close = useSocialBlockStore((s) => s.closeSocialBlockDialog);
  const nodes = useBoardStore((s) => s.nodes);
  const edges = useBoardStore((s) => s.edges);

  const node = nodes.find((n) => n.id === openRfId);
  const data = node?.data as FlowboardNodeData | undefined;

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [linkedContent, setLinkedContent] = useState<{ texts: string[]; mediaIds: string[] }>({ texts: [], mediaIds: [] });
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!openRfId || !data) return;

    // Lấy dữ liệu hiện tại
    setPlatforms(Array.isArray(data.platforms) ? (data.platforms as string[]) : []);
    setCaption((data.content as string) || "");
    setAiGenerating(false);

    // Lấy nội dung liên kết
    const linked = collectLinkedContent(openRfId);
    setLinkedContent(linked);

    // Không tự động điền caption từ linked blocks
    // User sẽ tự nhập hoặc dùng Generate AI

    setTimeout(() => textareaRef.current?.focus(), 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRfId]);

  const handleClose = () => {
    if (openRfId) {
      useBoardStore.getState().updateNodeData(openRfId, { platforms, content: caption });
    }
    close();
  };

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  // Keyboard shortcuts
  useEffect(() => {
    if (!openRfId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleCloseRef.current(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleCloseRef.current(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openRfId]);

  // Auto-save caption when it changes (debounce 1 second)
  useEffect(() => {
    if (!openRfId || platforms.length === 0) return;

    const timeoutId = setTimeout(() => {
      useBoardStore.getState().updateNodeData(openRfId, {
        platforms,
        content: caption,
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [caption, platforms, openRfId]);

  if (!openRfId || !data) return null;

  const handlePlatformToggle = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleGenAI = async () => {
    if (platforms.length === 0) {
      alert("Vui lòng chọn ít nhất 1 platform");
      return;
    }

    setAiGenerating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const context = linkedContent.texts.length > 0
        ? `Dựa trên nội dung: "${linkedContent.texts.join(". ")}". `
        : "";
      const platformStr = platforms.join(", ");
      const prompt = `${context}Tạo một caption bài đăng sáng tạo và hấp dẫn cho ${platformStr}. Giữ ngắn gọn, sử dụng emoji phù hợp, và có lời kêu gọi hành động.`;

      const response = await fetch("/api/llm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens: 300 }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const generatedContent = result.text || result.content;

      if (generatedContent) {
        setCaption(generatedContent);
        
        // ✅ Auto-save caption sau Generate AI
        useBoardStore.getState().updateNodeData(openRfId, {
          platforms,
          content: generatedContent,
        });
      } else {
        throw new Error("Không nhận được caption từ AI");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      let errorMsg = "Lỗi tạo caption AI";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMsg = "Timeout: Tạo caption AI mất quá lâu (>30s)";
        } else if (error.message.includes("503")) {
          errorMsg = "LLM provider chưa được cấu hình. Vui lòng cấu hình trong Settings.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMsg = "Lỗi kết nối. Kiểm tra kết nối mạng.";
        } else {
          errorMsg = `Lỗi: ${error.message}`;
        }
      }

      alert(errorMsg);
    } finally {
      clearTimeout(timeoutId);
      setAiGenerating(false);
    }
  };



  const handleQuickPost = async () => {
    if (platforms.length === 0) {
      alert("Vui lòng chọn ít nhất 1 platform");
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch(`/api/social-blocks/node/${openRfId}/post-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, content: caption }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      const resultsText = result.results
        .map((r: any) => {
          if (r.status === "success") {
            return `✅ ${r.platform.toUpperCase()}: Đăng thành công! (Post ID: ${r.post_id})`;
          } else {
            return `❌ ${r.platform.toUpperCase()}: Thất bại (${r.error || "Không rõ nguyên nhân"})`;
          }
        })
        .join("\n");

      // Save content and platforms state locally
      useBoardStore.getState().updateNodeData(openRfId, {
        platforms,
        content: caption,
        status: result.status,
      });

      alert(`Kết quả đăng bài:\n\n${resultsText}`);
      if (result.status === "posted") {
        close();
      }
    } catch (err: any) {
      console.error("Auto post error:", err);
      alert(`Lỗi đăng bài tự động: ${err.message || err}`);
    } finally {
      setPublishing(false);
    }
  };

  const linkedBlockCount = edges.filter((e) => e.target === openRfId || e.source === openRfId).length;

  return (
    <div className="gen-dialog-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="gen-dialog" role="dialog" aria-labelledby="social-dialog-title" aria-modal="true" ref={dialogRef} style={{ maxWidth: 560 }}>
        <div className="gen-dialog__header">
          <div>
            <h2 id="social-dialog-title" className="gen-dialog__title">📱 Tạo bài đăng Social</h2>
            <span className="gen-dialog__subtitle">
              Node #{data.shortId}
              {linkedBlockCount > 0 && <span style={{ marginLeft: 8, color: "var(--accent)" }}>· {linkedBlockCount} khối liên kết</span>}
            </span>
          </div>
          <button className="gen-dialog__close" onClick={close} aria-label="Đóng (Escape)">esc</button>
        </div>

        <div className="gen-dialog__field">
          <label className="gen-dialog__label">Chọn Platform (bắt buộc)</label>
          <div className="social-dialog__platforms">
            {PLATFORM_LIST.map((p) => {
              const active = platforms.includes(p);
              return (
                <button key={p} type="button" className={`social-dialog__platform-chip${active ? " social-dialog__platform-chip--active" : ""}`} onClick={() => handlePlatformToggle(p)} style={active ? { borderColor: PLATFORM_COLORS[p], background: `${PLATFORM_COLORS[p]}22` } : undefined}>
                  <span className="social-dialog__platform-icon" style={{ backgroundColor: PLATFORM_COLORS[p] }}>{PLATFORM_ICONS[p]}</span>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>
          {platforms.length === 0 && <p style={{ fontSize: 12, color: "var(--error)", margin: "4px 0 0" }}>⚠️ Vui lòng chọn ít nhất 1 platform</p>}
        </div>

        {linkedContent.mediaIds.length > 0 && (
          <div className="gen-dialog__field">
            <label className="gen-dialog__label">Ảnh/Video liên kết ({linkedContent.mediaIds.length})</label>
            <div className="social-dialog__linked-media">
              {linkedContent.mediaIds.map((mid) => (
                <img key={mid} src={mediaUrl(mid)} alt="Linked media" className="social-dialog__linked-thumb" />
              ))}
            </div>
          </div>
        )}

        <div className="gen-dialog__field">
          <div className="gen-dialog__label-row">
            <label className="gen-dialog__label" htmlFor="social-caption">Caption bài đăng</label>
            <span className="gen-dialog__char-count">{caption.length}/500</span>
          </div>
          <textarea id="social-caption" ref={textareaRef} className="gen-dialog__textarea" rows={6} maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Nhập caption hoặc để trống để AI tạo…" disabled={aiGenerating} />
        </div>

        <div className="social-dialog__footer">
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--cancel"
            onClick={handleClose}
            disabled={publishing}
          >
            Đóng
          </button>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--ai"
            onClick={handleGenAI}
            disabled={aiGenerating || publishing}
          >
            {aiGenerating ? "⏳ Đang tạo…" : "🤖 Generate AI"}
          </button>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--schedule"
            onClick={() => setShowScheduleModal(true)}
            disabled={platforms.length === 0 || publishing}
            title="Lên lịch đăng bài"
          >
            📅 Schedule
          </button>
          <button
            type="button"
            className="social-dialog__btn social-dialog__btn--post"
            onClick={handleQuickPost}
            disabled={platforms.length === 0 || aiGenerating || publishing}
            title="Đăng nhanh tự động qua API (Yêu cầu cấu hình credentials trong .env)"
          >
            {publishing ? "⏳ Đang đăng…" : "🚀 Đăng nhanh (Auto)"}
          </button>
        </div>

        {/* Schedule Modal */}
        <SocialBlockScheduleModal
          open={showScheduleModal}
          blockId={parseInt(openRfId || "0")}
          platforms={platforms}
          content={caption}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(data) => {
            useBoardStore.getState().updateNodeData(openRfId, {
              platforms,
              content: caption,
              scheduledTime: data.scheduled_time,
            });
            setShowScheduleModal(false);
          }}
        />
      </div>
    </div>
  );
}
