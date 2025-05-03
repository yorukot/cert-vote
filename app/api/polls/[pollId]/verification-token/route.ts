import { NextRequest } from "next/server";
import Poll from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import { issueJwt } from "@/lib/jwt";

interface CreateVerificationTokenBody {
  nationalId: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  const body: CreateVerificationTokenBody = await request.json();

  if (!body.nationalId) {
    return Response.json({ error: "National ID is required" }, { status: 400 });
  }

  // const user = await User.findOne(database, { nationalId: body.nationalId });

  // if (!user) {
  //   return Response.json({ error: "User with the national id not found" }, { status: 404 });
  // }

  // if (!poll.allowedNationalIds.includes(user.nationalId)) {
  //   return Response.json({ error: "The national ID is not allowed for this poll." }, { status: 403 });
  // }

  // poll is guaranteed to be defined here
  const jwt = await issueJwt(poll);

  return Response.json({ verificationToken: jwt });
}
