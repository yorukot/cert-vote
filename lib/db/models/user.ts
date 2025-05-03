import { Abortable, Collection, Db, DeleteResult, Filter, FindOptions, UpdateResult } from "mongodb";

export interface UserModel {
  nationalId: string;
  userId: string;
}

export default class User implements UserModel {
  static readonly collection_name = "users";
  private readonly collection: Collection<User>;

  constructor(
    private readonly database: Db,
    public readonly nationalId: string,
    public readonly userId: string,
  ) {
    this.collection = this.database.collection<User>(User.collection_name);
  }

  static async create(database: Db, nationalId: string, userId: string): Promise<User> {
    return new User(database, nationalId, userId);
  }

  static async find(database: Db, filter: Filter<UserModel>, options?: FindOptions & Abortable): Promise<User[]> {
    const cursor = database.collection<UserModel>(User.collection_name).find(filter, options);

    const docs = await cursor.toArray();
    return docs.map((doc) => User.fromJson(database, doc));
  }

  static async findOne(database: Db, filter: Filter<UserModel>, options?: FindOptions & Abortable): Promise<User | null> {
    const doc = await database.collection<UserModel>(User.collection_name).findOne(filter, options);
    if (!doc) return null;

    return User.fromJson(database, doc);
  }

  async upsert(): Promise<UpdateResult> {
    return await this.collection.updateOne(
      { nationalId: this.nationalId },
      {
        $set: this.toJson(),
      },
      { upsert: true },
    );
  }

  async remove(): Promise<DeleteResult> {
    return await this.collection.deleteOne({ nationalId: this.nationalId });
  }

  toJson(): UserModel {
    return {
      nationalId: this.nationalId,
      userId: this.userId,
    };
  }

  static fromJson(database: Db, json: UserModel): User {
    return new User(database, json.nationalId, json.userId);
  }
}
