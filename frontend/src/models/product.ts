import { Collections, ProductResponse } from "../../pocketbase-types";
import { pb } from "../utils/pb";
import { Entity } from "./base-entity";

export const Product: Entity<ProductResponse> = {
  create: (data) => pb.collection(Collections.Product).create(data),
  update: (id, data) => pb.collection(Collections.Product).update(id, data),
};
