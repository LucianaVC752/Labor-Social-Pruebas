"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Base components
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

//
// ─── PORTAL ─────────────────────────────────────────────────────────────────────
//
export function DialogPortal({
  className,
  children,
  ...props
}: DialogPrimitive.DialogPortalProps & { className?: string }) {
  return (
    <DialogPrimitive.Portal {...props}>
      <div className={className}>{children}</div>
    </DialogPrimitive.Portal>
  )
}

//
// ─── OVERLAY ────────────────────────────────────────────────────────────────────
//
export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

//
// ─── CONTENT ───────────────────────────────────────────────────────────────────
//   (Incluye el title invisible para Radix → evita warnings)
//
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />

    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-[5%] -translate-x-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border bg-white shadow-lg",
        "gap-4 rounded-lg border bg-white p-6 shadow-lg focus:outline-none",
        "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0",
        "sm:max-w-xl",
        className
      )}
      {...props}
    >
      <VisuallyHidden>
          <DialogPrimitive.Title />
        </VisuallyHidden>

      {children}

      <DialogPrimitive.Close
        className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-white transition-opacity
                   hover:opacity-100 focus:outline-none focus:ring-2 
                   focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

//
// ─── HEADER ─────────────────────────────────────────────────────────────────────
//
export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

//
// ─── FOOTER ─────────────────────────────────────────────────────────────────────
//
export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

//
// ─── TITLE ──────────────────────────────────────────────────────────────────────
//
export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-neutral-900", className)}
      {...props}
    />
  )
}

//
// ─── DESCRIPTION ────────────────────────────────────────────────────────────────
//
export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-neutral-600", className)}
      {...props}
    />
  )
}
