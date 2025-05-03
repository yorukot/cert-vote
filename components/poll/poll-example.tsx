import React from "react";
import { PollCard } from "./poll-card";

export function PollExample() {
  return (
    <div className="flex flex-col gap-3 p-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-primary mb-1">Active Polls</h2>
      <p className="text-xs text-muted-foreground mb-2">Click on a poll to see details</p>
      
      <PollCard
        title="Tomorrow's lunch"
        startDate="2/32"
        voteCount={10}
        status="ongoing"
      />
      
      <PollCard
        title="Company offsite"
        startDate="5/15"
        voteCount={24}
        status="completed"
      />
      
      <PollCard
        title="Team building"
        startDate="6/10"
        voteCount={0}
        status="upcoming"
      />
    </div>
  );
} 