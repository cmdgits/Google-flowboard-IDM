import { useState, useEffect } from "react";

interface SocialAccount {
  id: number;
  platform: string;
  account_id: string;
  account_name?: string;
  created_at: string;
}

export function SocialAccountsSection() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch connected accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/social/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    // TODO: Implement OAuth flow for each platform
    // For now, show a placeholder message
    alert(`OAuth flow for ${platform} would open here`);
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm("Disconnect this account?")) return;
    
    try {
      // TODO: Implement disconnect endpoint
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

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

  return (
    <div className="settings-panel__section">
      <div className="settings-panel__label">Social Media Accounts</div>
      
      {error && (
        <div className="settings-panel__error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="settings-panel__loading">Loading accounts...</div>
      ) : accounts.length > 0 ? (
        <div className="social-accounts-list">
          {accounts.map((account) => (
            <div key={account.id} className="social-account-item">
              <div
                className="social-account-icon"
                style={{
                  backgroundColor: platformColors[account.platform] || "#ccc",
                }}
              >
                {platformIcons[account.platform] || "●"}
              </div>
              <div className="social-account-info">
                <div className="social-account-platform">
                  {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                </div>
                <div className="social-account-name">
                  {account.account_name || account.account_id}
                </div>
              </div>
              <button
                type="button"
                className="social-account-disconnect"
                onClick={() => handleDisconnect(account.id)}
                title="Disconnect"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="settings-panel__hint">
          No social accounts connected yet.
        </div>
      )}

      <div className="social-connect-buttons">
        <button
          type="button"
          className="social-connect-btn social-connect-btn--facebook"
          onClick={() => handleConnect("facebook")}
        >
          Connect Facebook
        </button>
        <button
          type="button"
          className="social-connect-btn social-connect-btn--tiktok"
          onClick={() => handleConnect("tiktok")}
        >
          Connect TikTok
        </button>
        <button
          type="button"
          className="social-connect-btn social-connect-btn--youtube"
          onClick={() => handleConnect("youtube")}
        >
          Connect YouTube
        </button>
        <button
          type="button"
          className="social-connect-btn social-connect-btn--instagram"
          onClick={() => handleConnect("instagram")}
        >
          Connect Instagram
        </button>
      </div>

      <div className="settings-panel__hint">
        Connect your social media accounts to enable automatic posting of generated videos.
      </div>
    </div>
  );
}
