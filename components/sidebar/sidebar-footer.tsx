import { UserButton } from '@daveyplate/better-auth-ui'
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"


const SideBarFooter = () => {
  return (
  <SidebarMenu className="mt-auto pb-5 ml-2">
    <SidebarMenuItem>
       <UserButton/>
    </SidebarMenuItem>
    
    </SidebarMenu> 
)
}

export default SideBarFooter