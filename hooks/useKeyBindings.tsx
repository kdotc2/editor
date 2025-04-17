import { LOW_PRIORITY, RichTextAction } from '@/lib/constants'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { KEY_DOWN_COMMAND } from 'lexical'
import { useEffect } from 'react'

/**
 * Detects if the OS is macOS (sync fallback).
 * Uses `navigator.userAgentData` if available, otherwise falls back to `userAgent`.
 */
const isMacOS = (): boolean => {
  if (typeof navigator === 'undefined') return false

  const uaData = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData
  const platform = uaData?.platform ?? navigator.userAgent
  return platform.toLowerCase().includes('mac')
}

/**
 * Handles key commands for rich text actions.
 */
const handleKeyCommand = (
  event: KeyboardEvent,
  onAction: (id: RichTextAction) => void
): boolean => {
  const isMac = isMacOS()
  const isModKey = isMac ? event.metaKey : event.ctrlKey

  if (!isModKey) return false

  const key = event.key.toLowerCase()
  const keyActions: Record<
    string,
    RichTextAction | ((shiftKey: boolean) => RichTextAction)
  > = {
    b: RichTextAction.Bold,
    i: RichTextAction.Italics,
    u: RichTextAction.Underline,
    z: (shiftKey) => (shiftKey ? RichTextAction.Redo : RichTextAction.Undo),
    y: () => RichTextAction.Redo,
  }

  const action = keyActions[key]
  if (!action) return false

  // Handle dynamic actions (like undo/redo)
  const resolvedAction =
    typeof action === 'function' ? action(event.shiftKey) : action

  // Skip 'y' on macOS (usually "Redo" is Cmd+Shift+Z)
  if (key === 'y' && isMac) return false

  onAction(resolvedAction)
  event.preventDefault()
  return true
}

/**
 * Hook to register key bindings for a Lexical editor.
 */
export const useKeyBindings = ({
  onAction,
}: {
  onAction: (id: RichTextAction) => void
}) => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregister = editor.registerCommand<KeyboardEvent>(
      KEY_DOWN_COMMAND,
      (event) => handleKeyCommand(event, onAction),
      LOW_PRIORITY
    )

    return () => unregister()
  }, [editor, onAction])
}
