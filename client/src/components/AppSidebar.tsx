import { FileText, Upload, History, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

const menuItems = [
  {
    title: "dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "upload",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "history",
    url: "/history",
    icon: History,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-semibold text-base">PaperMind AI</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
