// @ts-nocheck
export type Entity<T> = {
  create: (data: T) => Promise<{ id: string }>;
  update: (id: string, data: T) => Promise<void>;

  beforeCreate?: (data: T) => T;
  afterCreate?: (data: T, id: string) => void;

  beforeSave?: (data: T) => T;
  afterSave?: (data: T, id: string) => void;
};

export async function createEntity<T>(def: Entity<T>, data: T) {
  const finalData = def.beforeCreate ? def.beforeCreate(data) : data;
  const { id } = await def.create(finalData);

  if (def.afterCreate) {
    def.afterCreate(data, id);
  }

  return id;
}

export async function saveEntity<T>(def: Entity<T>, id: string, data: T) {
  const finalData = def.beforeSave ? def.beforeSave(data) : data;

  await def.update(id, finalData);

  if (def.afterSave) {
    def.afterSave(data, id);
  }
}

export function useEntity<T>(): T {}
