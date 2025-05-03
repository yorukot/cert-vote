import { NextRequest, NextResponse } from "next/server";
import Poll, { PollModel } from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import type { Filter } from "mongodb";

function isStatus(s: string): s is PollModel["status"] {
  return ["ongoing", "completed", "upcoming"].includes(s);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const filters: Filter<PollModel> = {};

  for (const key of ["status", "pollId", "title", "description"] as const) {
    const val = searchParams.get(key);
    if (val === null) continue;

    if (key === "status") {
      if (!isStatus(val)) {
        return NextResponse.json({ error: `Invalid status value: ${val}` }, { status: 400 });
      }
      filters.status = val;
    } else {
      filters[key] = val;
    }
  }

  const polls = await Poll.find(database, filters, {
    limit: limit || 0,
  });

  return NextResponse.json(polls.map((poll) => poll.toJson()));
}
