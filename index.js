// import whole ECharts package when prebuilding the bundled version
import 'echarts';

import ECharts from './components/ECharts.vue';

const VueECharts = {
  echarts: ECharts,
  install(Vue) {
    Vue.component('chart', ECharts);
  },
};

export default VueECharts;
