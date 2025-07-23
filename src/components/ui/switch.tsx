"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/utils/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Track styles - increased size
        "peer inline-flex h-6 w-12 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // Checked: blue, Unchecked: gray
        "data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-300",
        // Hover effect for checked
        "data-[state=checked]:hover:bg-blue-600",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Thumb styles - increased size
          "block size-6 rounded-full ring-0 transition-transform transition-colors pointer-events-none",
          // Checked: white, Unchecked: gray-100
          "data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-100",
          // Thumb position - adjusted for larger size
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
