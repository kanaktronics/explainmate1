
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "./scroll-area"


type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [openMobile, setOpenMobile] = React.useState(false)

    const [_open, _setOpen] = React.useState(true)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      setOpen((open) => !open)
    }, [setOpen])

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [open, setOpen, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            className={cn("flex min-h-svh w-full", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { children: React.ReactNode }
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { open, openMobile, setOpenMobile } = useSidebar()
    
    const header = React.Children.toArray(children).find((child) => React.isValidElement(child) && child.type === SidebarHeader);
    const content = React.Children.toArray(children).find((child) => React.isValidElement(child) && child.type === SidebarContent);
    const footer = React.Children.toArray(children).find((child) => React.isValidElement(child) && child.type === SidebarFooter);

    return (
      <>
        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
            <SheetContent
              className="w-72 bg-sidebar p-0 text-sidebar-foreground flex flex-col"
              side="left"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Main Menu</SheetTitle>
              </SheetHeader>
              {header}
              <ScrollArea className="flex-1 h-full">
                  {content}
              </ScrollArea>
              {footer}
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <aside
          ref={ref}
          className={cn(
              "hidden md:flex flex-col h-screen border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
              open ? "w-64" : "w-16",
              className
          )}
          {...props}
        >
          {children}
        </aside>
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, setOpenMobile } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setOpenMobile(true);
        } else {
          toggleSidebar();
        }
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn("flex-1", className)}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-4 border-b", !open && "justify-center", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-auto p-4 border-t", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      className={cn("my-2 bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 p-4",
        className
      )}
      {...props}
    />
  );
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const { open } = useSidebar();
  const Comp = asChild ? Slot : "div"

  if (!open) return null;

  return (
    <Comp
      ref={ref}
      className={cn(
        "px-3 py-2 text-xs font-medium text-sidebar-foreground/70",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"


const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm font-medium outline-none ring-sidebar-ring transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        ghost: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
    href?: string
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive: isActiveProp,
      variant = "default",
      tooltip,
      className,
      href,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { open } = useSidebar()
    const pathname = usePathname()
    const isActive = isActiveProp ?? (href ? pathname === href : false);

    const buttonContent = (
      <>
        {React.Children.map(children, child =>
          React.isValidElement(child) && child.type !== 'span' ? React.cloneElement(child as React.ReactElement, { className: 'h-4 w-4 shrink-0' }) : null
        )}
        <span className={cn('flex-1 truncate', !open && 'sr-only')}>
          {React.Children.map(children, child =>
             typeof child === 'string' || typeof child === 'number' ? child : (React.isValidElement(child) && child.type === 'span' ? child : null)
          )}
        </span>
      </>
    );

    const button = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant }), 'justify-start', isActive && "bg-sidebar-accent text-sidebar-accent-foreground", !open && "justify-center", className)}
        {...props}
      >
        {buttonContent}
      </Comp>
    )

    const buttonWithLink = href ? <Link href={href} passHref legacyBehavior={asChild}>{button}</Link> : button;

    if (!open && tooltip) {
      if (typeof tooltip === "string") {
        tooltip = {
          children: tooltip,
        }
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonWithLink}</TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            {...tooltip}
          />
        </Tooltip>
      )
    }

    return buttonWithLink
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = true, ...props }, ref) => {
  const { open } = useSidebar();
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      className={cn("rounded-md h-9 flex gap-2 p-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-5 rounded-md"
        />
      )}
      {open && <Skeleton
        className="h-4 flex-1"
        style={
          {
            maxWidth: width,
          } as React.CSSProperties
        }
      />}
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
