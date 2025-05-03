import { NextRequest } from "next/server";
import Poll from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import { verifyJwt } from "@/lib/jwt";
import VoteKey from "@/lib/db/models/vote-key";

interface CreateVoteKeyBody {
  userPublicKey: string;
  randomId: string;
  verificationToken: string;
  userId: string; // The verification token issued in the previous step
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const body: CreateVoteKeyBody = await request.json();

  if (!body.userPublicKey) {
    return Response.json({ error: "User public key is required" }, { status: 400 });
  }

  if (!body.randomId) {
    return Response.json({ error: "Random ID is required" }, { status: 400 });
  }

  if (!body.verificationToken) {
    return Response.json({ error: "Verification token is required" }, { status: 400 });
  }

  if (!body.userId) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  const jwtPayload = await verifyJwt(body.verificationToken, body.userId);

  if (jwtPayload.pollId != pollId) {
    return Response.json({ error: "Invalid verification token" }, { status: 403 });
  }

  // We don't have to verify if the user is allowed to vote, because we already verified it in the previous step, they won't get the jwt if they are not allowed to vote.
  const voteKey = await VoteKey.create(database, pollId, body.userPublicKey, body.randomId);
  await voteKey.upsert();

  return Response.json({ createdVoteKey: voteKey.toJson() });
}
