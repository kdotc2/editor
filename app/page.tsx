import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Editor } from '@/components/Editor'

export default function Home() {
  return (
    <SidebarProvider>
      <SidebarInset>
        <Editor />
      </SidebarInset>
    </SidebarProvider>
  )
}
