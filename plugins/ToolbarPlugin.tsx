import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useKeyBindings } from '@/hooks/useKeyBindings'
import {
  HEADINGS,
  LOW_PRIORITY,
  RICH_TEXT_OPTIONS,
  RichTextAction,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { useEffect, useState } from 'react'

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [disableMap, setDisableMap] = useState<{ [id: string]: boolean }>({
    [RichTextAction.Undo]: true,
    [RichTextAction.Redo]: true,
  })
  const [selectionMap, setSelectionMap] = useState<{ [id: string]: boolean }>(
    {}
  )

  const updateToolbar = () => {
    const selection = $getSelection()

    if ($isRangeSelection(selection)) {
      const newSelectionMap = {
        [RichTextAction.Bold]: selection.hasFormat('bold'),
        [RichTextAction.Italics]: selection.hasFormat('italic'),
        [RichTextAction.Underline]: selection.hasFormat('underline'),
        [RichTextAction.Strikethrough]: selection.hasFormat('strikethrough'),
        [RichTextAction.Superscript]: selection.hasFormat('superscript'),
        [RichTextAction.Subscript]: selection.hasFormat('subscript'),
        [RichTextAction.Code]: selection.hasFormat('code'),
        [RichTextAction.Highlight]: selection.hasFormat('highlight'),
      }
      setSelectionMap(newSelectionMap)
    }
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        LOW_PRIORITY
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setDisableMap((prevDisableMap) => ({
            ...prevDisableMap,
            undo: !payload,
          }))
          return false
        },
        LOW_PRIORITY
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setDisableMap((prevDisableMap) => ({
            ...prevDisableMap,
            redo: !payload,
          }))
          return false
        },
        LOW_PRIORITY
      )
    )
  }, [])

  const onAction = (id: RichTextAction) => {
    switch (id) {
      case RichTextAction.Bold: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        break
      }
      case RichTextAction.Italics: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        break
      }
      case RichTextAction.Underline: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
        break
      }
      case RichTextAction.Strikethrough: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        break
      }
      case RichTextAction.Superscript: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
        break
      }
      case RichTextAction.Subscript: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
        break
      }
      case RichTextAction.Highlight: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')
        break
      }
      case RichTextAction.Code: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
        break
      }
      case RichTextAction.LeftAlign: {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')
        break
      }
      case RichTextAction.RightAlign: {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')
        break
      }
      case RichTextAction.CenterAlign: {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
        break
      }
      case RichTextAction.JustifyAlign: {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')
        break
      }
      case RichTextAction.Undo: {
        editor.dispatchCommand(UNDO_COMMAND, undefined)
        break
      }
      case RichTextAction.Redo: {
        editor.dispatchCommand(REDO_COMMAND, undefined)
        break
      }
    }
  }

  useKeyBindings({ onAction })

  const updateHeading = (heading: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(heading))
      }
    })
  }

  return (
    <div className="flex gap-2 flex-wrap w-full">
      <Select onValueChange={(value) => updateHeading(value as HeadingTagType)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a heading" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Headings</SelectLabel>
            {HEADINGS.map((heading) => (
              <SelectItem key={heading} value={heading}>
                {heading}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {RICH_TEXT_OPTIONS.map(({ id, label, icon }) => (
        <Button
          key={id}
          aria-label={label}
          variant="outline"
          onClick={() => onAction(id)}
          disabled={disableMap[id]}
          className={cn(selectionMap[id] && 'bg-muted')}
        >
          {icon}
        </Button>
      ))}
    </div>
  )
}
