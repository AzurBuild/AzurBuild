import { shipTypes } from '../data/shipTypes.js'
export function generateBuildList(data) {
  const buildList = []
  let desc = ''
  for (const { name, label, percent, guarantee } of shipTypes) {
    const count = Number(data[name])
    if (!count) continue
    buildList.push({
      count,
      percent,
      guarantee,
    })
    desc += count + label
  }
  return {
    desc,
    buildList,
  }
}
