import Vue from 'vue'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import './plugins/element.js'

import ECharts from 'vue-echarts'
import resize from 'vue-element-resize-detector'

Vue.config.productionTip = false

Vue.component('v-chart', ECharts)
Vue.use(resize)

new Vue({
  render: h => h(App),
}).$mount('#app')
