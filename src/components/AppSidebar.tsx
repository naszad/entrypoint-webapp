import Link from "next/link";
import { useMenu } from "@/context/MenuContext";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CircleHelp,
  Settings,
  LogOut
} from "lucide-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavigationItem } from "@/context/MenuContext";
import { UserProfile } from "@/components/UserProfile";
import { logout } from "@/libs/authService";

export const AppSidebar = () => {
  const secondaryMenu = [
    { name: "Help", href: "#", icon: CircleHelp },
    { name: "Preferences", href: "/preferences", icon: Settings },
  ];
  const { menu } = useMenu();
  const { user } = useAuth();
  const pathname = usePathname();
  
  return (
    <Sidebar collapsible="none" className="mt-5 px-2">
      {/* <SidebarTrigger /> */}
      <SidebarHeader>
        <UserProfile user={user} />
        <SidebarSeparator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item: NavigationItem) => (
                <SidebarMenuItem key={item.name} className="px-2 mr-2">
                  <SidebarMenuButton asChild isActive={item.href === pathname} className="py-5">
                    <Link href={item.href} className="px-4 py-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryMenu.map((item: NavigationItem) => (
                <SidebarMenuItem key={item.name} className="px-2 mr-2">
                  <SidebarMenuButton asChild isActive={item.href === pathname} className="py-5">
                    <Link href={item.href} className="px-4 py-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="px-2 mr-2">
                <SidebarMenuButton
                  asChild
                  onClick={logout}
                  className="py-5"
                >
                  <Link href="/login">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
