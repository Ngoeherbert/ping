import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import BottomSheet from "./BottomSheet";
import Icon from "../Icon";
import { useOverlayTheme } from "./overlayTheme";
import { MenuRow, MenuSeparator, MenuSectionHeader, isDivider, isHeader } from "./menuItems";
import { haptic } from "../../utils/haptics";

const GRID_COLUMNS = 4;
const GRID_PAGE_SIZE = 8;

export default function ActionSheet({
  visible = false,
  onClose,
  onOpened,
  onSnapChange,
  items = [],
  title = null,
  message = null,
  layout = "list",
  cancelLabel = "Cancel",
  showCancel = true,
  closeOnSelect = true,
  columns = GRID_COLUMNS,
  pageSize = GRID_PAGE_SIZE,
  testID,
  rootInsets = null,
}) {
  const theme = useOverlayTheme();
  const { colors, spacing, fontSize } = theme;

  const close = useCallback(() => {
    haptic.light();
    onClose?.();
  }, [onClose]);

  const handleSelect = useCallback(
    (item) => {
      try {
        item?.onPress?.(item.id);
      } catch {
        // Item handlers own their errors; the sheet still closes.
      }
      if (closeOnSelect && !item?.keepOpen) close();
    },
    [close, closeOnSelect],
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      onOpened={onOpened}
      onSnapChange={onSnapChange}
      snapPoints={["auto"]}
      showCloseButton={false}
      dismissable
      testID={testID}
      rootInsets={rootInsets}
    >
      <View accessibilityRole="menu">
        {title || message ? (
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: 4, paddingBottom: spacing.md, alignItems: "center" }}>
            {title ? (
              <Text style={{ fontSize: fontSize.md, fontWeight: "700", color: colors.text, textAlign: "center" }}>
                {title}
              </Text>
            ) : null}
            {message ? (
              <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center", marginTop: 4 }}>
                {message}
              </Text>
            ) : null}
          </View>
        ) : null}
        {layout === "grid" ? (
          <ActionGrid
            items={items.filter((e) => !isDivider(e) && !isHeader(e))}
            columns={columns}
            pageSize={pageSize}
            onSelect={handleSelect}
          />
        ) : (
          <View>
            {items.map((entry, index) =>
              renderListEntry(entry, index, handleSelect),
            )}
          </View>
        )}
        {showCancel ? (
          <View>
            <View style={{ height: 8, backgroundColor: colors.surface }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={close}
              style={({ pressed }) => ({
                minHeight: 52,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: fontSize.md, fontWeight: "600", color: colors.text }}>
                {cancelLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function renderListEntry(entry, index, handleSelect) {
  if (!entry) return null;
  const key = entry.id ?? `entry_${index}`;
  if (isDivider(entry)) {
    return (
      <View key={key}>
        <MenuSeparator />
      </View>
    );
  }
  if (isHeader(entry)) return <MenuSectionHeader key={key} title={entry.title} />;
  return <MenuRow key={key} item={entry} onSelect={handleSelect} />;
}

/**
 * Grid of icon tiles (share targets, attachment pickers). Pages horizontally
 * with dots when there are more items than fit one screen.
 */
function ActionGrid({ items, columns, pageSize, onSelect }) {
  const theme = useOverlayTheme();
  const { colors, spacing, fontSize } = theme;
  const { width: screenWidth } = useWindowDimensions();
  const gridWidth = Math.min(screenWidth, 560);
  const perPage = Math.max(columns, pageSize);
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  const [page, setPage] = useState(0);

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / gridWidth))
        }
        style={{ width: gridWidth, alignSelf: "center" }}
      >
        {pages.map((chunk, pageIndex) => (
          <View
            key={`page_${pageIndex}`}
            style={{
              width: gridWidth,
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: spacing.md,
            }}
          >
            {chunk.map((item) => {
              const disabled = !!item.disabled;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  onPress={() => {
                    // handleSelect owns onPress and closing; MenuRow-style
                    // haptics are fired here since grids bypass MenuRow.
                    haptic.select();
                    onSelect?.(item);
                  }}
                  style={({ pressed }) => ({
                    width: `${100 / columns}%`,
                    alignItems: "center",
                    paddingVertical: spacing.sm,
                    opacity: pressed ? 0.6 : disabled ? 0.5 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: theme.radius.lg,
                      backgroundColor: item.color ?? colors.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={24}
                      color={item.iconColor ?? colors.text}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: fontSize.xs ?? 11,
                      color: colors.textMuted,
                      marginTop: 4,
                      textAlign: "center",
                      maxWidth: "90%",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            gap: 6,
          }}
        >
          {pages.map((_, pageIndex) => (
            <View
              key={`dot_${pageIndex}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  pageIndex === page ? colors.text : colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
