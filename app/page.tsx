"use client";

import { PollCard } from "@/components/poll/poll-card";
import { Vote } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { PollSearch } from "@/components/poll/poll-search";
import { useState } from "react";
import { PollModel } from "@/lib/db/models/poll";


export default function Home() {
  const { data, error, isLoading } = useSWR("/api/polls", fetcher);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
      <div className="grid place-items-center">
        <Vote width={100} height={100} className="mb-4" />
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-indigo-300 to-fuchsia-500 mb-2">CertVote</h1>
        <h2 className="text-lg text-muted-foreground mb-6">Anonymous voting system with blockchain based verification system</h2>

        <p className="text-lg mb-4">Choose an event to vote:</p>
      </div>
        <PollSearch setValue={setSearchValue} value={searchValue} />
      <div className="flex flex-col gap-3 w-full max-w-3xl justify-center items-center">
        <>
          {isLoading ? (
            <Skeleton className="w-full h-24" />
          ) : (
            data.map((i: PollModel) => {
              return (
                <PollCard
                  key={i.pollId}
                  title={i.title}
                  startDate={i.startTime.toISOString()}
                  endDate={i.endTime.toISOString()}
                  description={i.description}
                  creator={i.creator}
                  voteCount={0}
                  totalPossibleVotes={0}
                  status={i.status}
                />
              );
            })
          )}
          <PollCard
            title="台灣是否重啟"
            startDate="1746264846"
            endDate="1746364846"
            description="Vote for your prediction of tomorrow's weather."
            creator="Weather Team"
            voteCount={10}
            totalPossibleVotes={50}
            status="ongoing"
          />

          <PollCard
            title="Company offsite"
            startDate="1746264846"
            endDate="1746464846"
            description="Vote for the location of our next company offsite. Options: Mountains, Beach, City."
            creator="HR Team"
            voteCount={24}
            totalPossibleVotes={30}
            status="completed"
          />

          <PollCard
            title="Team building"
            startDate="1756264846"
            endDate="1757264846"
            description="Choose an activity for our next team building event."
            voteCount={0}
            totalPossibleVotes={15}
            status="upcoming"
          />
        </>
      </div>
    </div>
  );
}
