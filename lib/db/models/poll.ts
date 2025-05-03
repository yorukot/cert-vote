import { Db, Collection, FindCursor, UpdateResult, DeleteResult, Filter, WithId } from "mongodb";

export interface PollModel {
  pollId: string;
  title: string;
  description: string;
  status: "ongoing" | "completed" | "upcoming";
}

export default class Poll implements PollModel {
  static readonly collection_name = "polls";
  private readonly collection: Collection<Poll>;

  constructor(
    private readonly database: Db,
    public readonly pollId: string,
    public title: string,
    public description: string,
    public status: "ongoing" | "completed" | "upcoming"
  ) {
    this.collection = this.database.collection<Poll>(Poll.collection_name);
  }

  static async find(
    database: Db,
    filter: Filter<Poll>
  ): Promise<FindCursor<WithId<Poll>>> {
    return database
      .collection<Poll>(Poll.collection_name)
      .find(filter);
  }

  async upsert(): Promise<UpdateResult> {
    return await this.collection.updateOne(
      { pollId: this.pollId },
      { $set: { title: this.title, description: this.description } },
      { upsert: true }
    );
  }

  async remove(): Promise<DeleteResult> {
    return await this.collection.deleteOne({ pollId: this.pollId });
  }

  toJson(): PollModel {
    return {
      pollId: this.pollId,
      title: this.title,
      description: this.description,
      status: this.status
    };
  }
}
