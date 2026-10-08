// Sample reels for the Reels tab.
const photo = (seed) => `https://picsum.photos/seed/${seed}/720/1280`;
const face = (n) => `https://i.pravatar.cc/150?img=${n}`;

export const REELS = [
  {
    id: "1",
    uri: photo("reel-1"),
    user: "Wade Warren",
    avatar: face(47),
    caption: "Chasing sunsets and good vibes ✨",
    likes: 1240,
    comments: 87,
    liked: false,
    saved: false,
  },
  {
    id: "2",
    uri: photo("reel-2"),
    user: "Esther Howard",
    avatar: face(32),
    caption: "Coffee shop corner vibes ☕",
    likes: 892,
    comments: 43,
    liked: true,
    saved: false,
  },
  {
    id: "3",
    uri: photo("reel-3"),
    user: "Jenny Wilson",
    avatar: face(5),
    caption: "Weekend mood: explore mode activated 🚗",
    likes: 2105,
    comments: 156,
    liked: false,
    saved: true,
  },
  {
    id: "4",
    uri: photo("reel-4"),
    user: "Guy Hawkins",
    avatar: face(12),
    caption: "Mountain air, city heart 🏔️",
    likes: 654,
    comments: 32,
    liked: false,
    saved: false,
  },
  {
    id: "5",
    uri: photo("reel-5"),
    user: "Kristin Watson",
    avatar: face(25),
    caption: "That golden hour glow though...",
    likes: 1430,
    comments: 98,
    liked: true,
    saved: true,
  },
];

export const currentUser = {
  name: "You",
  avatar: face(47),
};
