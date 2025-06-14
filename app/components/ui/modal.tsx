import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative bg-background rounded-lg shadow-lg max-h-[90vh] overflow-auto",
        className
      )}>
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6 border-b", className)}
      {...props}
    />
  )
)
ModalHeader.displayName = "ModalHeader"

interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-xl font-semibold", className)}
      {...props}
    />
  )
)
ModalTitle.displayName = "ModalTitle"

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6", className)}
      {...props}
    />
  )
)
ModalBody.displayName = "ModalBody"

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-2 p-6 border-t", className)}
      {...props}
    />
  )
)
ModalFooter.displayName = "ModalFooter"
