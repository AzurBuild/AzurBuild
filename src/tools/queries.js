const staticOptions = options => (_, cb) =>
  cb(options.map(value => ({ value })))
export const querySearchNatrual = staticOptions(['0', '1', '2', '3', '4', '5'])
export const querySearchPositive = staticOptions(['1', '2', '3', '4', '5'])
export const querySearchPercent = staticOptions(['1.2', '2', '2.5', '5', '10'])
export const querySearchGuarantee = staticOptions(['0', '200'])
