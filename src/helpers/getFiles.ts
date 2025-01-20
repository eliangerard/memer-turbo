import fs from "node:fs";

export const getFiles = (dirName: string) => {
  console.log(`Current directory: ${process.cwd()}`);
  let files: string[] = [];
  const items = fs.readdirSync(dirName, { withFileTypes: true });

  items.forEach((item) => {
    if (item.isDirectory()) {
      files = [
        ...files.filter((file) => file.endsWith(".ts")),
        ...getFiles(`${dirName}/${item.name}`),
      ];
    } else {
      files.push(`${dirName.substring(dirName.indexOf("/"))}/${item.name}`);
    }
  });

  return files;
};
