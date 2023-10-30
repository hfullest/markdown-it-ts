import { Plugin } from "vuepress/config";
import { VuePressMarkdownImportPlugin } from "./vuepress-plugin-markdown-import";
import tsGendoc from "./ts-gendoc";

const VuePressTsGenDocPlugin: Plugin = (options) => {
  return {
    name: "vuepress-plugin-ts-gendoc",
    extendMarkdown: (md) => {
      (
        VuePressMarkdownImportPlugin({ importers: { ...tsGendoc } }) as any
      ).extendMarkdown(md); // 支持markdown @import 导入语法，并将参数解析到meta
    },
  };
};

export default VuePressTsGenDocPlugin;
