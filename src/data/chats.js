// Sample conversations. Replace with real data / your API later.
//
// Group chats: set isGroup + members, and give each received message a `sender`
// that matches a member name. Every chat gets the blurred glass wallpaper;
// set `wallpaper` to a photo URL to change it, or `wallpaper: false` to turn it
// off. Messages can carry `reactions: [{ emoji, count }]`.
//
// Chat list flags (all optional, default false):
//   pinned   - floats to the top of the list (max 3 pinned at once)
//   muted    - mute icon on the row, gray unread badge
//   archived - hidden from every tab except "Archived"
const photo = (seed, w = 600, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
const face = (n) => `https://i.pravatar.cc/150?img=${n}`;
const member = (name, n) => ({ name, avatar: face(n) });

export const CONVERSATIONS = [
  {
    id: "6",
    name: "Visit Denpasar",
    avatar: photo("denpasar-trip", 200, 200),
    isGroup: true,
    online: false,
    status: "7 members",
    unread: 0,
    pinned: true,
    wallpaper: photo("denpasar-sunset", 600, 1000),
    members: [
      member("Akbar Lazuardi", 15),
      member("Fawzy Hakim", 33),
      member("Khai Azzahra", 44),
      member("Kira Lindegaard", 9),
      member("Musa Idris", 60),
      member("Smith Rahman", 52),
      member("Rohmad Saputra", 68),
    ],
    messages: [
      {
        id: "1",
        type: "text",
        text: "Do we need to prepare a van?",
        isMine: true,
        time: "8:15PM",
      },
      {
        id: "2",
        type: "text",
        text: "Oh, I think that's a good idea",
        isMine: false,
        sender: "Kira Lindegaard",
        time: "8:16PM",
      },
      {
        id: "3",
        type: "text",
        text: "Now how we get that? 🤔",
        isMine: false,
        sender: "Kira Lindegaard",
        time: "8:16PM",
      },
      {
        id: "4",
        type: "text",
        text: "We can use my dad van",
        isMine: false,
        sender: "Akbar Lazuardi",
        time: "8:19PM",
      },
      {
        id: "5",
        type: "photos",
        uris: [
          photo("den-van-a", 600, 700),
          photo("den-van-b", 600, 700),
          photo("den-van-c", 600, 700),
        ],
        total: 3,
        reactions: [
          { emoji: "🔥", count: 3 },
          { emoji: "❤️", count: 2 },
        ],
        isMine: false,
        sender: "Akbar Lazuardi",
        time: "8:19PM",
      },
      {
        id: "6",
        type: "text",
        text: "Oh that's nice Akbar",
        isMine: false,
        sender: "Khai Azzahra",
        time: "8:21PM",
      },
      {
        id: "7",
        type: "text",
        text: "@Rohmad would be the driver 🤭",
        isMine: false,
        sender: "Khai Azzahra",
        time: "8:21PM",
      },
      {
        id: "8",
        type: "text",
        text: "Perfect, I'll message him tonight",
        isMine: true,
        time: "8:22PM",
      },
    ],
  },
  {
    id: "1",
    name: "Wade Warren",
    avatar: face(47),
    online: true,
    status: "Active 8m ago",
    unread: 2,
    pinned: true,
    messages: [
      {
        id: "1",
        type: "text",
        text: "Hey, are we still meeting today?",
        isMine: false,
        time: "9:41 AM",
      },
      {
        id: "2",
        type: "image",
        uri: photo("ping-a"),
        isMine: false,
        time: "9:42 AM",
      },
      { id: "3", type: "voice", duration: 14, isMine: false, time: "9:42 AM" },
      {
        id: "4",
        type: "text",
        text: "Yes! Around 4pm works for me.",
        isMine: true,
        time: "9:45 AM",
      },
      { id: "5", type: "voice", duration: 8, isMine: true, time: "9:46 AM" },
      {
        id: "6",
        type: "image",
        uri: photo("ping-c"),
        caption: "Found this on the way, look at the sky!",
        isMine: true,
        time: "9:50 AM",
      },
      {
        id: "7",
        type: "video",
        thumbnail: photo("ping-b", 800, 600),
        duration: 24,
        caption: "Here is the place",
        isMine: false,
        time: "9:52 AM",
      },
      {
        id: "8",
        type: "video",
        thumbnail: photo("ping-d", 800, 600),
        duration: 61,
        isMine: true,
        time: "9:55 AM",
      },
      {
        id: "9",
        type: "viewOnce",
        kind: "photo",
        opened: false,
        isMine: true,
        time: "9:58 AM",
      },
      {
        id: "10",
        type: "viewOnce",
        kind: "video",
        opened: false,
        isMine: false,
        time: "10:01 AM",
      },
      {
        id: "11",
        type: "viewOnce",
        kind: "photo",
        opened: true,
        isMine: false,
        time: "10:02 AM",
      },
    ],
  },
  {
    id: "2",
    name: "Esther Howard",
    avatar: face(32),
    online: false,
    status: "Active yesterday",
    unread: 0,
    messages: [
      {
        id: "1",
        type: "text",
        text: "Did you get the files I sent?",
        isMine: false,
        time: "Yesterday",
      },
      {
        id: "2",
        type: "text",
        text: "Yes, thank you!",
        isMine: true,
        time: "Yesterday",
      },
    ],
  },
  {
    id: "3",
    name: "Jenny Wilson",
    avatar: face(5),
    online: true,
    status: "Active now",
    unread: 5,
    muted: true,
    messages: [
      {
        id: "1",
        type: "text",
        text: "Are you coming to the party on Friday?",
        isMine: false,
        time: "8:15 AM",
      },
      { id: "2", type: "voice", duration: 22, isMine: false, time: "8:16 AM" },
    ],
  },
  {
    id: "4",
    name: "Guy Hawkins",
    avatar: face(12),
    online: false,
    status: "Active 3h ago",
    unread: 0,
    archived: true,
    messages: [
      {
        id: "1",
        type: "image",
        uri: photo("ping-g"),
        caption: "New desk setup",
        isMine: true,
        time: "Mon",
      },
    ],
  },
  {
    id: "5",
    name: "Kristin Watson",
    avatar: face(25),
    online: false,
    status: "Active 2d ago",
    unread: 0,
    messages: [
      {
        id: "1",
        type: "text",
        text: "See you tomorrow then.",
        isMine: false,
        time: "Sun",
      },
    ],
  },
];

export const getConversation = (id) =>
  CONVERSATIONS.find((c) => c.id === String(id));
