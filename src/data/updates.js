// Sample status updates / feed posts for the Updates tab.
const face = (n) => `https://i.pravatar.cc/150?img=${n}`;
const photo = (seed, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Public sample clips for testing - swap for your own video URLs.
const clip = (name) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${name}.mp4`;

const TAGS = "#travel #traveling #socialenvy #vacation";
const CAPTION =
  "Tobias Ricky more or less. because a good woman for a good man, and everything in between.";

export const MY_STATUS = {
  name: "You",
  avatar: face(47),
  time: "Tap to add status",
};

export const STORIES = [
  {
    id: "my-status",
    name: "You",
    avatar: face(47),
    time: "Tap to add status",
    isMine: true,
  },
  {
    id: "1",
    name: "Esther Howard",
    avatar: face(32),
    time: "30 min ago",
    isMine: false,
  },
  {
    id: "2",
    name: "Jenny Wilson",
    avatar: face(5),
    time: "2 hours ago",
    isMine: false,
  },
  {
    id: "3",
    name: "Guy Hawkins",
    avatar: face(12),
    time: "4 hours ago",
    isMine: false,
  },
  {
    id: "4",
    name: "Kristin Watson",
    avatar: face(25),
    time: "6 hours ago",
    isMine: false,
  },
  {
    id: "5",
    name: "Ronald Richards",
    avatar: face(38),
    time: "Yesterday",
    isMine: false,
  },
  {
    id: "6",
    name: "Annette Black",
    avatar: face(44),
    time: "Yesterday",
    isMine: false,
  },
  {
    id: "7",
    name: "Wade Warren",
    avatar: face(47),
    time: "Yesterday",
    isMine: false,
  },
];

// Feed posts.
//   Photo post: `image` (+ `verified` and the Follow button, or `collaborators`)
//   Video post: `video` uri + `videoDuration` ("0:15"), `image` is the poster
//               and `collaborators` replaces the Follow button
export const UPDATES = [
  // Photo post - verified + Follow
  {
    id: "1",
    name: "Jacob Jones",
    avatar: face(49),
    verified: true,
    time: "2hr ago",
    text: `${CAPTION} ${TAGS}`,
    image: photo("tent-camp", 800, 800),
    liked: true,
    likes: 120,
    comments: 65,
  },

  // Video post - collaborators + sound pill
  {
    id: "2",
    name: "Jacob Jones",
    avatar: face(49),
    verified: false,
    time: "2hr ago",
    text: `${CAPTION} ${TAGS}`,
    video: clip("ForBiggerBlazes"),
    image: photo("river-boat", 900, 600),
    videoDuration: "0:15",
    aspect: 1.5,
    collaborators: [
      { id: "c1", name: "Esther Howard", avatar: face(32) },
      { id: "c2", name: "Jenny Wilson", avatar: face(5) },
    ],
    liked: true,
    likes: 120,
    comments: 65,
  },

  // Photo post - not verified
  {
    id: "3",
    name: "Esther Howard",
    avatar: face(32),
    verified: false,
    time: "5hr ago",
    text: "Golden hour over the old town. Worth the early alarm. #sunrise #citywalk #photography",
    image: photo("old-town", 800, 800),
    likes: 48,
    comments: 9,
  },

  // Video post - verified, with Follow instead of collaborators
  {
    id: "4",
    name: "Guy Hawkins",
    avatar: face(12),
    verified: true,
    time: "Yesterday",
    text: "Trail run before work, no music, just the forest. #running #outdoors",
    video: clip("ForBiggerEscapes"),
    image: photo("forest-run", 900, 600),
    videoDuration: "0:15",
    aspect: 1.5,
    likes: 1520,
    comments: 143,
  },

  // Photo post - with collaborators
  {
    id: "5",
    name: "Kristin Watson",
    avatar: face(25),
    verified: true,
    time: "Sat",
    text: "Weekend market haul with these two. Fresh bread, too many flowers. #market #weekend",
    image: photo("market-day", 800, 1000),
    aspect: 0.8,
    collaborators: [
      { id: "c3", name: "Annette Black", avatar: face(44) },
      { id: "c4", name: "Wade Warren", avatar: face(47) },
    ],
    saved: true,
    likes: 312,
    comments: 27,
  },

  // Thread post - single text post with repliers
  {
    id: "6",
    type: "thread",
    name: "Guy Hawkins",
    avatar: face(12),
    verified: true,
    time: "3h",
    text: "Hot take: the best apps in 2026 are the ones that let you turn off the feed. Fight me. #buildinpublic #uxdesign",
    repliers: [
      { id: "r1", name: "Esther Howard", avatar: face(32) },
      { id: "r2", name: "Jenny Wilson", avatar: face(5) },
      { id: "r3", name: "Wade Warren", avatar: face(47) },
    ],
    likes: 842,
    comments: 96,
    reposts: 31,
  },

  // Thread post - multi-part thread with an image in a later part
  {
    id: "7",
    type: "thread",
    name: "Jenny Wilson",
    avatar: face(5),
    verified: false,
    time: "6h",
    text: "I rebuilt our onboarding from scratch last week. Here's everything that changed 🧵 @Esther",
    thread: [
      {
        id: "7a",
        text: "1/ We cut signup from 7 steps to 3. Drop-off fell by almost a third.",
      },
      {
        id: "7b",
        text: "2/ Biggest win: only asking for permissions when a feature actually needs them. #onboarding",
        image: photo("onboarding-screens", 800, 640),
        aspect: 1.25,
      },
    ],
    repliers: [
      { id: "r4", name: "Kristin Watson", avatar: face(25) },
      { id: "r5", name: "Annette Black", avatar: face(44) },
    ],
    likes: 214,
    comments: 38,
    reposts: 12,
    liked: true,
  },

  // Thread post - text with an image
  {
    id: "8",
    type: "thread",
    name: "Ronald Richards",
    avatar: face(38),
    verified: false,
    time: "Yesterday",
    text: "Shipped the new profile screen today. Big thanks to @Annette for the late-night reviews. #shipit",
    image: photo("profile-screen", 800, 640),
    aspect: 1.25,
    likes: 96,
    comments: 7,
    reposts: 3,
  },
];
