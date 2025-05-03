import Poll from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import { NextRequest } from "next/server";
import { VoteBlock } from "@/lib/db/models/vote-block";
import VoteKey from "@/lib/db/models/vote-key";
import { subtle } from "crypto";

interface CreateVoteBlockBody {
  voteRandomId: string;
  selectedOption: "agree" | "disagree" | "abstain";
  userSignature: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const blocks = await VoteBlock.find(database, { pollId: poll.pollId }, { sort: { index: -1 }, limit: limit });

  return blocks.map((block) => block.toJson());
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const body: CreateVoteBlockBody | undefined = await request.json();

  if (!body) {
    return Response.json({ error: "Request body is required" }, { status: 400 });
  }

  if (!body.voteRandomId) {
    return Response.json({ error: "Random ID is required" }, { status: 400 });
  }

  if (!body.selectedOption) {
    return Response.json({ error: "Selected option is required" }, { status: 400 });
  }

  if (!body.userSignature) {
    return Response.json({ error: "User signature is required" }, { status: 400 });
  }

  // Verify the signature
  const voteKey = await VoteKey.findOne(database, { voteRandomId: body.voteRandomId });

  if (!voteKey) {
    return Response.json({ error: "Invalid random ID. Have you forgot to register it at `POST /api/polls/[pollId]/vote-key`?" }, { status: 404 });
  }

  if (voteKey.pollId !== pollId) {
    return Response.json({ error: "Vote key does not belong to this poll" }, { status: 403 });
  }

  // Verify the signature using subtle crypto, with voteKey.userPublicKey
  const encoder = new TextEncoder();
  const data = encoder.encode(voteKey.voteRandomId + body.selectedOption);
  const signature = Buffer.from(body.userSignature, 'base64');
  
  // Import the public key for ECDSA
  const publicKeyRaw = Buffer.from(voteKey.userPublicKey, 'base64');
  const publicKey = await subtle.importKey(
    "raw",
    publicKeyRaw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );

  const isValidSignature = await subtle.verify(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    publicKey,
    signature,
    data
  );
  if (!isValidSignature) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const nextBlock = await VoteBlock.prepareNextBlock(database, pollId, voteKey.userPublicKey, body.voteRandomId, body.selectedOption, body.userSignature);
  await nextBlock.upsert();

  return Response.json({ createdVoteBlock: nextBlock.toJson() });
}
