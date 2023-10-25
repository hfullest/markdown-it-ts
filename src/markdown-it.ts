import { Options, PresetNameType } from "./interface";
import { ParserBlock } from "./parser/block";
import { ParserCore } from "./parser/core";
import { ParserInline } from "./parser/inline";
import { Renderer } from "./renderer";
import LinkifyIt from "linkify-it";
import { validateLink } from "./utils";

export class MarkdownIt {
  core = new ParserCore();

  block = new ParserBlock();

  inline = new ParserInline();

  renderer = new Renderer();

  /**
   *
   * [linkify-it](https://github.com/markdown-it/linkify-it) 实例.
   **/
  linkify = new LinkifyIt();

  /** 链接检验方法 */
  validateLink: (url: string) => boolean = validateLink;

  constructor(presetName: PresetNameType, options: Options) {
    if (!(this instanceof MarkdownIt))
      return new MarkdownIt(presetName, options);
    if (!options) {
      if (typeof presetName !== "string") {
        options = presetName ?? {};
        presetName = "default";
      }
    }
  }
}
