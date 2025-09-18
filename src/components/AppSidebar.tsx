import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NavigationItem } from "@/types/NavigationItem";
import {
  CircleHelp,
  Settings,
  LogOut,
  Notebook,
  UsersIcon,
  FileDigit,
  File
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
import { UserProfile } from "@/components/UserProfile"; 

export const AppSidebar = () => {
  const primaryMenu = [
    { name: "Students", href: "/students", icon: UsersIcon },
    { name: "Reports", href: "/reports", icon: File },
    { name: "Grades", href: "/grades", icon: FileDigit },
    { name: "Meeting Notes", href: "/notes", icon: Notebook },
  ];
  const secondaryMenu = [
    { name: "Help", href: "#", icon: CircleHelp },
    { name: "Preferences", href: "/preferences", icon: Settings },
  ];

  const adminMenu = [
    { name: "Users", href: "/users", icon: UsersIcon },
  ];

  const { user, handleLogout } = useAuth();
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
              {primaryMenu.map((item: NavigationItem) => (
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
              {user?.role === 'admin' && adminMenu.map((item: NavigationItem) => (
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
                  onClick={handleLogout}
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
