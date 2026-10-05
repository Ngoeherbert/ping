import Svg, { Path } from "react-native-svg";

const HEART_PATH =
  "M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z";

const BADGE_PATH =
  "M18.9905 19H19M18.9905 19C18.3678 19.6175 17.2393 19.4637 16.4479 19.4637C15.4765 19.4637 15.0087 19.6537 14.3154 20.347C13.7251 20.9374 12.9337 22 12 22C11.0663 22 10.2749 20.9374 9.68457 20.347C8.99128 19.6537 8.52349 19.4637 7.55206 19.4637C6.76068 19.4637 5.63218 19.6175 5.00949 19C4.38181 18.3776 4.53628 17.2444 4.53628 16.4479C4.53628 15.4414 4.31616 14.9786 3.59938 14.2618C2.53314 13.1956 2.00002 12.6624 2 12C2.00001 11.3375 2.53312 10.8044 3.59935 9.73817C4.2392 9.09832 4.53628 8.46428 4.53628 7.55206C4.53628 6.76065 4.38249 5.63214 5 5.00944C5.62243 4.38178 6.7556 4.53626 7.55208 4.53626C8.46427 4.53626 9.09832 4.2392 9.73815 3.59937C10.8044 2.53312 11.3375 2 12 2C12.6625 2 13.1956 2.53312 14.2618 3.59937C14.9015 4.23907 15.5355 4.53626 16.4479 4.53626C17.2393 4.53626 18.3679 4.38247 18.9906 5C19.6182 5.62243 19.4637 6.75559 19.4637 7.55206C19.4637 8.55858 19.6839 9.02137 20.4006 9.73817C21.4669 10.8044 22 11.3375 22 12C22 12.6624 21.4669 13.1956 20.4006 14.2618C19.6838 14.9786 19.4637 15.4414 19.4637 16.4479C19.4637 17.2444 19.6182 18.3776 18.9905 19Z";

const CHECK_PATH = "M9 12.8929L10.8 14.5L15 9.5";

const BOOKMARK_PATH =
  "M4 17.9808V9.70753C4 6.07416 4 4.25748 5.17157 3.12874C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.12874C20 4.25748 20 6.07416 20 9.70753V17.9808C20 20.2867 20 21.4396 19.2272 21.8523C17.7305 22.6514 14.9232 19.9852 13.59 19.1824C12.8168 18.7168 12.4302 18.484 12 18.484C11.5698 18.484 11.1832 18.7168 10.41 19.1824C9.0768 19.9852 6.26947 22.6514 4.77285 21.8523C4 21.4396 4 20.2867 4 17.9808Z";

const HEART_ACTIVE = "#FF3040";
const VERIFIED_BLUE = "#0A84FF";

// Renders one Hugeicons path: outline by default, filled when `filled` is true
function ShapeIcon({
  d,
  size = 24,
  color = "#111111",
  filled = false,
  strokeWidth = 1.5,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeartIcon({ active, size = 24, color = "#111111" }) {
  return (
    <ShapeIcon
      d={HEART_PATH}
      size={size}
      color={active ? HEART_ACTIVE : color}
      filled={!!active}
    />
  );
}

export function BookmarkIcon({ active, size = 24, color = "#111111" }) {
  return (
    <ShapeIcon d={BOOKMARK_PATH} size={size} color={color} filled={!!active} />
  );
}

export function VerifiedBadge({ size = 18, color = VERIFIED_BLUE }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={BADGE_PATH} fill={color} stroke={color} strokeWidth={1.5} />
      <Path
        d={CHECK_PATH}
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Generic: <IconFiller name="heart" active color="#FF3040" />
export default function IconFiller({ name, ...props }) {
  switch (name) {
    case "heart":
      return <HeartIcon {...props} />;
    case "bookmark":
      return <BookmarkIcon {...props} />;
    case "verified":
      return <VerifiedBadge {...props} />;
    default:
      return null;
  }
}
