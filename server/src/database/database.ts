export abstract class Database {

  public abstract connect(): Promise<void>;

  public abstract databaseExists(): Promise<boolean>;

  public abstract ensureDatabase(): Promise<void>;

  public abstract tableExists(): Promise<boolean>;

  public abstract ensureTable(): Promise<void>;

  public abstract clearTable(): Promise<void>;

  public abstract dropTable(): Promise<void>;

}