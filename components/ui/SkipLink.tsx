import Link from "next/link"
import { cn } from "@/lib/utils"

export function SkipLink({ className }: { className?: string }) {
    return (
        <Link
            href="#main-content"
            className={cn(
                "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-lg",
                className
            )}
        >
            Skip to main content
        </Link>
    )
}
