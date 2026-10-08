import Svg, { Path, Circle, Rect } from "react-native-svg";

// Small hand-drawn glyphs so no extra icon names are needed from Hugeicons.

export const MoreVerticalGlyph = ({ color = "#000", size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="5" r="1.8" fill={color} />
    <Circle cx="12" cy="12" r="1.8" fill={color} />
    <Circle cx="12" cy="19" r="1.8" fill={color} />
  </Svg>
);

export const PlusGlyph = ({ color = "#000", size = 24, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

export const CameraGlyph = ({ color = "#000", size = 24, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2a1 1 0 0 0 .8-.4l.7-1A1.5 1.5 0 0 1 10.4 4h3.2a1.5 1.5 0 0 1 1.2.6l.7 1a1 1 0 0 0 .8.4h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="none"
    />
    <Circle cx="12" cy="12.5" r="3.2" stroke={color} strokeWidth={strokeWidth} fill="none" />
  </Svg>
);

export const StickerGlyph = ({ color = "#000", size = 24, strokeWidth = 1.6 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M6 3h12a3 3 0 0 1 3 3v8l-7 7H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M21 14h-4a3 3 0 0 0-3 3v4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="none"
    />
    <Circle cx="9" cy="9.5" r="1" fill={color} />
    <Circle cx="15" cy="9.5" r="1" fill={color} />
    <Path
      d="M8.5 13.5c1 1.3 2.2 1.8 3.5 1.8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

export const MicGlyph = ({ color = "#000", size = 24, strokeWidth = 1.8 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
    <Path
      d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);
