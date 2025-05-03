"use client";

import { PollCard } from "@/components/poll/poll-card";
import { Vote } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { PollSearch } from "@/components/poll/poll-search";
import { useState, useMemo } from "react";
import { PollModel } from "@/lib/db/models/poll";
import dayjs from "dayjs";
import Fuse from "fuse.js";

function getPollStatus(start: string | Date, end: string | Date): "upcoming" | "ongoing" | "completed" {
  const now = dayjs();
  const startTime = dayjs(start);
  const endTime = dayjs(end);
  if (now.isBefore(startTime)) return "upcoming";
  if (now.isAfter(endTime)) return "completed";
  return "ongoing";
}

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/polls", fetcher);
  const [searchValue, setSearchValue] = useState("");

  // Memoize Fuse instance and filtered results
  const filteredPolls = useMemo(() => {
    if (!data) return [];
    if (!searchValue.trim()) return data;
    const fuse = new Fuse(data, {
      keys: ["title", "description", "creator"],
      threshold: 0.4,
    });
    return fuse.search(searchValue).map((result) => result.item);
  }, [data, searchValue]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
      <div className="grid place-items-center">
        <Vote width={100} height={100} className="mb-4" />
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-indigo-300 to-fuchsia-500 mb-2">CertVote</h1>
        <h2 className="text-lg text-muted-foreground mb-6 text-center">Anonymous voting system with blockchain based verification system</h2>
      </div>
      <PollSearch setValue={setSearchValue} value={searchValue} />
      <div className="flex flex-col gap-3 w-full max-w-3xl justify-center items-center">
        {isLoading ? (
          <Skeleton className="w-full h-24" />
        ) : filteredPolls.length === 0 ? (
          <div className="w-full h-24 border-dashed grid place-items-center border-muted rounded-xl border-2">
            <p className=" text-muted-foreground ">Nothing matched your query, seriously.</p>
          </div>
        ) : (
          filteredPolls.map((i: PollModel) => (
            <PollCard
              key={i.pollId}
              pollId={i.pollId}
              title={i.title}
              startDate={dayjs(i.startTime).unix().toString()}
              endDate={dayjs(i.endTime).unix().toString()}
              description={i.description}
              creator={i.creator}
              voteCount={0}
              totalPossibleVotes={0}
              status={getPollStatus(i.startTime, i.endTime)}
            />
          ))
        )}
      </div>
    </div>
  );
}
