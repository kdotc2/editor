'use client'

import * as React from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { useEditor } from '@/context/EditorContext'
import { toast } from 'sonner'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot } from 'lexical'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const {
    createNewDocument,
    loadDocument,
    deleteDocument,
    documents,
    currentDocumentId,
    setDocuments,
    setCurrentDocumentId,
    title,
    setTitle,
  } = useEditor()
  const [editor] = useLexicalComposerContext()

  // Helper function to safely set editor state
  const safeSetEditorState = (editorState: string): boolean => {
    try {
      const parsedState = editor.parseEditorState(editorState)
      let isValid = false
      parsedState.read(() => {
        isValid = !$getRoot().isEmpty()
      })
      if (isValid) {
        editor.setEditorState(parsedState)
        return true
      }
    } catch (e) {
      console.error('Error parsing editor state', e)
    }
    return false
  }

  const handleNewDocument = () => {
    const isFirstDocument = documents.length === 0

    if (isFirstDocument) {
      // For first document - preserve content if it exists
      const currentTitle = title
      let currentEditorState = ''
      let hasContent = false

      editor.update(() => {
        hasContent = $getRoot().getTextContent().trim().length > 0
        if (hasContent) {
          currentEditorState = JSON.stringify(editor.getEditorState())
        }
      })

      const newDocId = createNewDocument()
      setCurrentDocumentId(newDocId)

      // Only restore if we had content
      if (hasContent && currentEditorState) {
        setTimeout(() => {
          if (!safeSetEditorState(currentEditorState)) {
            // Fallback to empty document if restoration fails
            editor.update(() => {
              $getRoot().clear()
              $getRoot().append($createParagraphNode())
            })
          }
          setTitle(currentTitle)
        }, 50)
      }
    } else {
      // For subsequent documents - create fresh empty document
      const newDocId = createNewDocument()
      setCurrentDocumentId(newDocId)

      setTimeout(() => {
        editor.update(() => {
          $getRoot().clear()
          $getRoot().append($createParagraphNode())
        })
        setTitle('Untitled Document')
      }, 50)
    }

    toast.success('New document created')
  }

  const handleDeleteDocument = (docId: string) => {
    const docToDelete = documents.find((doc) => doc.id === docId)
    if (!docToDelete) return

    // Store the document data before deletion
    const documentData = {
      ...docToDelete,
      lastModified: docToDelete.lastModified.toISOString(),
    }
    const commits = localStorage.getItem(`commits-${docId}`)

    // Delete the document first
    deleteDocument(docId)
    editor.update(() => {
      $getRoot().clear()
    })

    // Show undo toast
    toast('Document has been deleted', {
      description: docToDelete.title || 'Untitled Document',
      action: {
        label: 'Undo',
        onClick: () => {
          try {
            // Get current documents from localStorage
            const currentDocs = JSON.parse(
              localStorage.getItem('documents') || '[]'
            )

            // Add back our document
            const updatedDocs = [...currentDocs, documentData]

            // Update localStorage
            localStorage.setItem('documents', JSON.stringify(updatedDocs))

            // Restore commits if they existed
            if (commits) {
              localStorage.setItem(`commits-${docId}`, commits)
            }

            // Update state
            setDocuments(
              updatedDocs.map((doc) => ({
                ...doc,
                lastModified: new Date(doc.lastModified),
              }))
            )

            // Load the document
            loadDocument(docId)
            toast.success('Document restored')
          } catch (error) {
            toast.error('Failed to restore document')
            console.error('Restoration error:', error)
          }
        },
      },
    })
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border border-b text-sm font-semibold p-3">
        Documents
      </SidebarHeader>

      <Button
        onClick={handleNewDocument}
        size="sm"
        variant="outline"
        className="m-3"
      >
        <Plus className="h-4 w-4" />
        Create New Document
      </Button>

      <SidebarContent className="p-3">
        <div className="grow space-y-2">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                'cursor-pointer transition-colors p-3 relative',
                currentDocumentId === doc.id
                  ? 'bg-primary/5'
                  : 'hover:bg-primary/5'
              )}
              onClick={() => loadDocument(doc.id)}
            >
              <div>
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {doc.lastModified.toLocaleString()}
                  </p>
                  <Button
                    size="smallIcon"
                    variant="transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDocument(doc.id)
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
                <p className="truncate font-semibold">
                  {doc.title || 'Untitled Document'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
