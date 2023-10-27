import { Rule } from '../interface';

export class Ruler<R extends Rule.BasicRule = Rule.RenderRule> {
  /** 添加的规则列表 */
  #rules: R[] = [];

  /**
   * Cached rule chains.
   *
   *  First level - chain name, '' for default.
   *
   *  Second level - diginal anchor for fast filtering by charcodes.
   */
  #cache: Map<string, Function[]> = new Map();

  constructor(rules?: R[]) {
    this.#rules.push(...(rules ?? []));
  }

  /** 构建规则查找缓存 */
  #compile() {
    const chains = new Set(['']);
    this.#rules.forEach((rule) => {
      if (!rule.enabled) return;
      rule.alt?.forEach((altName) => {
        if (!chains.has(altName)) chains.add(altName);
      });
    });
    this.#cache = new Map();
    chains.forEach((chain) => {
      const chainFns = this.#cache.get(chain) ?? [];
      this.#rules.forEach((rule) => {
        if (rule.enabled) return;
        if (chain && rule.alt?.indexOf(chain)! < 0) return;
        chainFns.push(rule.fn);
      });
      this.#cache.set(chain, chainFns);
    });
  }

  /**
   * 替换已存在的规则
   *
   * @example
   * ```javascript
   * const md = require('markdown-it')();
   *
   * md.core.ruler.at('replacements', function replace(state) {
   *   //...
   * });
   * ```
   */
  at(beforeName: string, fn: R['fn'], options: { alt?: R['alt'] } = {}) {
    const index = this.#rules.findIndex((rule) => rule.name === beforeName);
    if (index < 0) throw new Error('Parser rule not found: ' + beforeName);
    this.#rules[index].fn = fn;
    this.#rules[index].alt = options?.alt ?? [];
    this.#cache.clear();
  }

  /**
   * Ruler.before(beforeName, ruleName, fn [, options])
   * - beforeName (String): new rule will be added before this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain before one with given name. See also
   * [[Ruler.after]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * const md = require('markdown-it')();
   *
   * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  before(beforeName: string, ruleName: string, fn: R['fn'], options: { alt?: R['alt'] } = {}) {
    const index = this.#rules.findIndex((rule) => rule.name === beforeName);
    if (index < 0) throw new Error('Parser rule not found: ' + beforeName);
    const rule = { name: ruleName, enabled: true, fn, alt: options?.alt ?? [] };
    this.#rules.splice(index, 0, rule as R);
    this.#cache.clear();
  }

  /**
   * Ruler.after(afterName, ruleName, fn [, options])
   * - afterName (String): new rule will be added after this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain after one with given name. See also
   * [[Ruler.before]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * const md = require('markdown-it')();
   *
   * md.inline.ruler.after('text', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  after(afterName: string, ruleName: string, fn: R['fn'], options: { alt?: R['alt'] } = {}) {
    const index = this.#rules.findIndex((rule) => rule.name === afterName);
    if (index < 0) throw new Error('Parser rule not found: ' + afterName);
    const rule = { name: ruleName, enabled: true, fn, alt: options?.alt ?? [] };
    this.#rules.splice(index + 1, 0, rule as R);
    this.#cache.clear();
  }

  /**
   * Ruler.push(ruleName, fn [, options])
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Push new rule to the end of chain. See also
   * [[Ruler.before]], [[Ruler.after]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * const md = require('markdown-it')();
   *
   * md.core.ruler.push('my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  push(ruleName: string, fn: R['fn'], options: { alt?: R['alt'] } = {}) {
    this.#rules.push({ name: ruleName, enabled: true, fn, alt: options?.alt ?? [] } as R);
    this.#cache.clear();
  }

  /**
   * Ruler.enable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to enable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.disable]], [[Ruler.enableOnly]].
   **/
  enable(list: string | string[], ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) list = [list];
    const result: string[] = [];
    list.forEach((name) => {
      const index = this.#rules.findIndex((rule) => rule.name === name);
      if (index < 0) {
        if (ignoreInvalid) return;
        throw new Error('Rules manager: invalid rule name ' + name);
      }
      this.#rules[index].enabled = true;
      result.push(name);
    });
    this.#cache.clear();
    return result;
  }

  /**
   * Ruler.enableOnly(list [, ignoreInvalid])
   * - list (String|Array): list of rule names to enable (whitelist).
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names, and disable everything else. If any rule name
   * not found - throw Error. Errors can be disabled by second param.
   *
   * See also [[Ruler.disable]], [[Ruler.enable]].
   **/
  enableOnly(list: string | string[], ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) list = [list];
    this.#rules.forEach((rule) => (rule.enabled = false));
    return this.enable(list, ignoreInvalid);
  }

  /**
   * Ruler.disable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to disable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Disable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.enable]], [[Ruler.enableOnly]].
   **/
  disable(list: string | string[], ignoreInvalid: boolean = false) {
    if (!Array.isArray(list)) list = [list];
    const result: string[] = [];
    list.forEach((name) => {
      const index = this.#rules.findIndex((rule) => rule.name === name);
      if (index < 0) {
        if (ignoreInvalid) return;
        throw new Error('Rules manager: invalid rule name ' + name);
      }
      this.#rules[index].enabled = false;
      result.push(name);
    });
    this.#cache.clear();
    return result;
  }

  getRules(chainName: string) {
    if (!this.#cache.size) this.#compile();
    return this.#cache.get(chainName) ?? [];
  }
}
