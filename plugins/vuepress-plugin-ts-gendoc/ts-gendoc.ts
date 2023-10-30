import { resolve } from "path";
import parser from "react-docgen-typescript";
import {
  markdownRender,
  renderers,
} from "react-docgen-typescript-markdown-render";
import { MarkdownImportOptions } from "./vuepress-plugin-markdown-import";

export default {
  "ts-gendoc": {
    alias: { "@": resolve(process.cwd(), "src") },
    level: 3,
    handler(md, tokens, idx) {
      const token = tokens[idx];
      const { path, params } = token.meta;
      const componentDocs = parser.parse(path, {
        savePropValueAsString: true,
      });
      const mdDoc = markdownRender(componentDocs, {
        renderer: renderers.aliMaterialRenderer,
        language: "zh_CN",
      });
      const componentTokens = md.parse(mdDoc, {});
      componentTokens.forEach(
        (it) => (it.level = Math.max(it.level + token.level - 3, 0))
      );
      const html = md.renderer.render(componentTokens, {}, {});
      return html.replace(/}}/g, "} }"); // 为了解决vue-loader误把 }} 当做模版字符解析
    },
  },
} as MarkdownImportOptions["importers"];
