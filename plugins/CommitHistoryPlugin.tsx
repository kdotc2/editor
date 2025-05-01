'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $isParagraphNode,
} from 'lexical'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useEditor } from '@/context/EditorContext'
import { toast } from 'sonner'
import { diff_match_patch, DIFF_INSERT, DIFF_DELETE } from 'diff-match-patch'
import { Check, X } from 'lucide-react'

interface Commit {
  id: string
  timestamp: Date
  text: string
  editorState: string
  message?: string
  title: string
}

export const CommitHistoryPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [commits, setCommits] = useState<Commit[]>([])
  const [currentCommitIndex, setCurrentCommitIndex] = useState(-1)
  const [commitMessage, setCommitMessage] = useState('')
  const [selectedCommitIndex, setSelectedCommitIndex] = useState<number | null>(
    null
  )
  const [hasText, setHasText] = useState(false)

  const {
    showDiff,
    setShowDiff,
    title,
    setTitle,
    currentDocumentId,
    saveCommit,
    getCurrentDocumentCommits,
  } = useEditor()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const rootText = $getRoot().getTextContent().trim()
        setHasText(rootText.length > 0)
      })
    })
  }, [editor])

  useEffect(() => {
    if (!currentDocumentId) {
      setCommits([])
      setCurrentCommitIndex(-1)
      setSelectedCommitIndex(null)
      return
    }

    const loadedCommits = getCurrentDocumentCommits()
    setCommits(loadedCommits)

    if (loadedCommits.length > 0) {
      const lastIndex = loadedCommits.length - 1
      setCurrentCommitIndex(lastIndex)
      setSelectedCommitIndex(lastIndex)

      // Restore the editor state
      const commit = loadedCommits[lastIndex]
      const editorState = editor.parseEditorState(commit.editorState)
      editor.setEditorState(editorState)
      setTitle(commit.title)
    }
  }, [currentDocumentId, editor, setTitle, getCurrentDocumentCommits])

  const createCommit = useCallback(async () => {
    return new Promise<{ editorState: string; text: string }>((resolve) => {
      editor.getEditorState().read(() => {
        const editorState = JSON.stringify(editor.getEditorState())
        const text = $getRoot().getTextContent()
        resolve({ editorState, text })
      })
    })
  }, [editor])

  const commitChanges = useCallback(async () => {
    if (!editor || !currentDocumentId) {
      toast.error('No document selected')
      return
    }

    if (currentCommitIndex < commits.length - 1) {
      toast('Only the most recent commit can commit changes.')
      return
    }

    const { editorState, text } = await createCommit()
    const commitTitle = title || 'Untitled Document'

    try {
      const newCommit = saveCommit({
        text,
        editorState,
        title: commitTitle,
        message:
          commitMessage || `Update at ${new Date().toLocaleTimeString()}`,
      })

      if (newCommit) {
        setCommits((prev) => [...prev, newCommit])
        setCurrentCommitIndex(commits.length)
        setSelectedCommitIndex(commits.length)
        setCommitMessage('')
        setShowDiff(false)
        toast.success('Changes committed successfully')
      }
    } catch (error) {
      toast.error('Failed to save commit')
      console.error('Commit error:', error)
    }
  }, [
    editor,
    currentDocumentId,
    title,
    commitMessage,
    commits.length,
    currentCommitIndex,
    saveCommit,
    createCommit,
    setShowDiff,
  ])

  const applyDiffToEditor = useCallback(
    (currentIndex: number) => {
      if (currentIndex < 0 || currentIndex >= commits.length) return

      const currentCommit = commits[currentIndex]
      const previousCommit = currentIndex > 0 ? commits[currentIndex - 1] : null

      const previousState = previousCommit
        ? editor.parseEditorState(previousCommit.editorState)
        : null

      const currentState = editor.parseEditorState(currentCommit.editorState)

      editor.update(() => {
        const root = $getRoot()
        root.clear()

        const prevParagraphs: string[] = []
        if (previousState) {
          previousState.read(() => {
            $getRoot()
              .getChildren()
              .forEach((node) => {
                if ($isParagraphNode(node)) {
                  prevParagraphs.push(node.getTextContent())
                }
              })
          })
        }

        const currParagraphs: string[] = []
        currentState.read(() => {
          $getRoot()
            .getChildren()
            .forEach((node) => {
              if ($isParagraphNode(node)) {
                currParagraphs.push(node.getTextContent())
              }
            })
        })

        currParagraphs.forEach((currPara, i) => {
          const paragraph = $createParagraphNode()
          const prevPara = prevParagraphs[i]
          const dmp = new diff_match_patch()
          const diffs = dmp.diff_main(prevPara || '', currPara)
          dmp.diff_cleanupSemantic(diffs)

          diffs.forEach(([type, text]) => {
            const textNode = $createTextNode(text)
            if (type === DIFF_INSERT) {
              textNode.setStyle('background-color:rgb(120, 253, 167)')
            } else if (type === DIFF_DELETE) {
              textNode.setStyle(
                'background-color:rgb(255, 152, 152); text-decoration: line-through'
              )
            }
            paragraph.append(textNode)
          })

          root.append(paragraph)
        })

        if (prevParagraphs.length > currParagraphs.length) {
          for (let i = currParagraphs.length; i < prevParagraphs.length; i++) {
            const paragraph = $createParagraphNode()
            const textNode = $createTextNode(prevParagraphs[i])
            textNode.setStyle(
              'background-color:rgb(255, 152, 152); text-decoration: line-through'
            )
            paragraph.append(textNode)
            root.append(paragraph)
          }
        }
      })
    },
    [commits, editor]
  )

  const restoreCommit = useCallback(
    (index: number) => {
      if (index < 0 || index >= commits.length) return

      setSelectedCommitIndex(index)
      setCurrentCommitIndex(index)

      const commit = commits[index]
      setTitle(commit.title)

      if (showDiff) {
        applyDiffToEditor(index)
      } else {
        try {
          const editorState = editor.parseEditorState(commit.editorState)
          editor.setEditorState(editorState)
        } catch (e) {
          console.error('Failed to restore commit', e)
          toast.error('Failed to restore commit')
        }
      }
    },
    [commits, editor, showDiff, applyDiffToEditor, setTitle]
  )

  useEffect(() => {
    if (selectedCommitIndex !== null) {
      restoreCommit(selectedCommitIndex)
    }
  }, [showDiff, selectedCommitIndex, restoreCommit])

  const clearHistory = useCallback(() => {
    if (!currentDocumentId) return

    setCommits([])
    setCurrentCommitIndex(-1)
    setSelectedCommitIndex(null)
    localStorage.removeItem(`commits-${currentDocumentId}`)
    setShowDiff(false)
    editor.update(() => {
      $getRoot().clear()
    })
    toast.success('Commit history cleared')
  }, [editor, currentDocumentId, setShowDiff])

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col px-3 pt-3 pb-1.5 gap-2 sticky top-0 bg-sidebar shrink-0">
        <Textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message (optional)"
          className="flex-1 px-3 py-2 text-sm resize-none field-sizing-content min-h-fit"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && commitChanges()}
          disabled={showDiff}
        />

        <Button
          onClick={commitChanges}
          size="sm"
          variant="success"
          disabled={!hasText || showDiff}
        >
          <Check />
          Commit Changes
        </Button>

        {commits.length >= 1 && (
          <div className="flex items-center mt-2">
            <Checkbox
              id="showDiff"
              checked={showDiff}
              onCheckedChange={(checked) => setShowDiff(!!checked)}
              className="mr-2"
            />
            <Label htmlFor="showDiff" className="font-normal">
              Highlight changes (read only)
            </Label>
          </div>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto px-3 py-1.5 grow">
        {commits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No commits available. Make changes and click Commit Changes to save
            a version.
          </p>
        ) : (
          commits
            .slice()
            .reverse()
            .map((commit, indexFromEnd) => {
              const index = commits.length - 1 - indexFromEnd

              return (
                <Card
                  key={commit.id}
                  onClick={() => restoreCommit(index)}
                  className={cn(
                    'cursor-pointer transition-colors text-xs',
                    index === currentCommitIndex
                      ? 'bg-success/10'
                      : 'hover:bg-success/10 '
                  )}
                >
                  <div className="flex justify-between">
                    <p className="text-muted-foreground mt-1">
                      {commit.timestamp.toLocaleString()}
                    </p>
                    <span className="text-muted-foreground">#{index + 1}</span>
                  </div>
                  <p className="font-medium">
                    {commit.message || `Commit ${index + 1}`}
                  </p>
                </Card>
              )
            })
        )}
      </div>

      {commits.length > 0 && (
        <Button
          onClick={clearHistory}
          size="sm"
          variant="destructive"
          className="m-3"
        >
          <X />
          Clear History
        </Button>
      )}
    </div>
  )
}
