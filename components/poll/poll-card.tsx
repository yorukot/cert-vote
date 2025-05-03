"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface PollCardProps {
  title: string;
  startDate: string;
  voteCount: number;
  status: "ongoing" | "completed" | "upcoming";
  className?: string;
}

export function PollCard({
  title,
  startDate,
  voteCount,
  status,
  className,
}: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    ongoing: "secondary",
    completed: "default",
    upcoming: "outline",
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden w-full max-w-md rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer", 
        {
          "border-primary/20": status === "ongoing",
          "border-primary/40": status === "completed",
          "border-muted": status === "upcoming",
        },
        className
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className={cn(
        "h-1 w-full", 
        {
          "bg-secondary": status === "ongoing",
          "bg-primary": status === "completed",
          "bg-muted-foreground": status === "upcoming"
        }
      )} />
      <CardHeader className="py-2 px-4 flex flex-row justify-between items-center">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            <ChevronDown size={16} />
          </motion.div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        <Badge variant={statusVariant[status]} className="capitalize text-xs">
          {status}
        </Badge>
      </CardHeader>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="px-4 py-3 space-y-3">
              <div className="flex items-center text-xs text-muted-foreground">
                <span>Start date: {startDate}</span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{voteCount}</span>
                <span className="text-xs text-muted-foreground">people voted</span>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
