const BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
const GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

/** 检验链接，排除可能有安全风险的链接类型 */
export function validateLink(url:string) {
  const str = url.trim().toLowerCase();
  return BAD_PROTO_RE.test(str) ? (GOOD_DATA_RE.test(str) ? true : false) : true;
}