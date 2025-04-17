import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TreeView } from '@lexical/react/LexicalTreeView'

export default function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return (
    <TreeView
      viewClassName="border p-4 rounded-xl overflow text-muted-foreground"
      treeTypeButtonClassName=""
      timeTravelPanelClassName="flex gap-4"
      timeTravelButtonClassName="debug-timetravel-button"
      timeTravelPanelSliderClassName="w-full"
      timeTravelPanelButtonClassName="flex flex-col"
      editor={editor}
    />
  )
}
