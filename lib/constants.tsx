import {
  Redo,
  Undo,
  Code,
  Highlighter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Subscript,
  Superscript,
  AlignCenter,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react'

export enum RichTextAction {
  Bold = 'bold',
  Italics = 'italics',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  Superscript = 'superscript',
  Subscript = 'subscript',
  Highlight = 'highlight',
  Code = 'code',
  LeftAlign = 'leftAlign',
  CenterAlign = 'centerAlign',
  RightAlign = 'rightAlign',
  JustifyAlign = 'justifyAlign',
  Undo = 'undo',
  Redo = 'redo',
}

export const RICH_TEXT_OPTIONS = [
  { id: RichTextAction.Bold, icon: <Bold />, label: 'Bold' },
  { id: RichTextAction.Italics, icon: <Italic />, label: 'Italics' },
  { id: RichTextAction.Underline, icon: <Underline />, label: 'Underline' },
  {
    id: RichTextAction.Highlight,
    icon: <Highlighter />,
    label: 'Highlight',
    fontSize: 10,
  },
  {
    id: RichTextAction.Strikethrough,
    icon: <Strikethrough />,
    label: 'Strikethrough',
  },
  {
    id: RichTextAction.Superscript,
    icon: <Superscript />,
    label: 'Superscript',
  },
  {
    id: RichTextAction.Subscript,
    icon: <Subscript />,
    label: 'Subscript',
  },
  {
    id: RichTextAction.Code,
    icon: <Code />,
    label: 'Code',
  },
  {
    id: RichTextAction.LeftAlign,
    icon: <AlignLeft />,
    label: 'Align Left',
  },
  {
    id: RichTextAction.CenterAlign,
    icon: <AlignCenter />,
    label: 'Align Center',
  },
  {
    id: RichTextAction.RightAlign,
    icon: <AlignRight />,
    label: 'Align Right',
  },
  {
    id: RichTextAction.JustifyAlign,
    icon: <AlignJustify />,
    label: 'Align Justify',
  },

  {
    id: RichTextAction.Undo,
    icon: <Undo />,
    label: 'Undo',
  },
  {
    id: RichTextAction.Redo,
    icon: <Redo />,
    label: 'Redo',
  },
]

export const LOW_PRIORITY = 1
export const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
