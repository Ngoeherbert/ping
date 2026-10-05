import { useCallback } from "react";
import { requestConfirm } from "../../store/overlays";

/**
 * Promise-based confirm dialog. Resolves true on confirm, false on
 * cancel / backdrop / back button.
 *
 * @example
 * const { confirm } = useConfirm();
 * if (await confirm({ title: "Delete?", confirmLabel: "Delete", destructive: true })) { ... }
 */
export function useConfirm() {
  const confirm = useCallback((props) => requestConfirm(props), []);
  return { confirm };
}

export default useConfirm;
