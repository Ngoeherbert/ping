import { HugeiconsIcon } from "@hugeicons/react-native";
import { colors } from "../theme";
import IconFiller from "../constants/iconFiller";

export default function Icon({
  icon,
  name,
  size = 24,
  color = colors.text,
  strokeWidth = 1.5,
  ...rest
}) {
  // Filled icons: heart, bookmark, verified
  if (name) {
    return <IconFiller name={name} size={size} color={color} {...rest} />;
  }

  // Hugeicons library icons
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}
