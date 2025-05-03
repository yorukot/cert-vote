import Image from "next/image";
import { PollCard } from "@/components/poll/poll-card";
import { Vote } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
      <div className="grid place-items-center">
        <Vote width={100} height={100} className="mb-4" />
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-indigo-300 to-fuchsia-500 mb-2">
          CertVote
        </h1>
        <h2 className="text-lg text-muted-foreground mb-6">
          Anomyous voting system with blockchain based verification system
        </h2>

        <p className="text-lg">Choose an event to vote:</p>
      </div>
      <div className="flex flex-col gap-3 w-full basis-2/3 justify-center items-center">
        <PollCard
          title="Tomorrow's weather"
          startDate="1746264846"
          voteCount={10}
          status="ongoing"
        />

        <PollCard
          title="Company offsite"
          startDate="1746264846"
          voteCount={24}
          status="completed"
        />

        <PollCard
          title="Team building"
          startDate="1746264846"
          voteCount={0}
          status="upcoming"
        />
      </div>
    </div>
  );
}
