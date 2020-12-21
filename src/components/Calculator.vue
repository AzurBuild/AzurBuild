<template>
  <el-container
    class="calculator-container"
    :style="{
      '--chart-container-width': `${containerWidth}px`,
    }"
  >
    <el-aside id="calculator-config-container" width="570px">
      <el-main id="calculator-config" width="570px">
        <build-info-form @add-data="addLine" />
        <el-table
          :data="showList"
          empty-text="请添加图线"
          style="width: 100%"
          :default-sort="{ prop: 'date', order: 'descending' }"
          @cell-mouse-enter="cellMouseEnter"
          @cell-mouse-leave="cellMouseLeave"
        >
          <el-table-column prop="desc" label="描述" width="150" align="center">
            <template slot-scope="scope">
              <el-popover placement="right" trigger="hover">
                <el-table stripe border :data="scope.row.buildList">
                  <el-table-column
                    property="percent"
                    label="概率"
                    sortable
                    :formatter="percentFormatter"
                    :sort-method="percentComparator"
                  ></el-table-column>
                  <el-table-column
                    property="count"
                    label="个数"
                    sortable
                  ></el-table-column>
                  <el-table-column
                    property="guarantee"
                    label="保底"
                    sortable
                    :formatter="guaranteeFormatter"
                  ></el-table-column>
                </el-table>
                <div class="build-description" slot="reference" align="left">
                  <span
                    class="line-marker"
                    :style="{
                      'background-color': getColor(scope.row.index),
                    }"
                  ></span>
                  {{ scope.row.desc }}
                </div>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column label="欧非线" align="center">
            <template slot-scope="scope">
              {{
                scope.row.chartData.markLine.data
                  .map(data => data[0].coord[0])
                  .join('/')
              }}
            </template>
          </el-table-column>
          <el-table-column
            prop="mean"
            label="期望抽数"
            align="center"
            sortable
          ></el-table-column>
          <el-table-column
            prop="date"
            label="添加时间"
            align="center"
            :formatter="timeFormatter"
            sortable
          >
          </el-table-column>
          <el-table-column align="center">
            <template slot="header">
              <el-popconfirm
                title="确定清空全部内容吗？该操作不可恢复"
                @onConfirm="deleteAll()"
              >
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  slot="reference"
                  >清空</el-button
                >
              </el-popconfirm>
            </template>
            <template slot-scope="scope">
              <el-tooltip
                class="item"
                effect="dark"
                :content="scope.row.show ? '点击隐藏' : '点击显示'"
              >
                <el-button
                  size="mini"
                  circle
                  :icon="
                    `el-icon-view${scope.row.show ? '' : ' icon-view-disabled'}`
                  "
                  @click="toggleShown(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" content="删除该图线">
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                  @click="deleteLine(scope.row)"
                ></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-aside>
    <el-main id="chart-container" v-resize @resize="onChartContainerResize">
      <v-chart
        id="chart"
        :options="orgOptions"
        :autoresize="true"
        ref="buildChart"
        theme="macarons"
      ></v-chart>
    </el-main>
  </el-container>
</template>

<script>
import 'echarts/lib/chart/line'
import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/legend'
import 'echarts/theme/macarons'
import Build from '../tools/Build.js'
import { buildData } from '../data/buildData.js'
import BuildInfoForm from './BuildInfoForm'
import {
  percentFormatter,
  guaranteeFormatter,
  percentComparator,
  timeFormatter,
} from '../tools/formatters.js'
import { generateBuildList } from '../tools/generateBuildList.js'
export default {
  components: {
    BuildInfoForm,
  },
  name: 'Calculator',
  data() {
    const initialBuildNum = 400
    return {
      colors: ['#000000'],
      containerWidth: 0,
      buildNum: initialBuildNum,
      showList: [],
      visibleCount: 0,
      onlyVisibleNode: null,
      fortunePercent: 10,
      highlighting: null,
      orgOptions: {
        tooltip: {
          backgroundColor: 'rgba(50,50,50,0.8)',
          trigger: 'axis',
          formatter: data => {
            return `${data[0].axisValue} 抽内毕业概率：<table>${data
              .filter(({ seriesIndex }) => this.showList[seriesIndex].show)
              .map(
                item =>
                  `<tr>
                    <td>${item.marker}</td>
                    <td align="left">${item.seriesName}</td>
                    <td align="right">${item.value.toFixed(2)}%</td>
                  </tr>`,
              )
              .join('')}</table>`
          },
          confine: true,
          axisPointer: {
            type: 'cross',
            lineStyle: {
              color: '#000000',
            },
            crossStyle: {
              color: '#000000',
            },
          },
        },
        xAxis: {
          name: '建造次数',
          nameLocation: 'center',
          nameGap: 35,
          type: 'category',
          data: Array(initialBuildNum + 1)
            .fill(0)
            .map((x, i) => i),
          axisLine: {
            lineStyle: {
              color: '#000000',
            },
          },
        },
        yAxis: {
          name: '毕业率',
          nameLocation: 'center',
          nameGap: 40,
          min: 0,
          max: 100,
          type: 'value',
          axisLabel: {
            formatter: '{value}%',
          },
          axisLine: {
            lineStyle: {
              color: '#000000',
            },
          },
        },
        series: [],
      },
    }
  },
  mounted() {
    this.colors = this.$refs.buildChart.computedOptions.color
    let logs = []
    const stored = localStorage.getItem('log')
    if (stored) {
      try {
        logs = JSON.parse(stored)
      } catch (e) {
        // do nothing
      }
    }
    if (logs.length === 0) {
      logs = buildData.map(data => ({
        ...data,
        buildList: Array.isArray(data.buildList)
          ? data.buildList
          : generateBuildList(data.buildList).buildList,
      }))
    }
    for (const log of logs) {
      this.drawLine(log)
    }
  },
  methods: {
    percentFormatter,
    guaranteeFormatter,
    percentComparator,
    timeFormatter,
    getColor(index) {
      return this.colors[index % this.colors.length]
    },
    drawLine({ desc, buildList, date, show }) {
      const builder = new Build(buildList)
      const that = this
      const style = {
        opacity: show ? 1 : 0,
        get shadowColor() {
          return that.getColor(node.index)
        },
        shadowBlur: 0,
      }
      const data = builder.getProbability(this.buildNum)
      const chartData = {
        name: desc,
        data,
        type: 'line',
        itemStyle: style,
        lineStyle: style,
        markLine: {
          symbol: 'none',
          symbolSize: 10,
          label: {
            get show() {
              return that.onlyVisibleNode === node
            },
            position: 'start',
            distance: 20,
            formatter(data) {
              const {
                coord: [x, y],
              } = data.data
              return `${data.name}: ${x === 0 ? y + '%' : x}`
            },
          },
          lineStyle: style,
          data: this.calcFortuneLines(data),
        },
      }
      const node = {
        desc,
        mean: Number(builder.mean.toFixed(2)),
        date,
        buildList,
        builder,
        chartData,
        index: this.showList.length,
        get show() {
          return style.opacity === 1
        },
        set show(show) {
          if (this.show === show) return
          style.opacity = show ? 1 : 0
          if (show) that.visibleCount++
          else that.visibleCount--
        },
        get highlight() {
          return style.shadowBlur === 3
        },
        set highlight(highlight) {
          style.shadowBlur = highlight ? 3 : 0
        },
      }
      this.showList.push(node)
      this.orgOptions.series.push(chartData)
      if (show) this.visibleCount++
    },
    addLine({ desc, buildList, show = true }) {
      this.drawLine({
        desc,
        buildList,
        date: Date.now(),
        show,
      })
      this.updateLocalStorage()
    },
    deleteAll() {
      this.showList = []
      this.orgOptions.series = []
      this.orgOptions = { ...this.orgOptions }
      this.visibleCount = 0
      this.updateLocalStorage()
    },
    toggleShown(row) {
      row.show = !row.show
      this.updateLocalStorage()
    },
    deleteLine(row) {
      const index = row.index
      this.showList.splice(index, 1)
      for (let i = index; i < this.showList.length; i++) {
        this.showList[i].index = i
      }
      this.orgOptions.series.splice(index, 1)
      this.orgOptions = { ...this.orgOptions }
      this.visibleCount--
      this.updateLocalStorage()
    },
    updateLocalStorage() {
      localStorage.setItem(
        'log',
        JSON.stringify(
          this.showList.map(({ desc, buildList, date, show }) => ({
            desc,
            buildList,
            date,
            show,
          })),
        ),
      )
    },
    cellMouseEnter(row, column, cell, event) {
      if (this.highlighting !== row) {
        if (this.highlighting) {
          this.highlighting.highlight = false
        }
        this.highlighting = row
        row.highlight = true
      }
    },
    cellMouseLeave(row, column, cell, event) {
      row.highlight = false
      this.highlighting = null
    },
    onChartContainerResize(e) {
      this.containerWidth = e.detail.width
    },
    calcFortuneLines(data) {
      const { fortunePercent } = this
      return [
        {
          name: '欧',
          index: data.findIndex(val => val >= fortunePercent),
        },
        {
          name: '亚',
          index: data.findIndex(val => val >= 50),
        },
        {
          name: '非',
          index: data.findIndex(val => val >= 100 - fortunePercent),
        },
      ].map(({ name, index }) => [
        {
          name,
          coord: [index, 0],
        },
        {
          coord: [index, data[index]],
        },
      ])
    },
  },
  watch: {
    buildNum(buildNum, oldVal) {
      this.orgOptions.xAxis.data = Array(buildNum + 1)
        .fill(0)
        .map((x, i) => i)
      for (const [i, line] of this.orgOptions.series) {
        line.data = this.showList[i].builder.getProbability(buildNum)
        line.markLine.data = this.calcFortuneLines(line.data)
      }
    },
    visibleCount(visibleCount, oldVal) {
      this.onlyVisibleNode =
        visibleCount === 1 ? this.showList.find(node => node.show) : null
    },
    fortunePercent(fortunePercent, oldVal) {
      for (const line of this.orgOptions.series) {
        line.markLine.data = this.calcFortuneLines(line.data)
      }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#chart-container {
  overflow: hidden;
  padding: 0;
  min-width: 550px;
  min-height: calc(var(--chart-container-width) * 9 / 16);
}
#chart {
  width: 100%;
  height: 100%;
  max-height: var(--chart-container-width);
  min-height: calc(var(--chart-container-width) * 9 / 16);
}
.line-marker {
  display: inline-block;
  border-radius: 10px;
  width: 10px;
  height: 10px;
}
.build-description {
  cursor: pointer;
}
#calculator-config {
  padding: 0;
}
/* 瞎写的移动端适配，这玩意用移动端访问就是折磨自己…… */
@media screen and (max-width: 1099px) and (orientation: portrait) {
  .calculator-container {
    flex-wrap: wrap-reverse;
  }
  #chart {
    height: calc(var(--chart-container-width));
  }
  #chart-container {
    width: 100% !important;
    min-width: initial;
  }
  #calculator-config-container {
    width: 100% !important;
    max-height: calc(100vh - var(--chart-container-width));
  }
  #calculator-config {
    width: auto !important;
    min-width: max(570px, 100%);
  }
}
</style>

<style>
.icon-view-disabled {
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 1280 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath transform='translate(0 -64)' d='M1273.987 970.6L46 3.61c-6.8-5.6-17-4.6-22.4 2.4l-20 25c-5.6 7-4.4 17 2.4 22.4l1227.987 966.99c7 5.6 17 4.4 22.4-2.4l20-25c5.6-7 4.6-17-2.4-22.4z'/%3E%3C/svg%3E")
    center no-repeat;
}
</style>
