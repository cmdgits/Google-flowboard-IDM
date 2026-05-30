import { useState } from "react";

interface SocialBlockScheduleModalProps {
  open: boolean;
  blockId: number;
  platforms: string[];
  content: string;
  onClose: () => void;
  onSchedule: (data: ScheduleData) => void;
}

interface ScheduleData {
  platforms: string[];
  scheduled_time: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
}

export function SocialBlockScheduleModal({
  open,
  blockId,
  platforms,
  content,
  onClose,
  onSchedule,
}: SocialBlockScheduleModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platforms);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSchedule = async () => {
    setError(null);

    // Validation
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    if (!scheduledDate) {
      setError("Please select a date");
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError("Scheduled time must be in the future");
      return;
    }

    try {
      setLoading(true);

      const scheduleData: ScheduleData = {
        platforms: selectedPlatforms,
        scheduled_time: scheduledDateTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
      };

      // Call API
      const response = await fetch(`/api/social-blocks/${blockId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to schedule post");
      }

      onSchedule(scheduleData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="schedule-post-modal-backdrop" onClick={onClose}>
      <div
        className="schedule-post-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="schedule-post-modal-header">
          <h2>Schedule Post</h2>
          <button
            type="button"
            className="schedule-post-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="schedule-post-modal-content">
          {/* Content Preview */}
          <div className="schedule-post-section">
            <label className="schedule-post-label">Content Preview</label>
            <div className="schedule-post-preview">
              {content.substring(0, 100)}
              {content.length > 100 ? "..." : ""}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="schedule-post-section">
            <label className="schedule-post-label">Select Platforms</label>
            <div className="schedule-post-platforms">
              {["facebook", "tiktok", "youtube", "instagram"].map((platform) => (
                <label key={platform} className="schedule-post-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                  />
                  <span
                    className="schedule-post-checkbox-icon"
                    style={{ backgroundColor: platformColors[platform] }}
                  >
                    {platformIcons[platform]}
                  </span>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="schedule-post-section">
            <label className="schedule-post-label">Schedule Date & Time</label>
            <div className="schedule-post-datetime">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="schedule-post-input"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="schedule-post-input"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="schedule-post-section">
            <label className="schedule-post-checkbox">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Recurring Post
            </label>

            {isRecurring && (
              <select
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
                className="schedule-post-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="schedule-post-error">
              {error}
            </div>
          )}
        </div>

        <div className="schedule-post-modal-footer">
          <button
            type="button"
            className="schedule-post-btn schedule-post-btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="schedule-post-btn schedule-post-btn--schedule"
            onClick={handleSchedule}
            disabled={loading}
          >
            {loading ? "Scheduling..." : "Schedule Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
