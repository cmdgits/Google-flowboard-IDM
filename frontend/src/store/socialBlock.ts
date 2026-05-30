import { create } from "zustand";

interface SocialBlockDialogState {
  /** rfId of the node currently being configured, or null if closed */
  openRfId: string | null;

  openSocialBlockDialog(rfId: string): void;
  closeSocialBlockDialog(): void;
}

export const useSocialBlockStore = create<SocialBlockDialogState>((set) => ({
  openRfId: null,

  openSocialBlockDialog(rfId) {
    set({ openRfId: rfId });
  },

  closeSocialBlockDialog() {
    set({ openRfId: null });
  },
}));
