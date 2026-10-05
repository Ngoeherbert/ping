import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody } from "./helpers";

/**
 * Privacy, notification preferences, linked devices, verification and reports.
 *
 * This is the one store worth persisting: it is small, and a user's choices
 * should survive a restart. Large lists are deliberately not persisted.
 */
export const useSettingsStore = create((set, get) => ({
  settings: null,
  devices: [],
  reports: [],
  verification: null,
  status: "idle",
  error: null,

  /** Load all account settings. */
  fetchSettings: async () => {
    set({ status: "loading", error: null });
    try {
      const { settings } = await api.getSettings();
      set({
        settings,
        devices: settings.linkedDevices,
        verification: settings.verification,
        status: "idle",
        error: null,
      });
      return settings;
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
      return null;
    }
  },

  /**
   * Patch settings. Applied locally first so toggles feel instant, then
   * rolled back if the request fails.
   */
  updateSettings: async (patch) => {
    const before = get().settings;
    if (!before) return null;

    const optimistic = {
      ...before,
      privacy: { ...before.privacy, ...(patch.privacy ?? {}) },
      notifications: { ...before.notifications, ...(patch.notifications ?? {}) },
      ...(patch.theme ? { theme: patch.theme } : {}),
      ...(patch.language ? { language: patch.language } : {}),
      ...(patch.draftPostText !== undefined ? { draftPostText: patch.draftPostText } : {}),
    };
    set({ settings: optimistic });

    try {
      const settings = await api.updateSettings(patch);
      set({ settings, devices: settings.linkedDevices, verification: settings.verification });
      return settings;
    } catch (error) {
      set({ settings: before, error: toErrorBody(error) });
      return null;
    }
  },

  /** Turn the account private or public. */
  setPrivateAccount: (isPrivate) => get().updateSettings({ privacy: { isPrivateAccount: isPrivate } }),

  /** Toggle one notification category. */
  setNotificationPref: (key, enabled) =>
    get().updateSettings({ notifications: { [key]: enabled } }),

  /** Save or clear an unfinished post draft. */
  setDraft: (text) => get().updateSettings({ draftPostText: text }),

  /** Load linked devices on their own. */
  fetchDevices: async () => {
    try {
      const { devices } = await api.listLinkedDevices();
      set({ devices });
      return devices;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Sign a device out. The current device cannot be removed. */
  removeDevice: async (deviceId) => {
    const before = get().devices;
    set({ devices: before.filter((d) => d.id !== deviceId) });

    try {
      await api.removeLinkedDevice(deviceId);
      return true;
    } catch (error) {
      set({ devices: before, error: toErrorBody(error) });
      return null;
    }
  },

  /** Request account verification. */
  requestVerification: async () => {
    try {
      const verification = await api.requestVerification();
      set((state) => ({
        verification,
        settings: state.settings ? { ...state.settings, verification } : state.settings,
      }));
      return verification;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Load items the viewer has reported. */
  fetchReports: async () => {
    try {
      const { reports } = await api.listReports({ limit: 20 });
      set({ reports });
      return reports;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },

  /** Report a post, comment, message or user. */
  report: async (input) => {
    try {
      const report = await api.reportItem(input);
      set((state) => ({ reports: [report, ...state.reports] }));
      return report;
    } catch (error) {
      set({ error: toErrorBody(error) });
      return null;
    }
  },
}));

/* -------------------------------- selectors -------------------------------- */

const slice = (state) => state.settings ?? state;

export const selectSettings = (state) => slice(state).settings;

export const selectPrivacySettings = (state) => slice(state).settings?.privacy ?? null;

export const selectNotificationSettings = (state) => slice(state).settings?.notifications ?? null;

export const selectTheme = (state) => slice(state).settings?.theme ?? "system";

export const selectDraftPost = (state) => slice(state).settings?.draftPostText ?? null;

export const selectLinkedDevices = (state) => slice(state).devices;

export const selectVerification = (state) => slice(state).verification;

export const selectReports = (state) => slice(state).reports;

export const selectSettingsStatus = (state) => slice(state).status;
