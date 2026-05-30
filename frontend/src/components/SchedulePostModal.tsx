import { useState, useEffect } from "react";

interface SchedulePostModalProps {
  assetId: number;
  open: boolean;
  onClose: () => void;
  onSchedule?: (data: SchedulePostData) => void;
}

export interface SchedulePostData {
  asset_id: number;
  social_account_id: number;
  platform: string;
  caption: string;
  scheduled_time: string;
}

interface SocialAccount {
  id: number;
  platform: string;
  account_id: string;
  account_name?: string;
}

export function SchedulePostModal({
  assetId,
  open,
  onClose,
  onSchedule,
}: SchedulePostModalProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts when modal opens
  useEffect(() => {
    if (!open) return;
    fetchAccounts();
  }, [open]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/social/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedAccountId || !scheduledDate || !caption.trim()) {
      setError("Please fill in all fields");
      return;
    }

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    if (!selectedAccount) {
      setError("Invalid account selected");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError("Scheduled time must be in the future");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: assetId,
          social_account_id: selectedAccountId,
          platform: selectedAccount.platform,
          caption: caption.trim(),
          scheduled_time: scheduledDateTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule post");
      
      const data = await response.json();
      onSchedule?.(data);
      
      // Reset form
      setCaption("");
      setScheduledDate("");
      setScheduledTime("12:00");
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
        aria-label="Schedule post to social media"
      >
        <div className="schedule-post-modal__header">
          <h2 className="schedule-post-modal__title">Schedule Post</h2>
          <button
            type="button"
            className="schedule-post-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="schedule-post-modal__content">
          {error && (
            <div className="schedule-post-modal__error">{error}</div>
          )}

          {loading && accounts.length === 0 ? (
            <div className="schedule-post-modal__loading">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="schedule-post-modal__empty">
              No social accounts connected. Please connect an account in Settings first.
            </div>
          ) : (
            <>
              <div className="schedule-post-modal__field">
                <label className="schedule-post-modal__label">Platform</label>
                <select
                  className="schedule-post-modal__select"
                  value={selectedAccountId || ""}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.platform} - {account.account_name || account.account_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="schedule-post-modal__field">
                <label className="schedule-post-modal__label">Caption</label>
                <textarea
                  className="schedule-post-modal__textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your post caption..."
                  rows={4}
                />
              </div>

              <div className="schedule-post-modal__row">
                <div className="schedule-post-modal__field">
                  <label className="schedule-post-modal__label">Date</label>
                  <input
                    type="date"
                    className="schedule-post-modal__input"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={today}
                  />
                </div>
                <div className="schedule-post-modal__field">
                  <label className="schedule-post-modal__label">Time</label>
                  <input
                    type="time"
                    className="schedule-post-modal__input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="schedule-post-modal__footer">
          <button
            type="button"
            className="schedule-post-modal__btn schedule-post-modal__btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="schedule-post-modal__btn schedule-post-modal__btn--schedule"
            onClick={handleSchedule}
            disabled={loading || accounts.length === 0}
          >
            {loading ? "Scheduling..." : "Schedule Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
