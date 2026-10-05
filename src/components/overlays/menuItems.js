import { View, Text, Pressable } from "react-native";
import Icon from "../Icon";
import { useOverlayTheme } from "./overlayTheme";
import { haptic } from "../../utils/haptics";

/**
 * One option row shape shared by DropdownMenu and ActionSheet, so a screen
 * builds its option list once and shows it either way.
 *
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} label
 * @property {string} [icon] Icon registry name (see src/constants/icons.js).
 * @property {string} [subtitle]
 * @property {boolean} [destructive] Red styling for delete/remove actions.
 * @property {boolean} [disabled]
 * @property {boolean} [checked] Checkmark for selected state.
 * @property {boolean} [keepOpen] Do not close the menu after this item.
 * @property {(id: string) => void} [onPress]
 *
 * @typedef {Object} MenuDivider
 * @property {"divider"} divider
 * @property {string} [id]
 *
 * @typedef {Object} MenuHeader
 * @property {"header"} header
 * @property {string} title
 * @property {string} [id]
 *
 * @typedef {MenuItem|MenuDivider|MenuHeader} MenuEntry
 */

export const isDivider = (entry) => entry?.divider === "divider";
export const isHeader = (entry) => entry?.header === "header";

/**
 * A single tappable row. Used by DropdownMenu and ActionSheet list mode.
 * Minimum 44pt touch target, mirrored automatically in RTL.
 */
export function MenuRow({ item, onSelect, testID }) {
  const theme = useOverlayTheme();
  const { colors, spacing, fontSize } = theme;
  const disabled = !!item.disabled;
  const destructive = !!item.destructive && !disabled;
  const labelColor = disabled ? colors.disabled : destructive ? colors.destructive : colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.select();
        onSelect?.(item);
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        opacity: pressed ? 0.6 : disabled ? 0.5 : 1,
      })}
    >
      {item.icon ? (
        <View style={{ marginEnd: spacing.md }}>
          <Icon name={item.icon} size={20} color={labelColor} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: fontSize.md, color: labelColor, fontWeight: destructive ? "600" : "400" }}
        >
          {item.label}
        </Text>
        {item.subtitle ? (
          <Text numberOfLines={1} style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 }}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      {item.checked ? <Icon name="check" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

export function MenuSeparator() {
  const theme = useOverlayTheme();
  return <View style={{ height: 1, backgroundColor: theme.colors.divider }} />;
}

export function MenuSectionHeader({ title }) {
  const theme = useOverlayTheme();
  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: 10, paddingBottom: 4 }}>
      <Text style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: "600" }}>
        {title}
      </Text>
    </View>
  );
}
