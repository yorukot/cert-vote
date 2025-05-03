import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";

export interface PollModel {
  pollId: string;
  title: string;
  description: string;
  status: "ongoing" | "completed" | "upcoming";
  allowedNationalIds: string[];
}

export default class Poll implements PollModel {
  static readonly collection_name = "polls";
  private readonly collection: Collection<Poll>;

  constructor(
    private readonly database: Db,
    public readonly pollId: string,
    public title: string,
    public description: string,
    public status: "ongoing" | "completed" | "upcoming",
    public allowedNationalIds: string[] = [],
  ) {
    this.collection = this.database.collection<Poll>(Poll.collection_name);
  }

  static async create(database: Db, title: string, description: string, status: "ongoing" | "completed" | "upcoming", allowedNationalIds: string[] = []): Promise<Poll> {
    const pollId = crypto.randomUUID();

    return new Poll(database, pollId, title, description, status, allowedNationalIds);
  }

  static async find(database: Db, filter: Filter<PollModel>, options?: FindOptions & Abortable): Promise<Poll[]> {
    const cursor = database.collection<PollModel>(Poll.collection_name).find(filter, options);

    const docs = await cursor.toArray();
    return docs.map((doc) => new Poll(database, doc.pollId, doc.title, doc.description, doc.status, doc.allowedNationalIds || []));
  }

  static async findOne(database: Db, filter: Filter<PollModel>, options?: FindOptions & Abortable): Promise<Poll | null> {
    const doc = await database.collection<PollModel>(Poll.collection_name).findOne(filter, options);
    if (!doc) return null;

    const poll = new Poll(database, doc.pollId, doc.title, doc.description, doc.status, doc.allowedNationalIds || []);

    return poll;
  }

  async upsert(): Promise<UpdateResult> {
    return await this.collection.updateOne(
      { pollId: this.pollId },
      {
        $set: this.toJson(),
      },
      { upsert: true },
    );
  }

  async remove(): Promise<DeleteResult> {
    return await this.collection.deleteOne({ pollId: this.pollId });
  }

  static fromJson(database: Db, json: PollModel): Poll {
    return new Poll(database, json.pollId, json.title, json.description, json.status, json.allowedNationalIds || []);
  }

  toJson(): PollModel {
    return {
      pollId: this.pollId,
      title: this.title,
      description: this.description,
      status: this.status,
      allowedNationalIds: this.allowedNationalIds,
    };
  }
}
