import { SidebarLeft } from '@/components/SidebarLeft'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Editor } from '@/components/Editor'

export default function Home() {
  return (
    <SidebarProvider>
      <SidebarLeft />
      <SidebarInset>
        <Editor />
      </SidebarInset>
    </SidebarProvider>
  )
}
