import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";

interface VoteKey {
  pollId: string;
  userPublicKey: string;
  voteRandomId: string; // used to search for the public key when voting, while ensuring anonymity
}

export default class VoteKeyModel implements VoteKey {
  static readonly collection_name = "vote-keys";
  private readonly collection: Collection<VoteKey>;

  constructor(
    private readonly database: Db,
    public readonly pollId: string,
    public readonly userPublicKey: string,
    public readonly voteRandomId: string,
  ) {
    this.collection = this.database.collection<VoteKey>(VoteKeyModel.collection_name);
  }

  static async create(database: Db, pollId: string, userPublicKey: string, voteRandomId: string): Promise<VoteKeyModel> {
    return new VoteKeyModel(database, pollId, userPublicKey, voteRandomId);
  }

  static async find(database: Db, filter: Filter<VoteKey>, options?: FindOptions & Abortable): Promise<VoteKeyModel[]> {
    const cursor = database.collection<VoteKey>(VoteKeyModel.collection_name).find(filter, options);

    const docs = await cursor.toArray();
    return docs.map((doc) => VoteKeyModel.fromJson(database, doc));
  }

  static async findOne(database: Db, filter: Filter<VoteKey>, options?: FindOptions & Abortable): Promise<VoteKeyModel | null> {
    const doc = await database.collection<VoteKey>(VoteKeyModel.collection_name).findOne(filter, options);
    if (!doc) return null;

    return VoteKeyModel.fromJson(database, doc);
  }

  async upsert(): Promise<UpdateResult> {
    return await this.collection.updateOne(
      { pollId: this.pollId, userPublicKey: this.userPublicKey },
      {
        $set: this.toJson(),
      },
      { upsert: true },
    );
  }

  async remove(): Promise<DeleteResult> {
    return await this.collection.deleteOne({ pollId: this.pollId, userPublicKey: this.userPublicKey });
  }

  toJson(): VoteKey {
    return {
      pollId: this.pollId,
      userPublicKey: this.userPublicKey,
      voteRandomId: this.voteRandomId,
    };
  }

  static fromJson(database: Db, json: VoteKey): VoteKeyModel {
    return new VoteKeyModel(database, json.pollId, json.userPublicKey, json.voteRandomId);
  }
}
