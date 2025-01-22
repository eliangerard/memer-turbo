import { LavalinkNode } from "riffy";

export default {
  name: "nodeError",
  execute(node: LavalinkNode, error: string) {
    if (error) console.log(`Error with Node "${node.name}": ${error}`);
  },
};
