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
import Image from "next/image";

export const AppSidebar = () => {
  const secondaryMenu = [
    { name: "Help", href: "#", icon: CircleHelp },
    { name: "Preferences", href: "/preferences", icon: Settings },
  ];
  const { menu } = useMenu();
  const { user, logout, isPending } = useAuth();
  const pathname = usePathname();
  
  return (
    <Sidebar collapsible="none">
      {/* <SidebarTrigger /> */}
      <SidebarHeader>
        <div className="flex">
          <div>
            {user?.image_url && !isPending && (
              <Image
                src={user.image_url}
                width="10"
                height="10"
                alt={user.first_name + ' ' + user.last_name}
                className="h-10 w-10 rounded-full"
              />
            )}
            {isPending && (
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-3">
            {!isPending ? (
              <>
                <span className="truncate font-medium">{user?.first_name || ''} {user?.last_name || ''}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.school?.name || ''}
                </span>
              </>
            ) : (
              <>
                <span className="h-4 w-24 bg-gray-200 rounded animate-pulse"></span>
                <span className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></span>
              </>
            )}
          </div>
        </div>
        <SidebarSeparator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item: NavigationItem) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.href === pathname}>
                    <Link href={item.href}>
                      <item.icon />
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
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={item.href === pathname}>
                    <Link href={item.href}>
                      <item.icon />
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={() => {
                    logout();
                  }}
                >
                  <Link href="/login">
                    <LogOut />
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
