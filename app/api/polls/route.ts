import { NextRequest, NextResponse } from "next/server";
import Poll, { PollModel } from "@/lib/db/models/poll";
import { database } from "@/lib/db/mongodb";
import type { Filter } from "mongodb";

function isStatus(s: string): s is PollModel["status"] {
  return ["ongoing", "completed", "upcoming"].includes(s);
}

function isValidDate(s: string): boolean {
  return !isNaN(Date.parse(s));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 0;

  const filters: Filter<PollModel> = {};

  // Basic string filters
  for (const key of ["status", "pollId", "title", "description", "creator"] as const) {
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

  // Date filters
  const startTimeAfter = searchParams.get("startTimeAfter");
  if (startTimeAfter) {
    if (!isValidDate(startTimeAfter)) {
      return NextResponse.json({ error: "Invalid startTimeAfter date format" }, { status: 400 });
    }
    filters.startTime = { $gte: new Date(startTimeAfter) };
  }

  const startTimeBefore = searchParams.get("startTimeBefore");
  if (startTimeBefore) {
    if (!isValidDate(startTimeBefore)) {
      return NextResponse.json({ error: "Invalid startTimeBefore date format" }, { status: 400 });
    }
    
    if (filters.startTime) {
      // If startTimeAfter is also set, use $gte and $lte together
      filters.startTime = { 
        ...filters.startTime, 
        $lte: new Date(startTimeBefore) 
      };
    } else {
      filters.startTime = { $lte: new Date(startTimeBefore) };
    }
  }

  const endTimeAfter = searchParams.get("endTimeAfter");
  if (endTimeAfter) {
    if (!isValidDate(endTimeAfter)) {
      return NextResponse.json({ error: "Invalid endTimeAfter date format" }, { status: 400 });
    }
    filters.endTime = { $gte: new Date(endTimeAfter) };
  }

  const endTimeBefore = searchParams.get("endTimeBefore");
  if (endTimeBefore) {
    if (!isValidDate(endTimeBefore)) {
      return NextResponse.json({ error: "Invalid endTimeBefore date format" }, { status: 400 });
    }
    
    if (filters.endTime) {
      // If endTimeAfter is also set, use $gte and $lte together
      filters.endTime = { 
        ...filters.endTime, 
        $lte: new Date(endTimeBefore) 
      };
    } else {
      filters.endTime = { $lte: new Date(endTimeBefore) };
    }
  }

  const polls = await Poll.find(database, filters, {
    limit: limit || 0,
  });

  return NextResponse.json(polls.map((poll) => poll.toJson()));
}

// Create a new poll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    if (!body.description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    
    if (!body.creator) {
      return NextResponse.json({ error: "Creator is required" }, { status: 400 });
    }
    
    // Validate and parse dates
    let startTime: Date;
    if (!body.startTime) {
      return NextResponse.json({ error: "Start time is required" }, { status: 400 });
    } else {
      startTime = new Date(body.startTime);
      if (isNaN(startTime.getTime())) {
        return NextResponse.json({ error: "Invalid startTime format" }, { status: 400 });
      }
    }
    
    let endTime: Date;
    if (!body.endTime) {
      return NextResponse.json({ error: "End time is required" }, { status: 400 });
    } else {
      endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json({ error: "Invalid endTime format" }, { status: 400 });
      }
    }
    
    // Validate that end time is after start time
    if (endTime <= startTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }
    
    // Validate status
    const status = body.status || "upcoming";
    if (!isStatus(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    
    // Validate allowedNationalIds
    const allowedNationalIds = body.allowedNationalIds || [];
    if (!Array.isArray(allowedNationalIds)) {
      return NextResponse.json({ error: "allowedNationalIds must be an array" }, { status: 400 });
    }
    
    // Create new poll
    const newPoll = await Poll.create(
      database,
      body.title,
      body.description,
      body.creator,
      startTime,
      endTime,
      status,
      allowedNationalIds
    );
    
    // Save to database
    await newPoll.upsert();
    
    // Return the created poll
    return NextResponse.json(newPoll.toJson(), { status: 201 });
  } catch (error) {
    console.error("Error creating poll:", error);
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
