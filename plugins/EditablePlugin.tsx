'use client'

import { useEditor } from '@/context/EditorContext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

export const EditableTogglePlugin = () => {
  const [editor] = useLexicalComposerContext()
  const { showDiff } = useEditor()

  useEffect(() => {
    editor.setEditable(!showDiff)
  }, [editor, showDiff])

  return null
}
