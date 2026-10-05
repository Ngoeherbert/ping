/**
 * Overlay kit entry point. Screens import everything overlays from here:
 * `import { BottomSheet, useBottomSheet, useConfirm } from "../components/overlays";`
 */

export { default as OverlayHost } from "./OverlayHost";
export { default as Backdrop } from "./Backdrop";
export { default as BottomSheet } from "./BottomSheet";
export { default as DropdownMenu } from "./DropdownMenu";
export { default as ActionSheet } from "./ActionSheet";
export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as SheetScroll } from "./SheetScroll";

export { default as useBottomSheet, useBottomSheet as useSheet } from "./useBottomSheet";
export { default as useDropdownMenu, useDropdownMenu as useMenu } from "./useDropdownMenu";
export { default as useActionSheet, useActionSheet as useActions } from "./useActionSheet";
export { default as useConfirm } from "./useConfirm";

export { MenuRow, MenuSeparator, MenuSectionHeader, isDivider, isHeader } from "./menuItems";

export { useOverlayTheme } from "./overlayTheme";
export { useBackHandler, useOverlayBackHandler } from "./useBackHandler";

export {
  default as KeyboardArea,
  useKeyboardDismiss,
} from "./keyboard/KeyboardArea";
export {
  useKeyboardPanel,
  useKeyboardPanelStore,
  selectActivePanel,
  selectIsPanelOpen,
  PANEL_NONE,
  PANEL_KEYBOARD,
} from "./keyboard/useKeyboardPanel";
export { default as EmojiPanel } from "./keyboard/EmojiPanel";
export { default as AttachmentPanel } from "./keyboard/AttachmentPanel";
export { EMOJI_CATEGORIES, ALL_EMOJI } from "./keyboard/emojiData";
