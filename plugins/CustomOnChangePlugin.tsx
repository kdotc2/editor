import React from 'react'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { $generateHtmlFromNodes } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorState } from 'lexical'

interface CustomOnChangePluginProps {
  onChange: (value: string) => void
}

export const CustomOnChangePlugin = ({
  onChange,
}: CustomOnChangePluginProps) => {
  const [editor] = useLexicalComposerContext()

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        editorState.read(() => {
          const html = $generateHtmlFromNodes(editor)
          onChange(html)
        })
      }}
    />
  )
}
