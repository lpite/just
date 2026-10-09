import { TypedPocketBase } from "../../pocketbase-types";
import PocketBase from "pocketbase";
const url = window.location.hostname;
console.log(url);
export const pb = new PocketBase(`http://${url}:8090`) as TypedPocketBase;
pb.autoCancellation(false);
