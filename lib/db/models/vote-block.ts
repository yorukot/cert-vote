import { createHash } from "crypto";
import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";
import VoteKey from "./vote-key";

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

interface VoteResult {
  agree: number;
  disagree: number;
  abstain: number;
}

export function createBlockHash(
  previousBlockHash: string,
  pollId: string,
  index: number,
  userPublicKey: string,
  voteRandomId: string,
  selectedOption: "agree" | "disagree" | "abstain",
  userSignature: string,
): string {
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

  static async getLatestBlock(database: Db) {
    const cursor = await this.find(database, {}, { sort: { index: -1 }, limit: 1 });

    const lastBlock = cursor.at(0);

    if (!lastBlock) {
      return undefined;
    }

    return VoteBlock.fromJson(database, lastBlock);
  }

  /// Note: You still need to call upsert() after this to save the block to the database.
  static async prepareNextBlock(
    database: Db,
    pollId: string,
    userPublicKey: string,
    voteRandomId: string,
    selectedOption: "agree" | "disagree" | "abstain",
    userSignature: string,
  ): Promise<VoteBlock> {
    let previousBlock = await VoteBlock.getLatestBlock(database);

    if (!previousBlock) {
      const genesisBlock = new VoteBlock(database, "", 0, pollId, "", "", "abstain", "", createBlockHash("", pollId, 0, "", "", "abstain", ""));
      await genesisBlock.upsert();

      previousBlock = genesisBlock;
    }

    const index = previousBlock.index + 1;

    const hash = createBlockHash(previousBlock.hash, pollId, index, userPublicKey, voteRandomId, selectedOption, userSignature);

    return new VoteBlock(database, previousBlock.hash, index, pollId, userPublicKey, voteRandomId, selectedOption, userSignature, hash);
  }

  static async find(database: Db, filter: Filter<VoteBlockModel>, options?: FindOptions & Abortable): Promise<VoteBlock[]> {
    const collection = database.collection<VoteBlockModel>(VoteBlock.collection_name);
    const cursor = collection.find(filter, options);

    await collection.createIndex({ index: 1 }, { background: true });

    const docs = await cursor.toArray();
    return docs.map((doc) => VoteBlock.fromJson(database, doc));
  }

  static async findOne(database: Db, filter: Filter<VoteBlockModel>, options?: FindOptions & Abortable): Promise<VoteBlock | null> {
    const collection = database.collection<VoteBlockModel>(VoteBlock.collection_name);

    await collection.createIndex({ index: 1 }, { background: true });

    const doc = await collection.findOne(filter, options);
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

  async verifyAndCountResult() {
    const result: VoteResult = {
      agree: 0,
      disagree: 0,
      abstain: 0,
    };

    // Get the vote keys for the poll
    const voteKeys = await VoteKey.find(this.database, { pollId: this.pollId });
    const voteKeyMap = new Map<string, VoteKey>(voteKeys.map((vk) => [vk.voteRandomId, vk] as [string, VoteKey]));

    // Get the blocks for the poll
    const blocks = await VoteBlock.find(this.database, { pollId: this.pollId }, { sort: { index: -1 } });
    const blockMap = new Map<string, VoteBlock>(blocks.map((vb) => [vb.hash, vb] as [string, VoteBlock]));

    let currentBlock = blocks[0];

    // The genesis block has index 0, so it won't be processed, as the genesis block's select option is always "abstain"
    while (currentBlock.index > 0) {
      createBlockHash(
        currentBlock.previousBlockHash,
        currentBlock.pollId,
        currentBlock.index,
        currentBlock.userPublicKey,
        currentBlock.voteRandomId,
        currentBlock.selectedOption,
        currentBlock.userSignature,
      );

      if (currentBlock.hash !== currentBlock.hash) {
        throw new Error("Block hash does not match: " + currentBlock.hash);
      }

      const voteKey = voteKeyMap.get(currentBlock.voteRandomId);

      if (!voteKey) {
        throw new Error("Vote key not found for voteRandomId: " + currentBlock.voteRandomId + " in block " + currentBlock.hash);
      }

      // Count the result
      if (currentBlock.selectedOption === "agree") {
        result.agree++;
      } else if (currentBlock.selectedOption === "disagree") {
        result.disagree++;
      } else if (currentBlock.selectedOption === "abstain") {
        result.abstain++;
      }

      // Move to the previous block
      const previousBlock = blockMap.get(currentBlock.previousBlockHash);

      if (!previousBlock) {
        throw new Error("Previous block " + currentBlock.previousBlockHash + " not found for block: " + currentBlock.hash);
      }

      currentBlock = previousBlock;
    }

    return result;
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
