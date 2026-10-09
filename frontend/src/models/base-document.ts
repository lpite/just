type ID = string;

export abstract class Document<TData = any> {
  id?: ID;
  protected data!: TData;

  /* ===== Public API ===== */

  async load(id: ID): Promise<this> {
    const raw = await this.fetch(id);
    this.id = id;
    this.data = raw;
    return this;
  }

  async create(data: TData): Promise<this> {
    this.data = data;
    await this.onCreate();
    const id = await this.insert(this.data);
    this.id = id;
    return this;
  }

  async save(): Promise<this> {
    if (!this.id) {
      throw new Error("Document is not created yet");
    }
    await this.onSave();
    await this.update(this.id, this.data);
    return this;
  }

  /* ===== Hooks (override if needed) ===== */

  protected async onCreate(): Promise<void> {}
  protected async onSave(): Promise<void> {}

  /* ===== Persistence layer (must implement) ===== */

  protected abstract fetch(id: ID): Promise<TData>;
  protected abstract insert(data: TData): Promise<ID>;
  protected abstract update(id: ID, data: TData): Promise<void>;
}
