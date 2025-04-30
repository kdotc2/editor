'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'

interface Document {
  id: string
  title: string
  lastModified: Date
}

interface Commit {
  id: string
  timestamp: Date
  text: string
  editorState: string
  message?: string
  title: string
}

type StoredDocument = Omit<Document, 'lastModified'> & { lastModified: string }
type StoredCommit = Omit<Commit, 'timestamp'> & { timestamp: string }

const EditorContext = createContext<{
  showDiff: boolean
  setShowDiff: (val: boolean) => void
  title: string
  setTitle: (val: string) => void
  currentDocumentId: string | null
  setCurrentDocumentId: (val: string | null) => void
  documents: Document[]
  setDocuments: (documents: Document[]) => void
  createNewDocument: () => string
  loadDocument: (docId: string) => void
  deleteDocument: (docId: string) => void
  getCurrentDocumentCommits: () => Commit[]
  saveCommit: (commit: Omit<Commit, 'id' | 'timestamp'>) => Commit | undefined
}>({
  showDiff: false,
  setShowDiff: () => {},
  title: 'Untitled Document',
  setTitle: () => {},
  currentDocumentId: null,
  setCurrentDocumentId: () => {},
  setDocuments: () => {},
  documents: [],
  createNewDocument: () => '',
  loadDocument: () => {},
  deleteDocument: () => {},
  getCurrentDocumentCommits: () => [],
  saveCommit: () => undefined,
})

export const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key)
  }
  return null
}

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value)
  }
}

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [showDiff, setShowDiff] = useState(false)
  const [title, setTitle] = useState('Untitled Document')
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null
  )
  const [documents, setDocuments] = useState<Document[]>([])
  const [, setHasInitialized] = useState(false)

  // Load documents and current document from localStorage
  useEffect(() => {
    const savedDocuments = getLocalStorageItem('documents')
    if (savedDocuments) {
      try {
        const parsedDocuments: StoredDocument[] = JSON.parse(savedDocuments)
        const documentsWithDates = parsedDocuments.map((doc) => ({
          ...doc,
          lastModified: new Date(doc.lastModified),
        }))
        setDocuments(documentsWithDates)

        // Try to load the last viewed document
        const lastDocumentId = getLocalStorageItem('currentDocumentId')
        if (
          lastDocumentId &&
          documentsWithDates.some((doc) => doc.id === lastDocumentId)
        ) {
          setCurrentDocumentId(lastDocumentId)
          const lastDoc = documentsWithDates.find(
            (doc) => doc.id === lastDocumentId
          )
          if (lastDoc) setTitle(lastDoc.title)
        } else if (documentsWithDates.length > 0) {
          // Fallback to first document if no last document found
          setCurrentDocumentId(documentsWithDates[0].id)
          setTitle(documentsWithDates[0].title)
        }
      } catch (e) {
        console.error('Failed to parse saved documents', e)
      }
    }
    setHasInitialized(true)
  }, [])

  // Update localStorage when currentDocumentId changes
  useEffect(() => {
    if (currentDocumentId) {
      setLocalStorageItem('currentDocumentId', currentDocumentId)
    }
  }, [currentDocumentId])

  const getCurrentDocumentCommits = useCallback((): Commit[] => {
    if (!currentDocumentId) return []

    const savedCommits = getLocalStorageItem(`commits-${currentDocumentId}`)
    if (savedCommits) {
      try {
        const parsedCommits: StoredCommit[] = JSON.parse(savedCommits)
        return parsedCommits.map((commit) => ({
          ...commit,
          timestamp: new Date(commit.timestamp),
        }))
      } catch (e) {
        console.error('Failed to parse commits', e)
      }
    }
    return []
  }, [currentDocumentId])

  const createNewDocument = useCallback((): string => {
    // Get current editor state before creating new doc
    let currentEditorState = ''
    if (currentDocumentId) {
      const commits = getCurrentDocumentCommits()
      if (commits.length > 0) {
        currentEditorState = commits[commits.length - 1].editorState
      }
    }

    const newDoc = {
      id: Date.now().toString(),
      title: title || 'Untitled Document',
      lastModified: new Date(),
    }

    const updatedDocuments = [...documents, newDoc]
    setDocuments(updatedDocuments)
    setLocalStorageItem(
      'documents',
      JSON.stringify(
        updatedDocuments.map((doc) => ({
          ...doc,
          lastModified: doc.lastModified.toISOString(),
        }))
      )
    )

    // Set up the new document with the current editor state
    if (currentEditorState) {
      setLocalStorageItem(
        `commits-${newDoc.id}`,
        JSON.stringify([
          {
            id: 'initial',
            timestamp: new Date().toISOString(),
            text: '', // Will be updated on first commit
            editorState: currentEditorState,
            title: newDoc.title,
          },
        ])
      )
    } else {
      setLocalStorageItem(`commits-${newDoc.id}`, JSON.stringify([]))
    }

    setCurrentDocumentId(newDoc.id)
    // Title is already preserved
    setShowDiff(false)

    return newDoc.id
  }, [documents, title, currentDocumentId, getCurrentDocumentCommits])

  const loadDocument = useCallback(
    (docId: string) => {
      const doc = documents.find((d) => d.id === docId)
      if (doc) {
        setCurrentDocumentId(doc.id)
        setTitle(doc.title)
        setShowDiff(false)
        return true
      }
      return false
    },
    [documents]
  )

  const deleteDocument = useCallback(
    (docId: string) => {
      const updatedDocuments = documents.filter((doc) => doc.id !== docId)
      setDocuments(updatedDocuments)
      setLocalStorageItem(
        'documents',
        JSON.stringify(
          updatedDocuments.map((doc) => ({
            ...doc,
            lastModified: doc.lastModified.toISOString(),
          }))
        )
      )
      localStorage.removeItem(`commits-${docId}`)

      if (currentDocumentId === docId) {
        setCurrentDocumentId(null)
        setTitle('Untitled Document')
      }
    },
    [documents, currentDocumentId]
  )

  const saveCommit = useCallback(
    (commit: Omit<Commit, 'id' | 'timestamp'>): Commit | undefined => {
      let docId = currentDocumentId

      // If no document exists, create one automatically
      if (!docId) {
        docId = createNewDocument()
      }

      const newCommit: Commit = {
        ...commit,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      const currentCommits = getCurrentDocumentCommits()
      const updatedCommits = [...currentCommits, newCommit]

      setLocalStorageItem(
        `commits-${docId}`,
        JSON.stringify(
          updatedCommits.map((c) => ({
            ...c,
            timestamp: c.timestamp.toISOString(),
          }))
        )
      )

      // Update documents list
      const updatedDocuments = documents.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              lastModified: new Date(),
              title: commit.title || doc.title,
            }
          : doc
      )

      // If document was just created, add it to the list
      if (!documents.some((doc) => doc.id === docId)) {
        updatedDocuments.push({
          id: docId,
          title: commit.title || 'Untitled Document',
          lastModified: new Date(),
        })
      }

      setDocuments(updatedDocuments)
      setLocalStorageItem(
        'documents',
        JSON.stringify(
          updatedDocuments.map((doc) => ({
            ...doc,
            lastModified: doc.lastModified.toISOString(),
          }))
        )
      )

      return newCommit
    },
    [currentDocumentId, documents, getCurrentDocumentCommits, createNewDocument]
  )

  return (
    <EditorContext.Provider
      value={{
        showDiff,
        setShowDiff,
        title,
        setTitle,
        currentDocumentId,
        setCurrentDocumentId,
        setDocuments,
        documents,
        createNewDocument,
        loadDocument,
        deleteDocument,
        getCurrentDocumentCommits,
        saveCommit,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export const useEditor = () => {
  const context = useContext(EditorContext)

  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }

  return context
}
