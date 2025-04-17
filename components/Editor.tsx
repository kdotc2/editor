'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HeadingNode } from '@lexical/rich-text'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ToolbarPlugin } from '@/plugins/ToolbarPlugin'
import { EditorThemeClasses } from 'lexical'
import { useState } from 'react'
import { CustomOnChangePlugin } from '@/plugins/CustomOnChangePlugin'
import { SidebarRight } from '@/components/SidebarRight'
import { EditorProvider, useEditor } from '@/context/EditorContext'
import { EditableTogglePlugin } from '@/plugins/EditablePlugin'
import { Input } from '@/components/ui/input'

const theme: EditorThemeClasses = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
    code: 'p-1 rounded bg-muted border',
  },
  heading: {
    h1: 'text-3xl font-extrabold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-bold',
    h4: 'text-lg font-bold',
    h5: 'font-bold',
  },
}

export const initialConfig = {
  namespace: 'Editor',
  theme,
  onError: (error: unknown) => {
    console.error(error)
    throw error
  },
  nodes: [HeadingNode, CodeHighlightNode, CodeNode],
}

function EditorInner() {
  const [, setValue] = useState('')
  const { showDiff, title, setTitle } = useEditor()

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex">
        <div className="relative flex flex-col justify-between max-w-[1056px] p-4 gap-4 mx-auto w-full">
          <Input
            type="text"
            value={title ?? ''}
            placeholder="Untitled Document"
            onChange={(e) => setTitle(e.target.value)}
            className="font-bold p-0 focus-visible:ring-1 focus-visible:ring-offset-0 field-sizing-content shadow-none border-none w-fit px-2 max-w-full"
            readOnly={showDiff}
          />
          <ToolbarPlugin />
          <div className="relative flex flex-1 border p-4 rounded-md transition-all overflow-y-auto">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="outline-none flex-1"
                  readOnly={showDiff}
                />
              }
              placeholder={
                <p className="pointer-events-none absolute top-4 left-4 text-muted-foreground">
                  Start typing content here...
                </p>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
        <SidebarRight />
      </div>
      <AutoFocusPlugin />
      <HistoryPlugin />
      <EditableTogglePlugin />
      <CustomOnChangePlugin onChange={(newValue) => setValue(newValue)} />
    </LexicalComposer>
  )
}

export function Editor() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  )
}
