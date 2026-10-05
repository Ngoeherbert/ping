/**
 * Every store and selector in one place, so a screen can import from
 * `../../src/store` instead of reaching into individual files.
 *
 * Stores are exported as hooks. Selectors are plain functions and are also
 * re-exported here for convenience.
 */

export { useAuthStore } from "./auth";
export { useUsersStore } from "./users";
export { usePostsStore } from "./posts";
export { useCommentsStore } from "./comments";
export { useStoriesStore } from "./stories";
export { useChatsStore } from "./chats";
export { useMessagesStore } from "./messages";
export { useGamesStore } from "./games";
export { useCallsStore } from "./calls";
export { useNotificationsStore } from "./notifications";
export { useExploreStore } from "./explore";
export { useSettingsStore } from "./settings";
export { useFeedStore } from "./feed";
export { useOverlaysStore } from "./overlays";

export * from "./realtime";
export * from "./helpers";

export {
  selectCurrentUser,
  selectIsAuthLoading,
  selectCurrentUserId,
} from "./auth";

export {
  selectUser,
  selectUsersByIds,
  selectIsBlocked,
  selectIsMuted,
  selectSuggestions,
  selectPendingRequests,
  selectDirectory,
  selectMutualFollowers,
} from "./users";

export {
  selectPost,
  selectFeedPosts,
  selectUserPosts,
  selectSavedPosts,
  selectShortVideos,
  selectFeedStatus,
  selectFeedError,
  selectIsPostLiked,
  selectIsPostSaved,
} from "./posts";

export {
  selectCommentsForPost,
  selectCommentReplies,
  selectCommentById,
  selectCommentStatus,
  selectCommentCount,
} from "./comments";

export {
  selectStoryGroups,
  selectStoryItemsForAuthor,
  selectStoryItem,
  selectUnseenCount,
  selectHighlights,
  selectStoriesStatus,
} from "./stories";

export {
  selectConversations,
  selectConversation,
  selectPinnedConversations,
  selectUnreadTotal,
  selectUnreadConversationCount,
  selectDirectConversations,
  selectGroupConversations,
  selectPresence,
  selectTypingUserIds,
  selectChatsStatus,
} from "./chats";

export {
  selectMessagesForConversation,
  selectMessage,
  selectLastMessage,
  selectMessagesStatus,
  selectMessagesError,
  selectIsAnyoneTyping,
  selectMessagesByType,
} from "./messages";

export {
  selectGame,
  selectGamesForConversation,
  selectPendingInvites,
  selectYourTurnGames,
  selectGamesFinishedOffline,
  selectGameHistory,
  selectOpenLobbies,
  selectGamesError,
} from "./games";

export {
  selectCallHistory,
  selectMissedCallGroups,
  selectMissedCallCount,
  selectCall,
  selectActiveCall,
  selectUnreadCalls,
  selectCallsStatus,
} from "./calls";

export {
  selectNotifications,
  selectNotification,
  selectUnreadNotificationCount,
  selectUnreadNotifications,
  selectNotificationsByType,
  selectFollowRequests,
  selectGroupedNotifications,
  selectNotificationsStatus,
} from "./notifications";

export {
  selectTrendingTopics,
  selectExploreItems,
  selectExploreStatus,
  selectRecentSearches,
  selectSearchResults,
  selectSearchStatus,
  selectGroups,
  selectGroup,
  selectJoinedGroups,
  selectChannels,
  selectGroupsStatus,
} from "./explore";

export {
  selectSettings,
  selectPrivacySettings,
  selectNotificationSettings,
  selectTheme,
  selectDraftPost,
  selectLinkedDevices,
  selectVerification,
  selectReports,
  selectSettingsStatus,
} from "./settings";

export {
  selectIsRefreshing,
  selectLastRefreshedAt,
  selectFeedCoordinatorError,
  selectActiveFeeds,
} from "./feed";

export {
  selectOverlays,
  selectTopOverlay,
  selectHasOverlay,
} from "./overlays";
