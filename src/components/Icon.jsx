import { HugeiconsIcon } from "@hugeicons/react-native";
import { colors } from "../theme";
import IconFiller from "../constants/iconFiller";
import { libraryIcons, filledIconNames } from "../constants/icons";

const FILLED = new Set(filledIconNames);

export default function Icon({
  icon,
  name,
  size = 24,
  color = colors.text,
  strokeWidth = 1.5,
  ...rest
}) {
  // Filled icons: heart, bookmark, verified
  if (name && FILLED.has(name)) {
    return <IconFiller name={name} size={size} color={color} {...rest} />;
  }

  // Named icons from the library registry, or an icon passed directly
  const resolved = name ? libraryIcons[name] : undefined;
  const data = resolved ?? icon;
  if (!data) return null;

  return (
    <HugeiconsIcon
      icon={data}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}
