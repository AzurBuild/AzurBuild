import { Decimal } from 'decimal.js'

// 组合数
const C = (n, max = n) => {
  let last = 1
  const ans = [last]
  for (let i = 1; i <= max; i++) {
    ans.push((last *= (n + 1 - i) / i))
  }
  return ans
}
// 组合数缓存
const cMap = {}

export default class Build {
  constructor(buildList) {
    buildList = buildList.map(buildInfo => Object.assign({}, buildInfo))
    // 总共建造几艘船
    let buildCnt = 0
    for (let i = buildList.length - 1; i >= 0; i--) {
      const buildInfo = buildList[i]
      buildInfo.percent = Decimal.div(buildInfo.percent, 100)
      if (!cMap[buildInfo.count]) {
        cMap[buildInfo.count] = C(buildInfo.count)
      }
      // 该项后有几艘船可建造
      buildInfo.rest = buildCnt
      buildCnt += buildInfo.count
    }
    // 保底的抽数
    const guaranteeNums = [
      ...new Set(
        buildList
          .filter(
            buildInfo => buildInfo.guarantee && buildInfo.guarantee > buildCnt,
          )
          .map(buildInfo => buildInfo.guarantee),
      ),
    ].sort((a, b) => a - b)
    const guaranteeNumsRev = {
      Infinity: guaranteeNums.length,
    }
    for (const [i, guaranteeNum] of guaranteeNums.entries()) {
      guaranteeNumsRev[guaranteeNum] = i
    }
    const coefMap = {}
    // total 艘沉船
    for (let total = 1; total <= buildCnt; total++) {
      // eslint-disable-next-line no-extra-semi
      ;(function next(total, idx, restProb, coef, minGuarantee) {
        if (total === 0) {
          const restProbStr = restProb.toString()
          if (!coefMap[restProbStr]) {
            coefMap[restProbStr] = {
              base: restProb,
              coef: Array(guaranteeNums.length + 1).fill(0),
            }
          }
          coefMap[restProbStr].coef[guaranteeNumsRev[minGuarantee]] += coef
          return
        }
        const { percent, count, rest, guarantee } = buildList[idx]
        for (
          let i = Math.max(0, total - rest);
          i <= Math.min(total, count);
          i++
        ) {
          const newMinGuarantee =
            guarantee && i > 0
              ? Math.min(minGuarantee, guarantee)
              : minGuarantee
          next(
            total - i,
            idx + 1,
            restProb.minus(percent.times(i)),
            coef * cMap[count][i],
            newMinGuarantee,
          )
        }
      })(total, 0, new Decimal(1), total % 2 === 0 ? 1 : -1, Infinity)
    }
    const distributionFn = Array(guaranteeNums.length + 1)
      .fill()
      .map((_, i) => ({
        start: i === 0 ? buildCnt : guaranteeNums[i - 1],
        end: i === guaranteeNums.length ? Infinity : guaranteeNums[i],
        items: [],
      }))
    let mean = new Decimal(0)
    for (const item of Object.values(coefMap).sort((a, b) =>
      a.base.comparedTo(b.base),
    )) {
      const base = item.base
      // 概率函数
      // f(n) = coef*base**n
      for (let i = item.coef.length - 1, coef = 0; i >= 0; i--) {
        coef += item.coef[i]
        if (coef === 0) continue
        distributionFn[i].items.push([base, coef])
      }
      // 期望
      // E(n) = Sum[n*(f(n)-f(n-1)), (n, 1, maxN)]
      //      = coef*Sum[n*(base**n-base**(n-1)), (n, 1, maxN)]
      //      = coef*Sum[n*((base-1)*base**(n-1)), (n, 1, maxN)]
      //      = (base-1)*coef*Sum[n*(base**(n-1)), (n, 1, maxN)]
      // 采用 https://zhuanlan.zhihu.com/base/25042618
      // a = 1, b = 0
      // A = a/(base-1)=1/(base-1)
      // B = (b-A)/(base-1)=-A/(base-1)=-1/(base-1)**2

      // (base-1)
      const coBase = base.minus(1)
      // A = 1/(base-1)
      const A = Decimal.div(1, coBase)
      // B = -A/(base-1)
      const B = new Decimal(-1).dividedBy(coBase.pow(2))
      for (const [i, coef] of item.coef.entries()) {
        if (coef === 0) continue
        // (base-1)*coef
        const meanCoef = coBase.times(coef)
        let term = new Decimal(0)
        if (i !== guaranteeNums.length) {
          const n = guaranteeNums[i] - 1
          const basePowN = base.pow(n)
          mean = mean.add(
            base
              .times(item.coef[i + 1])
              .minus(coef)
              .times(basePowN)
              .times(n + 1),
          )
          term = A.times(n)
            .add(B)
            .times(basePowN)
        }
        const exp = term.minus(B).times(meanCoef)
        mean = mean.add(exp)
      }
    }

    this.distributionFn = distributionFn
    this.mean = mean
  }

  getMean() {
    return this.mean
  }

  getProbability(count) {
    const ans = Array(count + 1).fill(0)
    for (const dist of this.distributionFn) {
      if (dist.start > count) break
      const items = dist.items.map(([base, coef]) => ({
        base,
        coef: base.pow(dist.start - 1).times(coef),
      }))
      for (let i = dist.start; i < Math.min(count + 1, dist.end); i++) {
        let probability = new Decimal(1)
        for (const item of items) {
          item.coef = item.coef.times(item.base)
          probability = probability.add(item.coef)
        }
        ans[i] = Number(probability.times(100).toFixed(2))
      }
    }
    return ans
  }
}
