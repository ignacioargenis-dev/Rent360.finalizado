import * as React from "react"


import { cn } from "@/lib/utils"



const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-full w-full flex-col gap-2", className)}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-[60px] items-center px-2", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("grid items-start px-2 text-sm font-medium", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a">
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
      className
    )}
    {...props}
  />
))
SidebarNavItem.displayName = "SidebarNavItem"

const SidebarNavItemIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarNavItemIcon.displayName = "SidebarNavItemIcon"

const SidebarNavItemText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
SidebarNavItemText.displayName = "SidebarNavItemText"

const SidebarNavItemBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400", className)}
    {...props}
  />
))
SidebarNavItemBadge.displayName = "SidebarNavItemBadge"

const SidebarNavItemButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
      className
    )}
    {...props}
  />
))
SidebarNavItemButton.displayName = "SidebarNavItemButton"

const SidebarNavItemButtonIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-4 w-4 items-center justify-center", className)}
    {...props}
  />
))
SidebarNavItemButtonIcon.displayName = "SidebarNavItemButtonIcon"

const SidebarNavItemButtonText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
SidebarNavItemButtonText.displayName = "SidebarNavItemButtonText"

const SidebarNavItemButtonBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400", className)}
    {...props}
  />
))
SidebarNavItemButtonBadge.displayName = "SidebarNavItemButtonBadge"

const SidebarNavItemButtonTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-800", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltip.displayName = "SidebarNavItemButtonTooltip"

const SidebarNavItemButtonTooltipText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipText.displayName = "SidebarNavItemButtonTooltipText"

const SidebarNavItemButtonTooltipArrow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900 dark:bg-gray-800", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipArrow.displayName = "SidebarNavItemButtonTooltipArrow"

const SidebarNavItemButtonTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipContent.displayName = "SidebarNavItemButtonTooltipContent"

const SidebarNavItemButtonTooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("group relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipTrigger.displayName = "SidebarNavItemButtonTooltipTrigger"

const SidebarNavItemButtonTooltipProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipProvider.displayName = "SidebarNavItemButtonTooltipProvider"

const SidebarNavItemButtonTooltipRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipRoot.displayName = "SidebarNavItemButtonTooltipRoot"

const SidebarNavItemButtonTooltipPortal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipPortal.displayName = "SidebarNavItemButtonTooltipPortal"

const SidebarNavItemButtonTooltipViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipViewport.displayName = "SidebarNavItemButtonTooltipViewport"

const SidebarNavItemButtonTooltipArrowElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipArrowElement.displayName = "SidebarNavItemButtonTooltipArrowElement"

const SidebarNavItemButtonTooltipContentElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipContentElement.displayName = "SidebarNavItemButtonTooltipContentElement"

const SidebarNavItemButtonTooltipTriggerElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipTriggerElement.displayName = "SidebarNavItemButtonTooltipTriggerElement"

const SidebarNavItemButtonTooltipProviderElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipProviderElement.displayName = "SidebarNavItemButtonTooltipProviderElement"

const SidebarNavItemButtonTooltipRootElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipRootElement.displayName = "SidebarNavItemButtonTooltipRootElement"

const SidebarNavItemButtonTooltipPortalElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipPortalElement.displayName = "SidebarNavItemButtonTooltipPortalElement"

const SidebarNavItemButtonTooltipViewportElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipViewportElement.displayName = "SidebarNavItemButtonTooltipViewportElement"

const SidebarNavItemButtonTooltipArrowElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipArrowElementElement.displayName = "SidebarNavItemButtonTooltipArrowElementElement"

const SidebarNavItemButtonTooltipContentElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipContentElementElement.displayName = "SidebarNavItemButtonTooltipContentElementElement"

const SidebarNavItemButtonTooltipTriggerElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipTriggerElementElement.displayName = "SidebarNavItemButtonTooltipTriggerElementElement"

const SidebarNavItemButtonTooltipProviderElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipProviderElementElement.displayName = "SidebarNavItemButtonTooltipProviderElementElement"

const SidebarNavItemButtonTooltipRootElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipRootElementElement.displayName = "SidebarNavItemButtonTooltipRootElementElement"

const SidebarNavItemButtonTooltipPortalElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipPortalElementElement.displayName = "SidebarNavItemButtonTooltipPortalElementElement"

const SidebarNavItemButtonTooltipViewportElementElement = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
SidebarNavItemButtonTooltipViewportElementElement.displayName = "SidebarNavItemButtonTooltipViewportElementElement"

export {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarNavItemIcon,
  SidebarNavItemText,
  SidebarNavItemBadge,
  SidebarNavItemButton,
  SidebarNavItemButtonIcon,
  SidebarNavItemButtonText,
  SidebarNavItemButtonBadge,
  SidebarNavItemButtonTooltip,
  SidebarNavItemButtonTooltipText,
  SidebarNavItemButtonTooltipArrow,
  SidebarNavItemButtonTooltipContent,
  SidebarNavItemButtonTooltipTrigger,
  SidebarNavItemButtonTooltipProvider,
  SidebarNavItemButtonTooltipRoot,
  SidebarNavItemButtonTooltipPortal,
  SidebarNavItemButtonTooltipViewport,
  SidebarNavItemButtonTooltipArrowElement,
  SidebarNavItemButtonTooltipContentElement,
  SidebarNavItemButtonTooltipTriggerElement,
  SidebarNavItemButtonTooltipProviderElement,
  SidebarNavItemButtonTooltipRootElement,
  SidebarNavItemButtonTooltipPortalElement,
  SidebarNavItemButtonTooltipViewportElement,
  SidebarNavItemButtonTooltipArrowElementElement,
  SidebarNavItemButtonTooltipContentElementElement,
  SidebarNavItemButtonTooltipTriggerElementElement,
  SidebarNavItemButtonTooltipProviderElementElement,
  SidebarNavItemButtonTooltipRootElementElement,
  SidebarNavItemButtonTooltipPortalElementElement,
  SidebarNavItemButtonTooltipViewportElementElement,
}
