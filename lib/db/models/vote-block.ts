import { createHash } from "crypto";
import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";

export interface VoteBlockModel {
  previousBlockHash: string;
  index: number;
  pollId: string;
  userPublicKey: string;
  voteRandomId: string;
  selectedOption: "agree" | "disagree" | "abstain";
  userSignature: string;
  hash: string;
}

export function createBlockHash(previousBlockHash: string, pollId: string, index: number, userPublicKey: string, voteRandomId: string, selectedOption: "agree" | "disagree" | "abstain", userSignature: string): string {
  return createHash("sha256")
    .update(previousBlockHash + pollId + index + userPublicKey + voteRandomId + selectedOption + userSignature)
    .digest("hex");
}

export class VoteBlock implements VoteBlockModel {
  static readonly collection_name = "vote-blocks";
  private readonly collection: Collection<VoteBlockModel>;

  constructor(
    private readonly database: Db,
    public readonly previousBlockHash: string,
    public readonly index: number,
    public readonly pollId: string,
    public readonly userPublicKey: string,
    public readonly voteRandomId: string,
    public readonly selectedOption: "agree" | "disagree" | "abstain",
    public readonly userSignature: string,
    public readonly hash: string,
  ) {
    this.collection = this.database.collection<VoteBlockModel>(VoteBlock.collection_name);
  }

  static async getLastBlock(database: Db) {
    const collection = database.collection<VoteBlockModel>(this.collection_name);

    await collection.createIndex({ index: 1 }, { background: true });

    const cursor = await this.find(database, {}, { sort: { index: -1 }, limit: 1 });

    const lastBlock = cursor.at(0);

    if (!lastBlock) {
      return undefined;
    }

    return VoteBlock.fromJson(database, lastBlock);
  }

  static async append(database: Db, pollId: string, index: number, userPublicKey: string, voteRandomId: string, selectedOption: "agree" | "disagree" | "abstain", userSignature: string): Promise<VoteBlock> {
    let previousBlock = await VoteBlock.getLastBlock(database);

    if (!previousBlock) {
      const genesisBlock = new VoteBlock(database, "", 0, pollId, "", "", "abstain", "", createBlockHash("", pollId, 0, "", "", "abstain", ""));
      await genesisBlock.upsert();

      previousBlock = genesisBlock;
    }

    const hash = createBlockHash(previousBlock.hash, pollId, index, userPublicKey, voteRandomId, selectedOption, userSignature);

    return new VoteBlock(database, previousBlock.hash, index, pollId, userPublicKey, voteRandomId, selectedOption, userSignature, hash);
  }

  static async find(database: Db, filter: Filter<VoteBlockModel>, options?: FindOptions & Abortable): Promise<VoteBlock[]> {
    const cursor = database.collection<VoteBlockModel>(VoteBlock.collection_name).find(filter, options);

    const docs = await cursor.toArray();
    return docs.map((doc) => VoteBlock.fromJson(database, doc));
  }

  static async findOne(database: Db, filter: Filter<VoteBlockModel>, options?: FindOptions & Abortable): Promise<VoteBlock | null> {
    const doc = await database.collection<VoteBlockModel>(VoteBlock.collection_name).findOne(filter, options);
    if (!doc) return null;

    return VoteBlock.fromJson(database, doc);
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

  toJson(): VoteBlockModel {
    return {
      previousBlockHash: this.previousBlockHash,
      index: this.index,
      pollId: this.pollId,
      userPublicKey: this.userPublicKey,
      voteRandomId: this.voteRandomId,
      selectedOption: this.selectedOption,
      userSignature: this.userSignature,
      hash: this.hash,
    };
  }

  static fromJson(database: Db, json: VoteBlockModel): VoteBlock {
    return new VoteBlock(database, json.previousBlockHash, json.index, json.pollId, json.userPublicKey, json.voteRandomId, json.selectedOption, json.userSignature, json.hash);
  }
}
