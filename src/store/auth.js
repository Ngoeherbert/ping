import { create } from "zustand";
import * as api from "../api/client";
import { toErrorBody } from "./helpers";

/**
 * Who is signed in.
 *
 * The profile is always fetched from the API rather than cached in storage, so
 * it can never go stale. Only the id is meaningful locally.
 */
export const useAuthStore = create((set) => ({
  currentUserId: api.CURRENT_USER_ID,
  currentUser: null,
  status: "idle",
  error: null,

  /** Load the signed-in profile. */
  fetchCurrentUser: async () => {
    set({ status: "loading", error: null });
    try {
      const currentUser = await api.getCurrentUser();
      set({ currentUser, status: "idle", error: null });
      return currentUser;
    } catch (error) {
      set({ status: "error", error: toErrorBody(error) });
      return null;
    }
  },

  /** Sign out, clearing the cached profile. */
  signOut: () => set({ currentUser: null, status: "idle", error: null }),

  /** Apply a profile patch, e.g. after editing the bio. */
  patchCurrentUser: (patch) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...patch } : state.currentUser,
    })),
}));

/** The signed-in user, or null before it loads. */
export const selectCurrentUser = (state) => state.currentUser;

/** True only while the very first load is in flight. */
export const selectIsAuthLoading = (state) =>
  state.status === "loading" && state.currentUser === null;

/** Signed-in user id, which never changes while the app is running. */
export const selectCurrentUserId = (state) => state.currentUserId;
