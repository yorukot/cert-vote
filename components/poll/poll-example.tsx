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
        endDate="2/33"
        description="Let's decide what to have for lunch tomorrow. Options include pizza, sushi, or salad."
        imageSrc="/images/food.jpg"
        creator="Chef Jamie"
        voteCount={10}
        totalPossibleVotes={25}
        status="ongoing"
      />
      
      <PollCard
        title="Company offsite"
        startDate="5/15"
        endDate="5/30"
        description="Vote for the location of our next company offsite. Options: Mountains, Beach, City."
        creator="HR Team"
        voteCount={24}
        totalPossibleVotes={30}
        status="completed"
      />
      
      <PollCard
        title="Team building"
        startDate="6/10"
        endDate="6/15"
        description="Choose an activity for our next team building event."
        voteCount={0}
        totalPossibleVotes={15}
        status="upcoming"
      />
    </div>
  );
} 