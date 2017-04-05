export function concatResults(result) {
  return [result.text].concat((result.attachments || []).map(att => att.text)).join('\n')
}
