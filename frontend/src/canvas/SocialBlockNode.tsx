import { useState, useEffect } from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { useBoardStore, type FlowboardNodeData, type FlowNode } from "../store/board";

interface SocialBlockData extends FlowboardNodeData {
  platforms?: string[];
  content?: string;
  content_type?: string;
  status?: string;
  scheduled_time?: string;
}

export function SocialBlockNode(props: NodeProps<FlowNode>) {
  const data = props.data as SocialBlockData;
  const [showPanel, setShowPanel] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(data.platforms || []);
  const [content, setContent] = useState(data.content || "");
  const [contentType, setContentType] = useState(data.content_type || "manual");

  const platformIcons: Record<string, string> = {
    facebook: "f",
    tiktok: "♪",
    youtube: "▶",
    instagram: "📷",
  };

  const platformColors: Record<string, string> = {
    facebook: "#1877F2",
    tiktok: "#000000",
    youtube: "#FF0000",
    instagram: "#E4405F",
  };

  const handlePlatformToggle = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSave = () => {
    useBoardStore.getState().updateNodeData(props.id, {
      platforms,
      content,
      content_type: contentType,
    });
    setShowPanel(false);
  };

  const handleSchedule = () => {
    // TODO: Open schedule modal
    console.log("Schedule clicked");
  };

  return (
    <div className="social-block-node">
      <Handle type="target" position={Position.Left} />

      <div className="social-block-header">
        <span className="social-block-icon">📱</span>
        <span className="social-block-title">{data.title || "Social Block"}</span>
      </div>

      <div className="social-block-body">
        {/* Platforms Display */}
        <div className="social-block-platforms">
          {platforms.length > 0 ? (
            platforms.map((platform) => (
              <div
                key={platform}
                className="social-block-platform-badge"
                style={{ backgroundColor: platformColors[platform] || "#ccc" }}
                title={platform}
              >
                {platformIcons[platform] || "●"}
              </div>
            ))
          ) : (
            <span className="social-block-hint">No platforms selected</span>
          )}
        </div>

        {/* Content Preview */}
        {content && (
          <div className="social-block-content-preview">
            {content.length > 50 ? content.substring(0, 50) + "..." : content}
          </div>
        )}

        {/* Status */}
        {data.status && (
          <div className={`social-block-status social-block-status--${data.status}`}>
            {data.status}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="social-block-actions">
        <button
          type="button"
          className="social-block-btn social-block-btn--configure"
          onClick={() => setShowPanel(!showPanel)}
          title="Configure block"
        >
          ⚙️
        </button>
        <button
          type="button"
          className="social-block-btn social-block-btn--schedule"
          onClick={handleSchedule}
          title="Schedule post"
        >
          📅
        </button>
      </div>

      {/* Configuration Panel */}
      {showPanel && (
        <div className="social-block-panel">
          <div className="social-block-panel-section">
            <label className="social-block-label">Platforms</label>
            <div className="social-block-platform-selector">
              {["facebook", "tiktok", "youtube", "instagram"].map((platform) => (
                <label key={platform} className="social-block-checkbox">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                  />
                  <span
                    className="social-block-checkbox-icon"
                    style={{ backgroundColor: platformColors[platform] }}
                  >
                    {platformIcons[platform]}
                  </span>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="social-block-panel-section">
            <label className="social-block-label">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="social-block-select"
            >
              <option value="manual">Manual</option>
              <option value="ai_generated">AI Generated</option>
              <option value="from_connected">From Connected Block</option>
            </select>
          </div>

          <div className="social-block-panel-section">
            <label className="social-block-label">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter post content..."
              className="social-block-textarea"
              rows={4}
            />
          </div>

          <div className="social-block-panel-actions">
            <button
              type="button"
              className="social-block-btn social-block-btn--save"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              type="button"
              className="social-block-btn social-block-btn--cancel"
              onClick={() => setShowPanel(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
