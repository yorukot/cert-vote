import { Db, Collection, FindCursor, UpdateResult, DeleteResult, Filter, WithId } from "mongodb";

export default class PollModel {
  static readonly collection_name = "polls";
  public readonly collection: Collection<PollModel>;

  constructor(
    private readonly database: Db,
    public readonly pollId: string,
    public title: string,
    public description: string,
  ) {
    this.collection = this.database.collection<PollModel>(PollModel.collection_name);
  }

  static async find(
    database: Db,
    filter: Filter<PollModel>
  ): Promise<FindCursor<WithId<PollModel>>> {
    return database
      .collection<PollModel>(PollModel.collection_name)
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
}
