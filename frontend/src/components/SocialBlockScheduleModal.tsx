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
  content: string;
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
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = async () => {
    setError(null);

    if (platforms.length === 0) {
      setError("Please select at least one platform in the main dialog first");
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
        platforms: platforms,
        content: content,
        scheduled_time: scheduledDateTime.toISOString(),
        is_recurring: false,
      };

      // Call API
      const response = await fetch(`/api/social-blocks/node/${blockId}/schedule`, {
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="schedule-post-modal-backdrop" onClick={onClose}>
      <div
        className="schedule-post-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Schedule post"
      >
        <div className="schedule-post-modal__header">
          <h2 className="schedule-post-modal__title">Schedule Post</h2>
          <button
            type="button"
            className="schedule-post-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="schedule-post-modal__content">
          {/* Date & Time */}
          <div className="schedule-post-modal__row">
            <div className="schedule-post-modal__field">
              <label className="schedule-post-modal__label">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="schedule-post-modal__input"
                min={today}
              />
            </div>
            <div className="schedule-post-modal__field">
              <label className="schedule-post-modal__label">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="schedule-post-modal__input"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="schedule-post-modal__error">
              {error}
            </div>
          )}
        </div>

        <div className="schedule-post-modal__footer">
          <button
            type="button"
            className="schedule-post-modal__btn schedule-post-modal__btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="schedule-post-modal__btn schedule-post-modal__btn--schedule"
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
