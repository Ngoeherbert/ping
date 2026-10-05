/**
 * Seed data for the Cameroon locale: names, cities and user-written text.
 *
 * Text pools mix English, French and Cameroonian Pidgin because real captions
 * and chat messages in Cameroon do too. Each string carries the language tag so
 * the data layer carries it through to whatever a screen decides to do with it.
 */

/** Regions and towns used across the dataset. @type {{ name: string, lat: number, lng: number }[]} */
export const CITIES = [
  { name: "Douala", lat: 4.0511, lng: 9.7679 },
  { name: "Yaounde", lat: 3.848, lng: 11.5021 },
  { name: "Buea", lat: 4.155, lng: 9.241 },
  { name: "Bamenda", lat: 5.9631, lng: 10.1591 },
  { name: "Limbe", lat: 4.0219, lng: 9.2 },
  { name: "Kumba", lat: 4.636, lng: 9.2239 },
  { name: "Bafoussam", lat: 5.4781, lng: 10.4176 },
  { name: "Ngaoundere", lat: 7.3167, lng: 13.5833 },
  { name: "Ebolowa", lat: 2.9, lng: 11.15 },
  { name: "Kribi", lat: 2.9408, lng: 9.91 },
];

/** Given names drawn from several regions and languages. @type {string[]} */
export const GIVEN_NAMES = [
  "Ngoe", "Tabi", "Fon", "Mbarga", "Nkeng", "Atangana", "Ndi", "Ebong",
  "Njoya", "Tchouanga", "Bih", "Nyobe", "Manga", "Mvondo", "Essomba", "Kamdem",
  "Bilik", "Sonia", "Nadege", "Carine", "Diane", "Yvonne",
  "Franck", "Bertrand", "Landry", "Aime", "Cedric", "Rodrigue", "Marcelin",
  "Sylvie", "Marthe", "Christine", "Solange", "Larissa", "Prisca", "Michelle",
  "Blaise", "Emeka", "Tchapda", "Sandro", "Romuald", "Wilfried", "Armand",
  "Ange", "Clemence", "Estelle", "Fortune", "Guillaume", "Serge", "Tatiana",
  "Yannick", "Zacharie",
];

/** Family names. @type {string[]} */
export const FAMILY_NAMES = [
  "Ngoe", "Tabi", "Fon", "Mbarga", "Nkeng", "Atangana", "Ndi", "Ebong",
  "Njoya", "Tchouanga", "Kamdem", "Mvondo", "Nyobe", "Essomba", "Bilik",
  "Bassong", "Tchapda", "Etoa", "Nkoulou", "Bekolo", "Manga", "Ondoa",
  "Fotso", "Nganou", "Sembene", "Awono", "Same", "Etoundi", "Zogo",
  "Nkodo", "Mballa", "Bessala",
];

/** Local topics used to build hashtags and trending entries. @type {string[]} */
export const TOPICS = [
  "MTNElite", "OrangeChampionship", "Bafoussam", "Douala", "Buea",
  "Afrobeats", "Makossa", "CameroonianFootball", "NAList", "MobileMoney",
  "BECE", "OLevelExams", "Jamboree", "ChefDeCuisine", "Fashion", "Ankara",
  "MTNMoMo", "OrangeMoney", "Bamenda", "Limbe", "Kribi", "Tiko",
];

/** Short caption fragments, tagged with the language they are written in. @type {{ lang: string, text: string }[]} */
export const CAPTION_FRAGMENTS = [
  { lang: "en", text: "Morning people only" },
  { lang: "en", text: "Somebody tell Buea why the weather is like this again" },
  { lang: "en", text: "Small wins still count" },
  { lang: "en", text: "No filter, no pressure" },
  { lang: "en", text: "Locked in for the exams, wish me luck" },
  { lang: "en", text: "Sunday jollof is not a joke" },
  { lang: "en", text: "New fit, who dis?" },
  { lang: "fr", text: "Douala ce matin, beaucoup de brouillard" },
  { lang: "fr", text: "On se retrouve au marche central samedi" },
  { lang: "fr", text: "Le match de hier etait incroyable" },
  { lang: "fr", text: "Je travaille tard ce soir, repondez plus tard" },
  { lang: "fr", text: "Nouvelle coiffure, merci a ma soeur" },
  { lang: "pcm", text: "E dere for dinner by 6, no delay" },
  { lang: "pcm", text: "Wuna come see this one" },
  { lang: "pcm", text: "Na we go chop am easy" },
  { lang: "pcm", text: "Send location, I no see am" },
  { lang: "pcm", text: "Which one you choose? A or B?" },
  { lang: "pcm", text: "Papa Sava for this one, no small" },
  { lang: "pcm", text: "My battery na 12%, make you quick" },
];

/** Comment text. @type {{ lang: string, text: string }[]} */
export const COMMENT_FRAGMENTS = [
  { lang: "en", text: "This is fire" },
  { lang: "en", text: "Where is this?" },
  { lang: "en", text: "First time here, love it" },
  { lang: "en", text: "The lighting is perfect" },
  { lang: "fr", text: "Magnifique" },
  { lang: "fr", text: "Où est-ce?" },
  { lang: "pcm", text: "Sharp picture" },
  { lang: "pcm", text: "Na who take this one?" },
  { lang: "pcm", text: "Correct location" },
];
/** Longer captions, including some deliberately very long ones. @type {{ lang: string, text: string }[]} */
export const LONG_CAPTIONS = [
  {
    lang: "en",
    text:
      "Okay so this is the long version because somebody will ask me for the full story later and I am tired of repeating it. It started in February when the landlord decided to sell the building, then the new owner wanted everyone out by March, then the notice said April, then nothing for two months, then a letter with a different date on it. We organised a meeting, we went to the mairie twice, and finally the papers came through last week. Fourteen families, one very tired committee, and a landlord who still has not answered the question about the deposit. Anyway. We are still here. The lights are back on and the water runs most days, so we count that as a win.",
  },
  {
    lang: "pcm",
    text:
      "E go take the story from where e stop. The goods arrived wrong, the man say na my mistake, then e vanish for two weeks. When e finally show up say na sorry, but the market don already change price. So we talk am, we agree, but e dey pay small small like somebody owe am money. Thats how this side work sometimes. Meanwhile my sister don marry, my brother don get work, and my mother still dey ask when I go marry. Only small small.",
  },
];

/** Bio fragments. @type {{ lang: string, text: string }[]} */
export const BIO_FRAGMENTS = [
  { lang: "en", text: "Buea based. Coffee first, questions later." },
  { lang: "en", text: "Building things. Breaking things." },
  { lang: "en", text: "Football, food, and family in that order." },
  { lang: "fr", text: "Douala. Commerçante. Je réponds lentement." },
  { lang: "fr", text: "Étudiant en informatique, amateur de makossa." },
  { lang: "pcm", text: "Na we dey here. Send message if you need anything." },
  { lang: "pcm", text: "Business na small small but e dey grow" },
  { lang: "pcm", text: "I no do long story, just ask me" },
];

/** A deliberately very long bio, to exercise text truncation. @type {string} */
export const OVERLONG_BIO =
  "Hey there. I am not great at the short bio thing so here is the long version. " +
  "I was born in Buea, moved to Douala for school, stayed because the rent was " +
  "already paid, and now I work in logistics near the port which means most of " +
  "my week is spent looking at spreadsheets and containers. I play football on " +
  "Saturdays when the pitch is not booked, I cook mostly on Sundays, and I am " +
  "currently learning to make a proper jollof without burning the bottom of the " +
  "pot. If you are reading this far you already know more about me than most " +
  "people in my contacts, which is either a compliment or a warning.";

/** A deliberately very long display name, to exercise truncation in headers. @type {string} */
export const OVERLONG_NAME =
  "Nkeng FOTso Tabi Atangana Mbarga Njoya Tchouanga Nkoulou Bekolo Ondoa Ndom";

/** A deliberately very long username. @type {string} */
export const OVERLONG_USERNAME =
  "nkeng_fotso_tabi_atangana_mbarga_njoya_tchouanga_very_long_handle_here";

/** Chat message text. @type {{ lang: string, text: string }[]} */
export const MESSAGE_FRAGMENTS = [
  { lang: "en", text: "You coming tonight?" },
  { lang: "en", text: "Send me the location again" },
  { lang: "en", text: "I will call you later" },
  { lang: "en", text: "Okay" },
  { lang: "en", text: "Wait what" },
  { lang: "fr", text: "On se voit demain?" },
  { lang: "fr", text: "Je t'appelle ce soir" },
  { lang: "pcm", text: "You di where?" },
  { lang: "pcm", text: "Make e quick, na we dey wait" },
  { lang: "pcm", text: "I go sleep soon, call am early" },
  { lang: "pcm", text: "No wahala, thanks" },
];

/** Single emoji strings used on their own and inline. @type {string[]} */
export const EMOJI_SETS = [
  "😂", "❤️", "🙏", "🔥", "😭", "🎉",
  "👍", "💯", "😅", "🇨🇲", "⚽", "🎶",
];

/**
 * An Arabic string, present so layouts can be checked against RTL content.
 * Screens are not required to support RTL, but the data must not break on it.
 * @type {string}
 */
export const RTL_SAMPLE =
  "مرحبا، هذه رسالة تجريبية باللغة العربية للتأكد أن العرض لا ينكسر مع النصوص من اليمين إلى اليسار.";

/** Sound titles for short videos. @type {string[]} */
export const SOUND_TITLES = [
  "Afrobeat Rythm", "Make Me Feel", "Slowed + Reverb",
  "Amapiano Log drums", "Original sound", "Bikutsi bounce",
];

/** Sound artists. @type {string[]} */
export const SOUND_ARTISTS = [
  "DJ Nfor", "Small Pikin", "Blaire B", "Muma Gee", "Lydian B", "Tassa King",
];

/** Story titles for highlights. @type {string[]} */
export const HIGHLIGHT_TITLES = [
  "Buea days", "Food", "Football", "Family", "Trips", "Motivation", "School",
];

/** Group names. @type {string[]} */
export const GROUP_NAMES = [
  "Buea Fam", "Douala Buy Sell", "MTN Yorma", "National Team Fans",
  "Cape Town Clinic", "Ankara Ankara", "Bamenda Unity", "Parents of BHS",
  "Yaba Region", "Night Owls", "Makossa Lovers", "Limbe Fishermen",
];

/** Channel names, which are broadcasts rather than conversations. @type {string[]} */
export const CHANNEL_NAMES = [
  "Breaking News Cameroon", "MTN Official", "Orange Cameroon",
  "Buea Weather", "Football Scores", "Douala Traffic",
];

/** Search terms for recent searches. @type {string[]} */
export const SEARCH_TERMS = [
  "buea", "makossa", "momo", "nalist", "football", "douala", "jollof",
  "ankara", "kribi", "mobile money", "bamenda", "pictures",
];

/**
 * Tunable knobs for the mock data set.
 *
 * Change DATA_VOLUME to generate more or less of everything; every generator
 * reads from here so the dataset stays internally consistent.
 */
export const DATA_VOLUME = {
  users: 40,
  posts: 150,
  shortVideos: 25,
  storyGroups: 20,
  conversations: 20,
  messagesPerConversation: 20,
  gamesPerConversation: { min: 2, max: 3 },
  callsPerConversation: { min: 4, max: 6 },
  notifications: 60,
  commentsPerPost: { min: 0, max: 12 },
  /** One post is deliberately loaded with hundreds of comments. */
  viralPostComments: 240,
  trendingTopics: 20,
  exploreItems: 60,
  groups: 10,
  channels: 6,
  highlightsPerUser: { min: 0, max: 3 },
};

/** The seed used for every generator. Change it for a completely different dataset. */
export const DEFAULT_SEED = "ping-cameroon-v1";

/** How many extra records `generateMore` appends per call when no count is given. */
export const GENERATOR_PAGE_SIZE = 20;

/**
 * Stable placeholder media URLs.
 *
 * Sources are deterministic so images do not flicker between reloads.
 * `BROKEN_MEDIA_URLS` are intentionally unreachable so image fallbacks can be
 * developed and tested before there is real media.
 */

/** @type {number[]} */
export const SQUARE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** @type {number[]} */
export const PORTRAIT_IDS = [100, 101, 102, 103, 104, 105, 106, 107, 108];
/** @type {number[]} */
export const LANDSCAPE_IDS = [200, 201, 202, 203, 204, 205, 206];
/** @type {number[]} */
export const AVATAR_IDS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
/** @type {number[]} */
export const COVER_IDS = [300, 301, 302, 303, 304];
/** @type {number[]} */
export const THUMB_IDS = [400, 401, 402, 403, 404, 405];

/** URLs that always fail, for fallback testing. @type {string[]} */
export const BROKEN_MEDIA_URLS = [
  "https://media.invalid/ping/broken-1.jpg",
  "https://media.invalid/ping/broken-2.jpg",
  "https://media.invalid/ping/missing-video.mp4",
];

/** Common shape helpers, so a screen can render media without guessing. */
export const ASPECT_SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1600, height: 900 },
};

/**
 * Build a stable placeholder image URL.
 * @param {string} kind "square" | "portrait" | "landscape" | "avatar" | "cover"
 * @param {number} n
 * @returns {string}
 */
export function imageUrl(kind, n) {
  if (kind === "avatar") return `https://i.pravatar.cc/300?img=${(n % 70) + 1}`;
  if (kind === "cover") return `https://picsum.photos/seed/ping-cover-${n}/1600/900`;
  if (kind === "square") return `https://picsum.photos/seed/ping-${n}/1080/1080`;
  if (kind === "portrait") return `https://picsum.photos/seed/ping-${n}/1080/1350`;
  return `https://picsum.photos/seed/ping-${n}/1600/900`;
}

/**
 * Build a stable placeholder video URL and its poster frame.
 * @param {number} n
 * @returns {{ url: string, thumbUrl: string }}
 */
export function videoUrl(n) {
  return {
    url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes-${(n % 15) + 1}.mp4`,
    thumbUrl: `https://picsum.photos/seed/ping-thumb-${n}/1080/1920`,
  };
}