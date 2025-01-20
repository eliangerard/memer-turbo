import { LavalinkNode } from "riffy";

export default {
  name: "nodeConnect",
  execute(node: LavalinkNode) {
    console.log(`Node "${node.name}" connected.`);
  },
};
