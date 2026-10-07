// components/Icon.jsx
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Message01Icon,
  Home01Icon,
  AddCircleIcon,
  PlayCircleIcon,
  UserIcon,
  Search01Icon,
  Notification01Icon,
  Camera01Icon,
  FavouriteIcon,
  Comment01Icon,
  SentIcon,
  Settings01Icon,
  ArrowLeft01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

// One place to map your app's icon names to HugeIcons assets.
const ICONS = {
  chats: Message01Icon,
  feed: Home01Icon,
  create: AddCircleIcon,
  reels: PlayCircleIcon,
  profile: UserIcon,
  search: Search01Icon,
  notifications: Notification01Icon,
  camera: Camera01Icon,
  like: FavouriteIcon,
  comment: Comment01Icon,
  send: SentIcon,
  settings: Settings01Icon,
  back: ArrowLeft01Icon,
  more: MoreVerticalIcon,
};

export function Icon({
  name,
  size = 24,
  color = "#111111",
  active = false,
  strokeWidth,
  ...rest
}) {
  const icon = ICONS[name];

  if (!icon) {
    if (__DEV__) console.warn(`Icon "${name}" is not registered in components/Icon.jsx`);
    return null;
  }

  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      // The free pack is stroke-only, so "active" is shown with a heavier stroke
      strokeWidth={strokeWidth ?? (active ? 2.2 : 1.5)}
      {...rest}
    />
  );
}