"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, User, Info } from "lucide-react";
import Image from "next/image";

interface PollCardProps {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  imageSrc?: string;
  creator?: string;
  voteCount: number;
  totalPossibleVotes?: number;
  status: "ongoing" | "completed" | "upcoming";
  className?: string;
}

export function PollCard({
  title,
  startDate,
  endDate,
  description,
  imageSrc,
  creator,
  voteCount,
  totalPossibleVotes = 100,
  status,
  className,
}: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusVariant: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    ongoing: "secondary",
    completed: "default",
    upcoming: "outline",
  };

  const progressPercentage = Math.min(
    Math.round((voteCount / totalPossibleVotes) * 100),
    100
  );

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="w-full shadow-sm hover:shadow-md">
      <Card
        className="overflow-hidden container rounded-t-xl rounded-b-none border-t border-x border-b-0 shadow-none transition-all duration-200 relative"
      >
        <CardHeader
          className="cursor-pointer flex flex-row justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
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
              <CardContent className="px-6 pt-0 space-y-4">
                {/* Dates */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>Start: {formatDate(startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>End: {formatDate(endDate)}</span>
                  </div>
                </div>

                {/* Creator */}
                {creator && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User size={12} />
                    <span>Created by: {creator}</span>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <div className="flex gap-2 text-xs">
                    <Info
                      size={12}
                      className="text-muted-foreground flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm">{description}</p>
                  </div>
                )}

                {/* Image */}
                {imageSrc && (
                  <div className="relative h-32 w-full overflow-hidden rounded-md">
                    <Image
                      src={imageSrc}
                      alt={`Image for ${title}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Vote count */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {voteCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    people voted
                  </span>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar - always visible at bottom */}
      </Card>
      <div className="w-full h-3 bg-muted border-x border-b border-primary/20 rounded-b-xl">
        <div
          className={cn("h-full transition-all rounded-bl-xl", {
            "bg-secondary": status === "ongoing",
            "bg-primary": status === "completed",
            "bg-muted-foreground": status === "upcoming",
          })}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
