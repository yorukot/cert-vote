import Poll, {PollModel} from "@/lib/db/models/poll";
import {database} from "@/lib/db/mongodb";

interface GetPollsParams extends PollModel {
  limit: number;
}

export async function GET(request: Request, {params}: { params: Promise<Partial<GetPollsParams>> }) {
  const {limit, ...filters} = (await params)

  const cursor = (await Poll.find(database, filters)).limit(limit || 0);  // 0 = no limit

  const polls = (await cursor.toArray()).map((poll) => (
    poll.toJson()
  ))

  return Response.json(polls)
}
