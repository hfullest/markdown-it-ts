import { ExtendMarkdown, PluginEntry } from "vuepress/config";

type MarkdownIt = Parameters<ExtendMarkdown>[0];

type RenderRule = NonNullable<MarkdownIt["renderer"]["rules"][string]>;

export interface ImportConfig {
  alias?: Record<string, string>;
  /** 处理函数 */
  handler?: (
    md: MarkdownIt,
    ...params: Parameters<RenderRule>
  ) => ReturnType<RenderRule>;
  /** 手动定义几级内容，默认根据当前上下文来确认 */
  level?: number;
}

export interface MarkdownImportOptions {
  importers?: Record<string, ImportConfig | boolean>;
}

/**
 * 支持在markdown中使用以下语法
 *
 * `@import:identifier {alias}/path/file.tsx?param1=abc`
 *
 * 在`options`可以配置参数
 *
 * @example
 *  export default {
 *      plugins:[
 *          [VuePressMarkdownImportPlugin,{
 *              importers:{
 *                  // 这里即为identifier 为 ts-gendoc 的处理配置
 *                  "ts-gendoc":{
 *                      alias:{ "@":path.resolve(process.cwd(),'src') },
 *                       handler(md,tokens,idx){
 *                           const token = tokens[idx];
 *                           const { identifier, path, params } = token.meta;
 *                           //这里对导入进行处理
 *                       }
 *                  }
 *              }
 *          }]
 *      ]
 *  }
 */
export const VuePressMarkdownImportPlugin = (
  options: MarkdownImportOptions = {}
) => {
  const { importers = {} } = options;
  return {
    name: "vuepress-plugin-markdown-import",
    extendMarkdown: (md) => {
      md.block.ruler.before(
        "paragraph",
        "@import",
        function importer(state, startLine, endLine) {
          const oldParentType = state.parentType;
          state.parentType = "paragraph";
          const nextLine = startLine + 1;
          const content = state
            .getLines(startLine, nextLine, state.blkIndent, false)
            .trim();
          state.line = nextLine;
          const targetReg =
            /@import(:(\S+))?(\s+)(([^\/\s]+)(\/[^\?\s\[\]]+)\??(.*))/;
          const match = targetReg.exec(content);
          if (!match) return false;
          const [
            ,
            ,
            identifier,
            ,
            _roughPath,
            alias,
            restPath,
            paramsStr = "",
          ] = match;
          const importConfig = importers[
            identifier ?? "default"
          ] as ImportConfig;
          if (!importConfig) return false;
          const path = `${importConfig?.alias?.[alias] ?? alias}${restPath}`;
          const paramsEntities =
            paramsStr
              .trim()
              .split("&")
              .map((it) => it.split("=")) ?? [];
          const params = Object.fromEntries(paramsEntities);
          const meta = { identifier, path, params };

          const token = state.push("@import", "import", 0);
          token.markup = "@import";
          token.map = [startLine, state.line];
          token.meta = meta;
          token.content = content;
          token.children = [];
          token.level = importConfig.level ?? state.level;
          state.parentType = oldParentType;
          return true;
        }
      );
      md.renderer.rules["@import"] = function importer(tokens, idx, ...res) {
        const token = tokens[idx];
        if (token.type !== "@import") return "";
        const { identifier } = token.meta;
        const importConfig = importers[identifier ?? "default"] as ImportConfig;
        return importConfig?.handler?.(md, tokens, idx, ...res) ?? "";
      };
    },
  } as PluginEntry;
};
