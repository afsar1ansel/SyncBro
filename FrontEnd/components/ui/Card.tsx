"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = ({ className, glass = true, children, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 p-8",
        glass ? "bg-zinc-900/40 backdrop-blur-xl shadow-2xl" : "bg-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
