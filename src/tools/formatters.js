export function timeFormatter(row, column, cellValue, index) {
  return new Date(cellValue).toISOString().split('T')[0]
}

export function percentFormatter(row, column, cellValue, index) {
  return cellValue + '%'
}

export function percentComparator(a, b) {
  return Number(a) - Number(b)
}

export function guaranteeFormatter(row, column, cellValue, index) {
  return cellValue || '无'
}
