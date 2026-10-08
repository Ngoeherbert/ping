// Sample status updates / channel posts for the Updates tab.
const face = (n) => `https://i.pravatar.cc/150?img=${n}`;
const photo = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MY_STATUS = {
  name: "You",
  avatar: face(47),
  time: "Tap to add status",
};

export const STORIES = [
  { id: "my-status", name: "You", avatar: face(47), time: "Tap to add status", isMine: true },
  { id: "1", name: "Esther Howard", avatar: face(32), time: "30 min ago", isMine: false },
  { id: "2", name: "Jenny Wilson", avatar: face(5), time: "2 hours ago", isMine: false },
  { id: "3", name: "Guy Hawkins", avatar: face(12), time: "4 hours ago", isMine: false },
  { id: "4", name: "Kristin Watson", avatar: face(25), time: "6 hours ago", isMine: false },
  { id: "5", name: "Ronald Richards", avatar: face(38), time: "Yesterday", isMine: false },
  { id: "6", name: "Annette Black", avatar: face(44), time: "Yesterday", isMine: false },
  { id: "7", name: "Wade Warren", avatar: face(47), time: "Yesterday", isMine: false },
];

export const UPDATES = [
  {
    id: "1",
    type: "channel",
    name: "Design Daily",
    avatar: photo("design-daily", 200, 200),
    verified: true,
    time: "2h ago",
    preview: "New design system released — explore the new components and tokens.",
    muted: false,
  },
  {
    id: "2",
    type: "channel",
    name: "Team Sync",
    avatar: photo("team-sync", 200, 200),
    verified: false,
    time: "5h ago",
    preview: "Weekly sync notes are now available. Review before tomorrow's meeting.",
    muted: true,
  },
  {
    id: "3",
    type: "group",
    name: "Visit Denpasar",
    avatar: photo("denpasar-trip", 200, 200),
    verified: false,
    time: "Mon",
    preview: "Akbar: We can use my dad van for the trip",
    muted: false,
  },
  {
    id: "4",
    type: "channel",
    name: "Tech News",
    avatar: photo("tech-news", 200, 200),
    verified: true,
    time: "Sun",
    preview: "New framework X launches with 3x faster compile times.",
    muted: false,
  },
  {
    id: "5",
    type: "group",
    name: "Roommates",
    avatar: photo("roommates", 200, 200),
    verified: false,
    time: "Sat",
    preview: "Electricity bill is due on the 15th this month.",
    muted: false,
  },
];
