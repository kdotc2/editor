import * as React from 'react'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { CommitHistoryPlugin } from '@/plugins/CommitHistoryPlugin'

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex w-[300px]"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border border-b text-sm font-semibold p-3">
        Track Document Changes
      </SidebarHeader>
      <SidebarContent>
        <CommitHistoryPlugin />
      </SidebarContent>
    </Sidebar>
  )
}
