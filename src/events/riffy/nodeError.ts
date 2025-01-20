import { LavalinkNode } from "riffy";

export default {
  name: "nodeConnect",
  execute(node: LavalinkNode, error: string) {
    if (error) console.log(`Error with Node "${node.name}": ${error}`);
  },
};
