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
  setDocuments: () => {},
  documents: [],
  createNewDocument: () => '',
  loadDocument: () => {},
  deleteDocument: () => {},
  getCurrentDocumentCommits: () => [],
  saveCommit: () => undefined,
})

const getLocalStorageItem = (key: string): string | null => {
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
  const [hasInitialized, setHasInitialized] = useState(false)

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

  const createNewDocument = useCallback((): string => {
    const newDoc = {
      id: Date.now().toString(),
      title: 'Untitled Document',
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

    setCurrentDocumentId(newDoc.id)
    setTitle(newDoc.title)
    setShowDiff(false)
    setLocalStorageItem(`commits-${newDoc.id}`, JSON.stringify([]))

    return newDoc.id
  }, [documents])

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

  const saveCommit = useCallback(
    (commit: Omit<Commit, 'id' | 'timestamp'>): Commit | undefined => {
      if (!currentDocumentId) return undefined

      const newCommit: Commit = {
        ...commit,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      const currentCommits = getCurrentDocumentCommits()
      const updatedCommits = [...currentCommits, newCommit]

      setLocalStorageItem(
        `commits-${currentDocumentId}`,
        JSON.stringify(
          updatedCommits.map((c) => ({
            ...c,
            timestamp: c.timestamp.toISOString(),
          }))
        )
      )

      const updatedDocuments = documents.map((doc) =>
        doc.id === currentDocumentId
          ? {
              ...doc,
              lastModified: new Date(),
              title: commit.title || doc.title,
            }
          : doc
      )
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
    [currentDocumentId, documents, getCurrentDocumentCommits]
  )

  return (
    <EditorContext.Provider
      value={{
        showDiff,
        setShowDiff,
        title,
        setTitle,
        currentDocumentId,
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
