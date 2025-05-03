import { database } from "@/lib/db/mongodb";
import Poll from "@/lib/db/models/poll";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  return Response.json(poll.toJson());
}
