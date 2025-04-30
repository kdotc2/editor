'use client'

import * as React from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, Trash } from 'lucide-react'
import { useEditor } from '@/context/EditorContext'
import { toast } from 'sonner'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
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
  } = useEditor()
  const [editor] = useLexicalComposerContext()

  const handleNewDocument = () => {
    // Get current editor state before creating new doc
    let currentEditorState = ''
    editor.update(() => {
      currentEditorState = JSON.stringify(editor.getEditorState())
    })

    const newDocId = createNewDocument()
    setCurrentDocumentId(newDocId)

    // Apply the saved state to the new document
    if (currentEditorState) {
      setTimeout(() => {
        try {
          const parsedState = editor.parseEditorState(currentEditorState)
          editor.setEditorState(parsedState)
        } catch (e) {
          console.error('Failed to restore editor state', e)
        }
      }, 100)
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
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {doc.lastModified.toLocaleString()}
                  </p>
                  <p className="truncate font-semibold">
                    {doc.title || 'Untitled Document'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteDocument(doc.id)
                  }}
                  title="Delete document"
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
