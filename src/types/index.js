/**
 * Entity types for the Ping data layer.
 *
 * This project is plain JavaScript, so these are JSDoc typedefs. Reference
 * them from other modules with:
 *
 *   /** @typedef {import("../types").User} User *\/
 *
 * Conventions:
 * - All timestamps are ISO 8601 strings in WAT (UTC+1), e.g. "2026-05-10T14:03:00+01:00".
 * - All ids are stable strings prefixed by entity, e.g. "u_12", "p_3".
 * - Optional fields are `| null` when the API can explicitly return nothing,
 *   and omitted entirely when they simply do not apply.
 * - Counts live in a nested `counts` object so a screen never has to guess.
 *
 * This module contains no runtime code by design.
 */

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} UserCounts
 * @property {number} posts
 * @property {number} followers
 * @property {number} following
 */

/**
 * A person in the app.
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string|null} avatarUrl Null when the user has no avatar set.
 * @property {string|null} coverUrl
 * @property {string} bio Free text written by the user. May be very long.
 * @property {string|null} city
 * @property {string} joinedAt ISO string.
 * @property {boolean} isVerified
 * @property {boolean} isPrivate Private accounts gate their posts and following list.
 * @property {boolean} isDeleted Deactivated accounts are kept for referential integrity.
 * @property {"online"|"offline"} presence
 * @property {string|null} lastSeenAt ISO string, null while online.
 * @property {UserCounts} counts
 */

/**
 * The signed-in person. Extends User with contact and sign-in fields.
 * @typedef {User & {
 *   email: string|null,
 *   phone: string|null,
 *   isCurrentUser: true
 * }} CurrentUser
 */

/** @typedef {"accepted"|"pending"} FollowStatus */

/**
 * One-way follow edge. `status` is "pending" when the target is private.
 * @typedef {Object} Follow
 * @property {string} id
 * @property {string} followerId
 * @property {string} followingId
 * @property {FollowStatus} status
 * @property {string} createdAt
 * @property {string|null} resolvedAt When a pending request was accepted or declined.
 */

/**
 * @typedef {Object} Block
 * @property {string} id
 * @property {string} userId The blocked person, relative to the current user.
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Mute
 * @property {string} id
 * @property {string} userId The muted person, relative to the current user.
 * @property {string} createdAt
 * @property {string|null} expiresAt Null means muted indefinitely.
 */

/** @typedef {"mutual_followers"|"followed_by"|"similar_location"|"recent_activity"|"contact"|"suggested_by_friend"} SuggestionReasonType */

/**
 * A machine-readable reason a user is suggested. Screens pick their own wording.
 * @typedef {Object} SuggestionReason
 * @property {SuggestionReasonType} type
 * @property {string[]} [mutualFollowerIds] Present when type is "mutual_followers".
 * @property {number} [count] How many people back this reason.
 */

/**
 * @typedef {Object} SuggestedUser
 * @property {string} userId
 * @property {SuggestionReason[]} reasons
 */

/* ------------------------------------------------------------------ *
 * Media and content
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} Media
 * @property {string} id
 * @property {"image"|"video"} kind
 * @property {string} url May be an intentionally broken URL for fallback testing.
 * @property {string|null} thumbUrl
 * @property {number} width
 * @property {number} height
 * @property {number|null} durationSec Videos only.
 * @property {string|null} altText
 */

/** @typedef {"square"|"portrait"|"landscape"} AspectRatio */

/**
 * @typedef {Object} AspectRatioInfo
 * @property {number} width
 * @property {number} height
 * @property {AspectRatio} ratio
 */

/**
 * @typedef {Object} PollOption
 * @property {string} id
 * @property {string} label Free text written by the author.
 * @property {number} votes
 */

/**
 * @typedef {Object} Poll
 * @property {string[]} optionIds
 * @property {number} totalVotes
 * @property {boolean} isMultipleChoice
 * @property {string|null} endsAt ISO string.
 * @property {string|null} viewerChoiceId Which option the current user picked.
 */

/**
 * @typedef {Object} LinkPreview
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {string} siteName
 * @property {string|null} imageUrl
 */

/**
 * @typedef {Object} LocationTag
 * @property {string} placeId
 * @property {string} name
 * @property {number} latitude
 * @property {number} longitude
 */

/** @typedef {"text"|"image"|"carousel"|"video"|"link"|"poll"|"repost"} PostKind */

/**
 * @typedef {Object} PostCounts
 * @property {number} likes
 * @property {number} comments
 * @property {number} shares
 * @property {number} views
 */

export {};
/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} authorId
 * @property {PostKind} kind
 * @property {string} caption Free text written by the author.
 * @property {Media[]} media
 * @property {string[]} hashtags Without the leading "#".
 * @property {string[]} mentionedUserIds
 * @property {LocationTag|null} location
 * @property {LinkPreview|null} linkPreview
 * @property {Poll|null} poll
 * @property {string|null} repostOfId Set when kind is "repost" of another post.
 * @property {string|null} quotedPostId Set when kind is "repost" with commentary.
 * @property {string} quotedComment Free text when reposting with a comment.
 * @property {PostCounts} counts
 * @property {boolean} likedByViewer
 * @property {boolean} savedByViewer
 * @property {string} createdAt
 * @property {string|null} editedAt
 * @property {boolean} isDeleted
 * @property {string|null} language BCP-47 hint, e.g. "en", "fr", "pcm".
 */

/**
 * @typedef {Object} CommentCounts
 * @property {number} likes
 * @property {number} replies
 */

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} postId
 * @property {string} authorId
 * @property {string|null} parentId Null for a top-level comment.
 * @property {string} text Free text written by the author.
 * @property {CommentCounts} counts
 * @property {boolean} likedByViewer
 * @property {string} createdAt
 * @property {string|null} editedAt Non-null when the comment was edited.
 * @property {boolean} isDeleted The body is cleared but the node stays for replies.
 * @property {string|null} language
 */

/**
 * @typedef {Object} Like
 * @property {string} id
 * @property {string} userId
 * @property {"post"|"comment"} targetType
 * @property {string} targetId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Share
 * @property {string} id
 * @property {string} postId
 * @property {string} userId
 * @property {"repost"|"send_to_friend"} kind
 * @property {string|null} conversationId Set when kind is "send_to_friend".
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SavedItem
 * @property {string} id
 * @property {string} postId
 * @property {string} userId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Sound
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string|null} audioUrl
 * @property {boolean} isOriginal
 */

/**
 * @typedef {Object} ShortVideoCounts
 * @property {number} views
 * @property {number} likes
 * @property {number} shares
 */

/**
 * @typedef {Object} ShortVideo
 * @property {string} id
 * @property {string} authorId
 * @property {string|null} postId The feed post this video also appears in, if any.
 * @property {string} caption
 * @property {Media} video
 * @property {Sound|null} sound
 * @property {number} durationSec
 * @property {ShortVideoCounts} counts
 * @property {boolean} likedByViewer
 * @property {string} createdAt
 * @property {string|null} language
 */

/**
 * @typedef {Object} StoryReply
 * @property {string} id
 * @property {string} storyId
 * @property {string} authorId
 * @property {string} text Free text written by the replier.
 * @property {string} createdAt
 */

/**
 * @typedef {Object} StoryItem
 * @property {string} id
 * @property {string} authorId
 * @property {"image"|"video"} kind
 * @property {Media} media
 * @property {string} createdAt
 * @property {string} expiresAt Exactly 24h after createdAt.
 * @property {boolean} seenByViewer
 * @property {string[]} viewerIds
 * @property {number} viewerCount
 * @property {StoryReply[]} replies
 */

/**
 * All of one person's currently-live stories, plus their highlight covers.
 * @typedef {Object} StoryGroup
 * @property {string} id
 * @property {string} authorId
 * @property {string[]} itemIds Ordered oldest first.
 * @property {boolean} hasUnseen
 * @property {string|null} latestItemAt
/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

/** @typedef {"new_follower"|"follow_request"|"like"|"comment"|"reply"|"mention"|"share"|"new_story"|"message_request"|"birthday"|"group_invite"} NotificationType */

/**
 * A notification describes what happened, never the sentence to render.
 * @typedef {Object} Notification
 * @property {string} id
 * @property {NotificationType} type
 * @property {string[]} actorIds Ordered newest first.
 * @property {string|null} targetId Post, comment, group or conversation id depending on type.
 * @property {string|null} targetType "post"|"comment"|"group"|"conversation"|"story"|null
 * @property {number} groupedCount Total actors when the entry is a grouped notification.
 * @property {boolean} isRead
 * @property {string} createdAt
 * @property {Object} [meta] Extra structured context, e.g. { birthdayYear: 1998 }.
 */

/* ------------------------------------------------------------------ *
 * Messaging
 * ------------------------------------------------------------------ */

/** @typedef {"sent"|"delivered"|"read"} DeliveryStatus */
/** @typedef {"direct"|"group"} ConversationKind */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {ConversationKind} kind
 * @property {string[]} participantIds
 * @property {string[]} adminIds Groups only.
 * @property {string|null} title Groups and channels only.
 * @property {string|null} iconUrl
 * @property {string|null} description
 * @property {string|null} lastMessageId
 * @property {number} unreadCount
 * @property {boolean} isPinned
 * @property {boolean} isMuted
 * @property {boolean} disappearingMessagesEnabled
 * @property {string|null} disappearingAfterSec Null disables the timer.
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @typedef {"chat_created"|"member_added"|"member_removed"|"member_left"|"group_renamed"|"group_photo_changed"|"disappearing_messages_on"|"disappearing_messages_off"|"theme_changed"|"nickname_changed"|"message_deleted"|"story_reply"|"post_shared"|"end_to_end_encryption"} SystemEventType */

/**
 * A typed system event. Screens map `eventType` to their own copy.
 * @typedef {Object} SystemEventParams
 * @property {string} [actorId]
 * @property {string} [targetUserId]
 * @property {string} [title]
 * @property {string|null} [iconUrl]
 * @property {string|null} [theme]
 * @property {string|null} [nickname]
 * @property {string|null} [postId]
 * @property {number|null} [durationSec]
 */

/** @typedef {{ text: string }} TextMessagePayload */
/** @typedef {{ media: Media, caption: string|null }} ImageMessagePayload */
/** @typedef {{ media: Media, caption: string|null, durationSec: number }} VideoMessagePayload */
/** @typedef {{ durationSec: number, waveform: number[], isListenOnce: boolean }} VoiceMessagePayload */
/** @typedef {{ fileName: string, sizeBytes: number, mimeType: string, url: string }} FileMessagePayload */
/** @typedef {{ emoji: string }} EmojiMessagePayload */
/** @typedef {{ gameId: string }} GameMessagePayload */
/** @typedef {{ callId: string }} CallMessagePayload */
/** @typedef {{ eventType: SystemEventType, params: SystemEventParams }} SystemMessagePayload */

/**
 * Fields shared by every message, whatever its type.
 * @typedef {Object} MessageBase
 * @property {string} id
 * @property {string} conversationId
 * @property {string|null} senderId Null for system messages.
 * @property {string} createdAt
 * @property {string|null} replyToId
 * @property {string|null} forwardedFromId Set when forwarded from elsewhere.
 * @property {boolean} isDeleted
 * @property {DeliveryStatus|null} deliveryStatus Null for system messages.
 */

/**
 * Messages are a discriminated union on `type`. Narrow with a switch:
 *
 *   if (message.type === "text") console.log(message.text);
 *
 * @typedef {MessageBase & ({ type: "text" } & TextMessagePayload)
 *   | (MessageBase & { type: "image" } & ImageMessagePayload)
 *   | (MessageBase & { type: "video" } & VideoMessagePayload)
 *   | (MessageBase & { type: "voice" } & VoiceMessagePayload)
 *   | (MessageBase & { type: "file" } & FileMessagePayload)
 *   | (MessageBase & { type: "emoji" } & EmojiMessagePayload)
 *   | (MessageBase & { type: "game" } & GameMessagePayload)
 *   | (MessageBase & { type: "call" } & CallMessagePayload)
 *   | (MessageBase & { type: "system" } & SystemMessagePayload)} Message
 */

/**
 * @typedef {Object} Presence
 * @property {string} userId
 * @property {"online"|"offline"} status
 * @property {string|null} lastSeenAt
 * @property {boolean} isTyping
 * @property {string|null} typingInConversationId
 */

export {};
 * @property {string|null} ringUrl
 */
/* ------------------------------------------------------------------ *
 * Games
 * ------------------------------------------------------------------ */

/** @typedef {"ludo"|"snake_and_ladder"|"tic_tac_toe"|"chess"|"word_game"|"eight_ball"|"cup_pong"|"dots_and_boxes"|"trivia"} GameType */
/** @typedef {"pending"|"active"|"finished"|"declined"|"expired"} GameStatus */
/** @typedef {"won"|"lost"|"draw"|null} GameOutcome */

/**
 * @typedef {Object} GamePlayer
 * @property {string} userId
 * @property {number} seat
 * @property {number} score
 * @property {boolean} isReady
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {number} rank
 * @property {string} userId
 * @property {number} score
 * @property {number} gamesWon
 */

/**
 * A game played inside a chat. State changes as turns are taken.
 * @typedef {Object} Game
 * @property {string} id
 * @property {GameType} gameType
 * @property {string} conversationId
 * @property {string} invitedById
 * @property {string[]} playerIds
 * @property {GamePlayer[]} players
 * @property {GameStatus} status
 * @property {string|null} currentTurnUserId
 * @property {string|null} winnerUserId
 * @property {GameOutcome} outcome From the current user's perspective.
 * @property {number} round
 * @property {number|null} maxRounds
 * @property {Record<string, number>} scores
 * @property {Object|null} board Snapshot for board games.
 * @property {string|null} boardThumbUrl
 * @property {string} createdAt
 * @property {string|null} startedAt
 * @property {string|null} endedAt
 * @property {string|null} expiresAt Set while status is "pending".
 * @property {boolean} isGroupGame
 * @property {number} joinedCount Groups only.
 * @property {number} maxPlayers Groups only.
 * @property {LeaderboardEntry[]} leaderboard Groups only.
 * @property {string|null} rematchRequestedById
 * @property {string|null} forfeitedById
 * @property {string|null} finishedWhileOffline
 */

/* ------------------------------------------------------------------ *
 * Calls
 * ------------------------------------------------------------------ */

/** @typedef {"voice"|"video"} CallKind */
/** @typedef {"incoming"|"outgoing"} CallDirection */
/** @typedef {"missed"|"answered"|"declined"|"cancelled"|"busy"|"failed"|"ongoing"} CallStatus */

/**
 * @typedef {Object} CallEvent
 * @property {"started"|"joined"|"left"|"ended"} type
 * @property {string|null} userId
 * @property {string} at
 */

/**
 * @typedef {Object} Call
 * @property {string} id
 * @property {string} conversationId
 * @property {CallKind} kind
 * @property {CallDirection} direction
 * @property {CallStatus} status
 * @property {string} initiatorId
 * @property {string[]} participantIds
 * @property {string|null} answeredAt
 * @property {string|null} endedAt
/* ------------------------------------------------------------------ *
 * Account and settings
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} PrivacySettings
 * @property {boolean} isPrivateAccount
 * @property {boolean} showActivityStatus
 * @property {boolean} allowMessagesFromEveryone
 * @property {boolean} allowTagging
 * @property {boolean} commentBeforePosting
 * @property {boolean} hideReadReceipts
 */

/**
 * @typedef {Object} NotificationSettings
 * @property {boolean} likes
 * @property {boolean} comments
 * @property {boolean} follows
 * @property {boolean} messages
 * @property {boolean} stories
 * @property {boolean} groupInvites
 * @property {boolean} birthdays
 * @property {boolean} sound
 */

/**
 * @typedef {Object} LinkedDevice
 * @property {string} id
 * @property {string} label
 * @property {"ios"|"android"|"web"} platform
 * @property {string} location
 * @property {string} lastActiveAt
 * @property {boolean} isCurrentDevice
 */

/**
 * @typedef {Object} VerificationRequest
 * @property {string} id
 * @property {"none"|"pending"|"approved"|"rejected"} status
 * @property {string} requestedAt
 * @property {string|null} resolvedAt
 * @property {string|null} rejectionReason
 */

/**
 * @typedef {Object} ReportedItem
 * @property {string} id
 * @property {"post"|"comment"|"message"|"user"} targetType
 * @property {string} targetId
 * @property {string|null} targetUserId
 * @property {"spam"|"harassment"|"hate"|"violence"|"nudity"|"scam"|"other"} reason
 * @property {string|null} details
 * @property {"open"|"reviewing"|"resolved"|"dismissed"} status
 * @property {string} reportedAt
 * @property {string|null} resolvedAt
 */

/**
 * @typedef {Object} AccountSettings
 * @property {PrivacySettings} privacy
 * @property {NotificationSettings} notifications
 * @property {"system"|"light"|"dark"} theme
 * @property {string} language
 * @property {string|null} draftPostText
 * @property {LinkedDevice[]} linkedDevices
 * @property {VerificationRequest} verification
 * @property {ReportedItem[]} reports
 */

/* ------------------------------------------------------------------ *
 * API envelopes
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} PageInfo
 * @property {string|null} cursor Null on the last page.
 * @property {boolean} hasMore
 * @property {number} limit
 * @property {number} total
 */

/**
 * Every list response is `PageInfo` plus a `requestId` plus entity arrays.
 * @typedef {Object} Paginated
 * @property {PageInfo} pageInfo
 * @property {string} requestId
 */

/**
 * @typedef {Paginated & { users?: import("./index").User[] }} UsersResponse
 * @typedef {Paginated & { posts?: import("./index").Post[] }} PostsResponse
 * @typedef {Paginated & { shortVideos?: import("./index").ShortVideo[] }} ShortVideosResponse
 * @typedef {Paginated & { storyGroups?: import("./index").StoryGroup[], items?: import("./index").StoryItem[] }} StoriesResponse
 * @typedef {Paginated & { comments?: import("./index").Comment[], topLevel?: import("./index").Comment[] }} CommentsResponse
 * @typedef {Paginated & { conversations?: import("./index").Conversation[] }} ConversationsResponse
 * @typedef {Paginated & { messages?: import("./index").Message[] }} MessagesResponse
 * @typedef {Paginated & { calls?: import("./index").Call[], groups?: import("./index").MissedCallGroup[] }} CallsResponse
 * @typedef {Paginated & { notifications?: import("./index").Notification[] }} NotificationsResponse
 * @typedef {Paginated & { trending?: import("./index").TrendingTopic[], items?: import("./index").ExploreItem[] }} ExploreResponse
 * @typedef {Paginated & { groups?: import("./index").Group[], posts?: import("./index").Post[] }} GroupsResponse
 * @typedef {Paginated & { results?: import("./index").SearchResult[] }} SearchResponse
 */

/**
 * @typedef {{ type: "user", user: import("./index").User }
 *   | { type: "group", group: import("./index").Group }
 *   | { type: "hashtag", label: string }
 *   | { type: "post", post: import("./index").Post }} SearchResult
 */

/**
 * A non-2xx response. Always shaped like this so the real backend can match it.
 * @typedef {Object} ApiErrorBody
 * @property {string} code Machine-readable, e.g. "not_found".
 * @property {string} message Safe to show to a user.
 * @property {string|null} requestId
 * @property {Object|null} details Field-level context.
 */

/**
 * @typedef {Object} DraftPost
 * @property {string} text
 * @property {string[]} hashtags
 * @property {string[]} mentionedUserIds
 * @property {string|null} locationId
 */

export {};
 * @property {number|null} durationSec Null when the call was never answered.
 * @property {boolean} isRead
 * @property {CallEvent[]} events
 * @property {string} startedAt
 */

/**
 * A run of consecutive missed calls from one person.
 * @typedef {Object} MissedCallGroup
 * @property {string} userId
 * @property {string[]} callIds Ordered newest first.
 * @property {number} count
 * @property {string} lastCallAt
 * @property {boolean} isBlockedCaller
 * @property {boolean} isDeletedCaller
 */

export {};

/**
 * A saved, pinned set of stories shown on a profile.
 * @typedef {Object} Highlight
 * @property {string} id
 * @property {string} ownerId
 * @property {string} title
 * @property {string|null} coverUrl
 * @property {string[]} storyItemIds
 * @property {number} storyCount
 */

/* ------------------------------------------------------------------ *
 * Discovery, groups and channels
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} TrendingTopic
 * @property {string} id
 * @property {"hashtag"|"topic"} kind
 * @property {string} label Without the leading "#" for hashtags.
 * @property {number} postCount
 * @property {number} rank 1 is the most trending.
 * @property {string} category
 */

/**
 * A mixed-media tile for the explore grid.
 * @typedef {Object} ExploreItem
 * @property {string} id
 * @property {Media} media
 * @property {string} authorId
 * @property {string} postId
 * @property {AspectRatio} aspect
 */

/**
 * @typedef {Object} RecentSearch
 * @property {string} id
 * @property {string} term Free text typed by the user.
 * @property {string} searchedAt
 */

/** @typedef {"admin"|"moderator"|"member"} GroupRole */

/**
 * @typedef {Object} GroupMember
 * @property {string} userId
 * @property {GroupRole} role
 * @property {string} joinedAt
 */

/**
 * A community. Channels are one-way broadcasts and have no members array.
 * @typedef {Object} Group
 * @property {string} id
 * @property {"group"|"channel"} kind
 * @property {string} name
 * @property {string|null} iconUrl
 * @property {string} description
 * @property {boolean} isPrivate
 * @property {GroupMember[]} members
 * @property {number} memberCount
 * @property {number|null} subscriberCount Channels only.
 * @property {number} postCount
 * @property {string} createdAt
 * @property {string|null} joinedAt When the current user joined.
 * @property {GroupRole|null} viewerRole
 */

export {};