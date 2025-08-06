"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, LayoutDashboard, Settings, CalendarDays } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

interface User {
  name: string
  role: string
  imageUrl?: string
}

interface NavigationItem {
  id: string
  title: string
  path: string
  icon: React.ElementType
}

interface AppSidebarProps {
  user: User
  navigationItems: NavigationItem[]
}

// Helper function to get user initials
function getUserInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Helper function to get role-based color
function getRoleColor(role: string): string {
  switch (role.toLowerCase()) {
    case "admin":
      return "bg-red-500"
    case "editor":
      return "bg-blue-500"
    case "viewer":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

export function AppSidebar({ user, navigationItems }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="justify-start">
              <Avatar className="size-8">
                <AvatarImage src={user.imageUrl || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className={getRoleColor(user.role)}>
                  <span className="text-white">{getUserInitials(user.name)}</span>
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-sidebar-foreground/70">{user.role}</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <a href={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="icon"
              className="w-full justify-center"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
