import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success"
}

export function Badge({
    className = "",
    variant = "default",
    ...props
}: BadgeProps) {
    const variantStyles = {
        default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-slate-950 dark:text-slate-50 border-slate-200 dark:border-slate-800",
        success: "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
    }[variant] || "border-transparent bg-blue-600 text-white";

    return (
        <div
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles} ${className}`}
            {...props}
        />
    );
}

export default Badge;
