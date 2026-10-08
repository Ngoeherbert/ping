// Sample conversations. Replace with real data / your API later.
const photo = (seed, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const face = (n) => `https://i.pravatar.cc/150?img=${n}`;

export const CONVERSATIONS = [
  {
    id: "1",
    name: "Wade Warren",
    avatar: face(47),
    online: true,
    status: "Active 8m ago",
    unread: 2,
    messages: [
      { id: "1", type: "text", text: "Hey, are we still meeting today?", isMine: false, time: "9:41 AM" },
      { id: "2", type: "image", uri: photo("ping-a"), isMine: false, time: "9:42 AM" },
      { id: "3", type: "voice", duration: 14, isMine: false, time: "9:42 AM" },
      { id: "4", type: "text", text: "Yes! Around 4pm works for me.", isMine: true, time: "9:45 AM" },
      { id: "5", type: "voice", duration: 8, isMine: true, time: "9:46 AM" },
      { id: "6", type: "image", uri: photo("ping-c"), caption: "Found this on the way, look at the sky!", isMine: true, time: "9:50 AM" },
      { id: "7", type: "video", thumbnail: photo("ping-b", 800, 600), duration: 24, caption: "Here is the place", isMine: false, time: "9:52 AM" },
      { id: "8", type: "video", thumbnail: photo("ping-d", 800, 600), duration: 61, isMine: true, time: "9:55 AM" },
      { id: "9", type: "viewOnce", kind: "photo", opened: false, isMine: true, time: "9:58 AM" },
      { id: "10", type: "viewOnce", kind: "video", opened: false, isMine: false, time: "10:01 AM" },
      { id: "11", type: "viewOnce", kind: "photo", opened: true, isMine: false, time: "10:02 AM" },
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
      { id: "1", type: "text", text: "Did you get the files I sent?", isMine: false, time: "Yesterday" },
      { id: "2", type: "text", text: "Yes, thank you!", isMine: true, time: "Yesterday" },
    ],
  },
  {
    id: "3",
    name: "Jenny Wilson",
    avatar: face(5),
    online: true,
    status: "Active now",
    unread: 5,
    messages: [
      { id: "1", type: "text", text: "Are you coming to the party on Friday?", isMine: false, time: "8:15 AM" },
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
    messages: [
      { id: "1", type: "image", uri: photo("ping-g"), caption: "New desk setup", isMine: true, time: "Mon" },
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
      { id: "1", type: "text", text: "See you tomorrow then.", isMine: false, time: "Sun" },
    ],
  },
];

export const getConversation = (id) => CONVERSATIONS.find((c) => c.id === String(id));
