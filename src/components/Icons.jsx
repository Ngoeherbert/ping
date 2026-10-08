import { HugeiconsIcon } from "@hugeicons/react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  Notification03Icon,
  Call02Icon,
  Video01Icon,
  BubbleChatIcon,
  UserIcon,
  ArrowLeft01Icon,
  PlusSignCircleIcon,
  SentIcon,
  Search01Icon,
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

export const UpdateIcon = make(Notification03Icon);
export const CallsIcon = make(Call02Icon);
export const ReelsIcon = make(Video01Icon);
export const ChatsIcon = make(BubbleChatIcon);
export const ProfileIcon = make(UserIcon);

// Plain (non-tab) icons: fixed stroke, used in headers, composer, etc.
const plain = (icon) =>
  function PlainIcon({ color = "#000", size = 22, strokeWidth = 1.7 }) {
    return <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />;
  };

export const BackIcon = plain(ArrowLeft01Icon);
export const PhoneIcon = plain(Call02Icon);
export const VideoCallIcon = plain(Video01Icon);
export const PlusCircleIcon = plain(PlusSignCircleIcon);
export const SendIcon = plain(SentIcon);
export const SearchIcon = plain(Search01Icon);

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
