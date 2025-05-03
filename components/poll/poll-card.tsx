"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, User, Info, Vote, Check, X, Annoyed, Frown, Smile } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";

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

export function PollCard({ title, startDate, endDate, description, imageSrc, creator, voteCount, totalPossibleVotes = 100, status, className }: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    ongoing: "secondary",
    completed: "default",
    upcoming: "outline",
  };

  const progressPercentage = Math.min(Math.round((voteCount / totalPossibleVotes) * 100), 100);

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

  const handleVoteClick = (vote: string) => {
    setSelectedVote(vote);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Call your vote API here with { nationalId, vote: selectedVote }
    setTimeout(() => {
      setSubmitting(false);
      setDialogOpen(false);
      setNationalId("");
      setSelectedVote(null);
    }, 1000);
  };

  return (
    <div className="w-full shadow-sm hover:shadow-md">
      <Card className="overflow-hidden container rounded-t-xl rounded-b-none border-t border-x border-b-0 shadow-none duration-200 relative">
        <CardHeader className="cursor-pointer flex flex-row justify-between items-center" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-muted-foreground">
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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
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
                    <Info size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{description}</p>
                  </div>
                )}

                {/* Image */}
                {imageSrc && (
                  <div className="relative h-32 w-full overflow-hidden rounded-md">
                    <Image src={imageSrc} alt={`Image for ${title}`} fill className="object-cover" />
                  </div>
                )}
                <div className="flex flex-row justify-between items-center">
                  {/* Vote count */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{voteCount}</span>
                    <span className="text-xs text-muted-foreground">people voted</span>
                  </div>
                  {/* Voting buttons as dropdown */}
                  <div className="flex pt-2 justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" disabled={status !== "ongoing"}>
                          <Vote size={16} /> Vote
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="flex flex-col gap-2">
                        <DropdownMenuItem onClick={() => handleVoteClick("agree")}> <Smile size={16} /> Agree </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVoteClick("abstain")}> <Annoyed size={16} /> Abstain </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVoteClick("disagree")}> <Frown size={16} /> Disagree </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Dialog for national ID input */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <form onSubmit={handleDialogSubmit} className="space-y-4">
                      <DialogHeader>
                        <DialogTitle>Enter National ID</DialogTitle>
                        <DialogDescription>
                          To vote <span className="font-semibold">{selectedVote}</span>, please enter your national ID.
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        placeholder="National ID"
                        value={nationalId}
                        onChange={e => setNationalId(e.target.value)}
                        required
                        autoFocus
                        disabled={submitting}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={submitting || !nationalId}>
                          {submitting ? "Submitting..." : "Submit Vote"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar - always visible at bottom */}
      </Card>
      <div className="w-full h-3 bg-muted border-x border-b border-primary/20 rounded-b-xl">
        <div
          className={cn("h-full rounded-bl-xl", {
            "bg-secondary": status === "ongoing",
            "bg-primary": status === "completed",
            "bg-muted-foreground": status === "upcoming",
          }, progressPercentage >=99 ? "rounded-r-none" : "rounded-br-xl")}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
