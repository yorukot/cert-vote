import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";

interface VoteKeyModel {
  pollId: string;
  userPublicKey: string;
  voteRandomId: string; // used to search for the public key when voting, while ensuring anonymity
}

export default class VoteKey implements VoteKeyModel {
  static readonly collection_name = "vote-keys";
  private readonly collection: Collection<VoteKeyModel>;

  constructor(
    private readonly database: Db,
    public readonly pollId: string,
    public readonly userPublicKey: string,
    public readonly voteRandomId: string,
  ) {
    this.collection = this.database.collection<VoteKeyModel>(VoteKey.collection_name);
  }

  static async create(database: Db, pollId: string, userPublicKey: string, voteRandomId: string): Promise<VoteKey> {
    return new VoteKey(database, pollId, userPublicKey, voteRandomId);
  }

  static async find(database: Db, filter: Filter<VoteKeyModel>, options?: FindOptions & Abortable): Promise<VoteKey[]> {
    const cursor = database.collection<VoteKeyModel>(VoteKey.collection_name).find(filter, options);

    const docs = await cursor.toArray();
    return docs.map((doc) => VoteKey.fromJson(database, doc));
  }

  static async findOne(database: Db, filter: Filter<VoteKeyModel>, options?: FindOptions & Abortable): Promise<VoteKey | null> {
    const doc = await database.collection<VoteKeyModel>(VoteKey.collection_name).findOne(filter, options);
    if (!doc) return null;

    return VoteKey.fromJson(database, doc);
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

  toJson(): VoteKeyModel {
    return {
      pollId: this.pollId,
      userPublicKey: this.userPublicKey,
      voteRandomId: this.voteRandomId,
    };
  }

  static fromJson(database: Db, json: VoteKeyModel): VoteKey {
    return new VoteKey(database, json.pollId, json.userPublicKey, json.voteRandomId);
  }
}
