"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  ElementType,
} from "react";
import {
  LayoutDashboard,
  UsersIcon,
  BookOpen,
  FileDigit,
  Notebook,
  File
} from "lucide-react"

import { useAuth } from "./AuthContext";

export type NavigationItem = {
  name: string;
  href: string;
  icon: ElementType;
};

type MenuContextType = {
  menu: NavigationItem[];
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const navigations: Record<string, NavigationItem[]> = {
  'Counselor': [
    // { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: UsersIcon },
    { name: "Reports", href: "/reports", icon: File },
    // { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Grades", href: "/grades", icon: FileDigit },
    { name: "Meeting Notes", href: "/notes", icon: Notebook },
  ],
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu] = useState<NavigationItem[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.role && navigations[user.role]) {
      setMenu(navigations[user.role]);
    }
  }, [user]);

  return (
    <MenuContext.Provider value={{ menu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
