// Reusable HugeIcons component, used by name:
//
//   import Icon from "../components/icons";
//   <Icon name="search" size={20} />
//   <Icon name="camera" size={16} color={colors.textMuted} />
//
// Install once:
//   npx expo install react-native-svg
//   npm i @hugeicons/react-native @hugeicons/core-free-icons
//
// To add an icon: import it from "@hugeicons/core-free-icons" and add one
// line to ICONS below (key = the name you'll use in <Icon name="..." />).

import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  Archive02Icon,
  BellIcon,
  Bookmark02Icon,
  BubbleChatTemporaryIcon,
  Call02Icon,
  CallIncoming01Icon,
  CallMissed02Icon,
  CallOutgoing01Icon,
  Camera01Icon,
  Cancel01Icon,
  Comment01Icon,
  CommentBlock01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit01Icon,
  CommentRemove01Icon,
  Folder01Icon,
  LinkForwardIcon,
  Globe02Icon,
  HeartIcon,
  Home05Icon,
  InformationCircleIcon,
  LanguagesIcon,
  LogOutIcon,
  Mic01Icon,
  Moon01Icon,
  MoreHorizontalIcon,
  NotificationOff01Icon,
  PauseIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  PlayListIcon,
  LinkBackwardIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  Share03Icon,
  Shield01Icon,
  StarIcon,
  StickerIcon,
  Sun03Icon,
  Tick02Icon,
  UserIcon,
  User02Icon,
  UserBlock01Icon,
  UserBlock02Icon,
  Video01Icon,
  VolumeHighIcon,
  VolumeOffIcon,
  UserCircleIcon,
  Location01Icon,
  Gamepad01Icon,
  File02Icon,
  Image01Icon,
  KeyboardIcon,
  DeviceAccessIcon
} from "@hugeicons/core-free-icons";
import { useTheme } from "../theme/useTheme";

const ICONS = {
  // navigation / general
  back: ArrowLeft01Icon,
  search: Search01Icon,
  close: Cancel01Icon,
  add: Add01Icon,
  home: Home05Icon,
  user: UserIcon,
  settings: Settings01Icon,
  edit: Edit01Icon,
  folder: Folder01Icon,
  more: MoreHorizontalIcon,

  // chat list
  archive: Archive02Icon,
  delete: Delete02Icon,
  pin: PinIcon,
  "pin-off": PinOffIcon,
  clear: CommentRemove01Icon,
  block: UserBlock01Icon,
  "block-alt": UserBlock02Icon,
  mute: NotificationOff01Icon,
  tick: Tick02Icon,
  star: StarIcon,

  // message types / composer
  camera: Camera01Icon,
  video: Video01Icon,
  mic: Mic01Icon,
  sticker: StickerIcon,
  send: SentIcon,
  copy: Copy01Icon,
  reply: LinkBackwardIcon,
  forward: LinkForwardIcon,

  // media playback
  play: PlayIcon,
  pause: PauseIcon,

  // calls
  calls: Call02Icon,
  "call-incoming": CallIncoming01Icon,
  "call-outgoing": CallOutgoing01Icon,
  "call-missed": CallMissed02Icon,
  "info-circle": InformationCircleIcon,

  // updates / feed
  updates: BubbleChatTemporaryIcon,
  bell: BellIcon,
  globe: Globe02Icon,
  "speaker-on": VolumeHighIcon,
  "speaker-off": VolumeOffIcon,
  heart: HeartIcon,
  comment: Comment01Icon,
  "comment-block": CommentBlock01Icon,
  share: Share03Icon,
  bookmark: Bookmark02Icon,
  repost: ArrowReloadHorizontalIcon,

  // profile
  moon: Moon01Icon,
  sun: Sun03Icon,
  languages: LanguagesIcon,
  shield: Shield01Icon,
  logout: LogOutIcon,

  // bottom tab bar
  reels: PlayListIcon,
  chats: Comment01Icon,
  profile: User02Icon,

  // panel icons
  contact: UserCircleIcon,
  location: Location01Icon,
  game: Gamepad01Icon,
  file: File02Icon,
  image: Image01Icon,
  keyboard: KeyboardIcon,
  link: DeviceAccessIcon,
};

export default function Icon({
  name,
  size = 24,
  color,
  strokeWidth = 1.5,
  ...rest
}) {
  const { colors } = useTheme();
  const icon = ICONS[name];

  if (!icon) {
    if (__DEV__) {
      console.warn(
        `<Icon name="${name}"> is not registered. Available: ${Object.keys(
          ICONS,
        ).join(", ")}`,
      );
    }
    return null;
  }

  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color ?? colors.text}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}
