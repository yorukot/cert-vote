import { NextRequest } from "next/server";
import Poll from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import { VoteBlock } from "@/lib/db/models/vote-block";

export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const latestBlock = await VoteBlock.getLatestBlock(database);

  if (!latestBlock) {
    // The genesis block for the poll has not been created yet.
    return Response.json({
      agree: 0,
      disagree: 0,
      abstain: 0,
    });
  }

  try {
    return Response.json(await latestBlock.verifyAndCountResult());
  } catch (e: Error) {
    return Response.json({ error: "Failed to verify and count results: " + e.cause }, { status: 500 });
  }
}
