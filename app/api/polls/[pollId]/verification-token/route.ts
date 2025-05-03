import { NextRequest } from "next/server";
import Poll from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";

export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  return Response.json();
}
