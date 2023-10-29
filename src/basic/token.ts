import { Nesting } from '../interface';

export namespace Token {
  export interface Meta {}

  export type Attr = [string, string];

  export type TableType =
    | 'table_open'
    | 'thead_open'
    | 'tr_open'
    | 'th_open'
    | 'th_close'
    | 'tr_close'
    | 'thead_close'
    | 'tbody_open'
    | 'td_open'
    | 'td_close'
    | 'tbody_close'
    | 'table_close';

  export type ListType =
    | 'paragraph_open'
    | 'ordered_list_open'
    | 'bullet_list_open'
    | 'list_item_open'
    | 'list_item_close'
    | 'ordered_list_close'
    | 'bullet_list_close'
    | 'paragraph_close';

  export type BlockType =
    | TableType
    | ListType
    | 'code_block'
    | 'fence'
    | 'blockquote_open'
    | 'blockquote_close'
    | 'heading_open'
    | 'heading_close'
    | 'hr'
    | 'html_block';

  export type InlineType =
    | 'link_open'
    | 'link_close'
    | 'text'
    | 'code_inline'
    | 'image'
    | 'strong_open'
    | 'em_open'
    | 'strong_close'
    | 'em_close'
    | 'text_special'
    | 'html_inline'
    | 'hardbreak'
    | 'softbreak'
    | 'inline'
    | 's_open'
    | 's_close';

  export type Type<T extends string = never> = BlockType | InlineType | T;
}

export class Token<ExtendType extends string = string> {
  /** html 属性 */
  attrs: Token.Attr[] = [];

  /** 源码信息，[开始行，结束行] */
  map: [number, number] | null = null;

  /** 嵌套深度 */
  level: number = 0;

  /** 子节点 */
  children: Token<ExtendType>[] | null = null;

  /** 只有在自闭合标签的情况下，这个属性才有值 */
  content: string = '';

  /** '*' or '_' for emphasis, fence string for fence, etc. */
  markup: string = '';

  /** 额外信息
   *
   * - Info string for "fence" tokens
   * - The value "auto" for autolink "link_open" and "link_close" tokens
   * - The string value of the item marker for ordered-list "list_item_open" tokens
   */
  info: string = '';

  /** 存放插件相关数据 */
  meta: Token.Meta | null = null;

  /**
   * `true`表示是块级token；
   * `false`表示是内联级token；
   *
   * 用来在渲染阶段(renderer)判断断行
   *  */
  block: boolean = false;

  /** 是否隐藏
   *
   * 如果为`true`，则在渲染时忽略
   *
   * 用于紧凑列表以隐藏段落(paragraphs)
   */
  hidden: boolean = false;

  constructor(public type: Token.Type | ExtendType, public tag: string, public nesting: Nesting) {}

  /** 通过属性名搜索索引 */
  attrIndex(name: string): number {
    return this.attrs.findIndex(([attrName]) => attrName === name) ?? -1;
  }

  /** 将属性`[ name, value ]`添加到列表 */
  attrPush(attrData: Token.Attr) {
    this.attrs.push(attrData);
    return this;
  }

  /** 设置属性值，如果不存在则添加 */
  attrSet(name: string, value: string) {
    const idx = this.attrIndex(name);
    const attrData: Token.Attr = [name, value];
    if (idx < 0) {
      this.attrPush(attrData);
    } else {
      this.attrs[idx] = attrData;
    }
    return this;
  }

  /** 获取属性值 */
  attrGet(name: string) {
    const item = this.attrs.find(([attrName]) => attrName === name) ?? null;
    return item?.[1] ?? null;
  }

  /**
   * 如果属性已存在则使用空格添加到属性值后面，如果不存在则创建新属性
   *
   * 对于操作类名(class)非常有用
   */
  attrJoin(name: string, value: string) {
    const idx = this.attrIndex(name);
    if (idx < 0) this.attrPush([name, value]);
    else this.attrs[idx][1] += ` ${value}`;
    return this;
  }
}
