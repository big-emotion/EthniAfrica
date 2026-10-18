import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

// The switch drawn on the `Main` board (brief 12): a 44 px target around a
// 44 × 24 track, in ink, never the accent. Locked on (the essential cookies)
// keeps the full ink rather than dimming: dimmed, it read as the off track.
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "group peer inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center bg-transparent focus-visible:outline-none focus-visible:shadow-afh-focus disabled:cursor-not-allowed",
      className
    )}
    {...props}
    ref={ref}
  >
    <span className="relative block h-6 w-11 rounded-afh-full bg-afh-text-muted transition-colors group-data-[state=checked]:bg-afh-text">
      <SwitchPrimitives.Thumb className="pointer-events-none absolute left-0.5 top-0.5 block h-5 w-5 rounded-afh-full bg-afh-surface transition-transform data-[state=checked]:translate-x-5" />
    </span>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
