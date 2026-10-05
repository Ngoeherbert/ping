import {
  Home05Icon,
  PlayListIcon,
  AddCircleIcon,
  Comment02Icon,
  User02Icon,
  ArrowLeft01Icon,
  SearchIcon,
  BellIcon,
  PlayIcon,
  PauseIcon,
  File02Icon,
  Download01Icon,
  GameController03Icon,
  Alert01Icon,
  ArrowReloadHorizontalIcon,
  AudioLinesIcon,
  Bookmark02Icon,
  CheckCheckIcon,
  CheckIcon,
  VolumeLowIcon,
  VolumeMute02Icon,
  Image02Icon,
  Comment01Icon,
  LinkForwardIcon,
  Forward02Icon,
  Share03Icon,
  SmilePlusIcon,
} from "@hugeicons/core-free-icons";

// name -> Hugeicons icon. To add an icon: import it above, add a line here.
export const libraryIcons = {
  profile: User02Icon,
  back: ArrowLeft01Icon,
  search: SearchIcon,
  play: PlayIcon,
  pause: PauseIcon,
  file: File02Icon,
  download: Download01Icon,
  game: GameController03Icon,

  // tab icon
  home: Home05Icon,
  create: AddCircleIcon,
  reels: PlayListIcon,

  // message
  chats: Comment02Icon,
  audio: AudioLinesIcon,
  check: CheckIcon,
  checkDouble: CheckCheckIcon,

  // post
  repost: ArrowReloadHorizontalIcon,
  comment: Comment01Icon,

  // re-usable
  notifications: BellIcon,
  volume: VolumeLowIcon,
  volumeMute: VolumeMute02Icon,
  report: Alert01Icon,
  bookmark: Bookmark02Icon,
  image: Image02Icon,
  fastForward: Forward02Icon,
  forward: LinkForwardIcon,
  share: Share03Icon,
  addReaction: SmilePlusIcon,
};

// Filled icons live in IconFiller.js
export const filledIconNames = ["heart", "bookmark", "verified"];
