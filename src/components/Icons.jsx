import { HugeiconsIcon } from "@hugeicons/react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  BubbleChatTemporaryIcon,
  Call02Icon,
  Video01Icon,
  Comment01Icon,
  User02Icon,
  ArrowLeft01Icon,
  PlusSignCircleIcon,
  SentIcon,
  Search01Icon,
  Camera01Icon,
  Edit01Icon,
  Settings01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  CallEnd01Icon,
  CallIncoming01Icon,
  CallMissed02Icon,
  CallOutgoing01Icon,
  VideoOffIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  HeartIcon,
  Share01Icon,
  Bookmark01Icon,
  UserAdd01Icon,
  Crown02Icon,
  SparkleIcon,
  Shield01Icon,
  Moon01Icon,
  Sun03Icon,
  LanguagesIcon,
  InformationCircleIcon,
  LogOutIcon,
  Copy01Icon,
  Link01Icon,
  PlayListIcon,
  CommentAdd01Icon,
} from "@hugeicons/core-free-icons";

// Hugeicons Free is stroke-only, so the active state is a heavier stroke
// (the highlighted pill in BottomBar does the rest).
const make = (icon) =>
  function TabIcon({ color = "#000", size = 24, filled = false }) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size}
        color={color}
        strokeWidth={filled ? 2.1 : 1.5}
      />
    );
  };

export const UpdateIcon = make(BubbleChatTemporaryIcon);
export const CallsIcon = make(Call02Icon);
export const ReelsIcon = make(PlayListIcon);
export const ChatsIcon = make(Comment01Icon);
export const ProfileIcon = make(User02Icon);

// Plain (non-tab) icons: fixed stroke, used in headers, composer, etc.
const plain = (icon) =>
  function PlainIcon({ color = "#000", size = 22, strokeWidth = 1.7 }) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
      />
    );
  };

export const BackIcon = plain(ArrowLeft01Icon);
export const PhoneIcon = plain(Call02Icon);
export const VideoCallIcon = plain(Video01Icon);
export const PlusCircleIcon = plain(PlusSignCircleIcon);
export const SendIcon = plain(SentIcon);
export const addChat = plain(CommentAdd01Icon);
export const SearchIcon = plain(Search01Icon);
export const CameraIcon = plain(Camera01Icon);
export const EditIcon = plain(Edit01Icon);
export const SettingsIcon = plain(Settings01Icon);
export const ArrowRightIcon = plain(ArrowRight01Icon);
export const ArrowUpIcon = plain(ArrowUp01Icon);
export const CallEndIcon = plain(CallEnd01Icon);
export const CallIncomingIcon = plain(CallIncoming01Icon);
export const CallMissedIcon = plain(CallMissed02Icon);
export const CallOutgoingIcon = plain(CallOutgoing01Icon);
export const VideoOffIcon2 = plain(VideoOffIcon);
export const VolumeHighIcon2 = plain(VolumeHighIcon);
export const VolumeOffIcon2 = plain(VolumeOffIcon);
export const HeartIcon2 = plain(HeartIcon);
export const CommentIcon = plain(Comment01Icon);
export const ShareIcon = plain(Share01Icon);
export const BookmarkIcon = plain(Bookmark01Icon);
export const UserAddIcon = plain(UserAdd01Icon);
export const CrownIcon = plain(Crown02Icon);
export const SparkleIcon2 = plain(SparkleIcon);
export const ShieldIcon = plain(Shield01Icon);
export const MoonIcon = plain(Moon01Icon);
export const SunIcon = plain(Sun03Icon);
export const LanguagesIcon2 = plain(LanguagesIcon);
export const InfoCircleIcon = plain(InformationCircleIcon);
export const LogOutIcon2 = plain(LogOutIcon);
export const CopyIcon = plain(Copy01Icon);
export const LinkIcon = plain(Link01Icon);

// Solid glyphs for media controls (play / pause)
// Triangle whose centre of mass sits exactly on the middle of the box,
// so it looks centred inside a circle with no extra nudging.
export const PlayGlyph = ({ color = "#000", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M8 5v14l12-7z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

export const PauseGlyph = ({ color = "#000", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="6" y="4.5" width="4.2" height="15" rx="1.4" fill={color} />
    <Rect x="13.8" y="4.5" width="4.2" height="15" rx="1.4" fill={color} />
  </Svg>
);
