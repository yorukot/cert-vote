import { database } from "@/lib/db/mongodb";
import Poll, { PollModel } from "@/lib/db/models/poll";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  const poll = await Poll.findOne(database, { pollId: pollId });

  if (!poll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  return Response.json(poll.toJson());
}

// Update a poll
export async function PUT(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  // Find the existing poll
  const existingPoll = await Poll.findOne(database, { pollId });

  if (!existingPoll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Update existing poll properties
    if (body.title) existingPoll.title = body.title;
    if (body.description) existingPoll.description = body.description;
    if (body.creator) existingPoll.creator = body.creator;
    
    if (body.startTime) {
      const startTime = new Date(body.startTime);
      if (isNaN(startTime.getTime())) {
        return Response.json({ error: "Invalid startTime format" }, { status: 400 });
      }
      existingPoll.startTime = startTime;
    }
    
    if (body.endTime) {
      const endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        return Response.json({ error: "Invalid endTime format" }, { status: 400 });
      }
      existingPoll.endTime = endTime;
    }
    
    if (body.allowedNationalIds) {
      if (!Array.isArray(body.allowedNationalIds)) {
        return Response.json({ error: "allowedNationalIds must be an array" }, { status: 400 });
      }
      existingPoll.allowedNationalIds = body.allowedNationalIds;
    }

    // Save the updated poll
    await existingPoll.upsert();

    return Response.json(existingPoll.toJson());
  } catch (error) {
    console.error("Error updating poll:", error);
    return Response.json({ error: "Failed to update poll" }, { status: 500 });
  }
}

// Delete a poll
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;

  // Find the existing poll
  const existingPoll = await Poll.findOne(database, { pollId });

  if (!existingPoll) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  try {
    await existingPoll.remove();
    return Response.json({ message: "Poll deleted successfully" });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return Response.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}
