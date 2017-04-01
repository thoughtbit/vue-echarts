<template>
  <div :class="className" :style="style"></div>
</template>

<style>
.echarts {
  width: 600px;
  height: 400px;
}
</style>

<script>
  import echarts from 'echarts/lib/echarts';
  import debounce from 'lodash.debounce';
  import resize from 'element-resize-detector';
  import { warn } from '../util';

  // enumerating ECharts events for now
  const ACTION_EVENTS = [
    'legendselectchanged',
    'legendselected',
    'legendunselected',
    'datazoom',
    'datarangeselected',
    'timelinechanged',
    'timelineplaychanged',
    'restore',
    'dataviewchanged',
    'magictypechanged',
    'geoselectchanged',
    'geoselected',
    'geounselected',
    'pieselectchanged',
    'pieselected',
    'pieunselected',
    'mapselectchanged',
    'mapselected',
    'mapunselected',
    'axisareaselected',
    'brush',
    'brushselected',
  ];

  const MOUSE_EVENTS = [
    'click',
    'dblclick',
    'mouseover',
    'mouseout',
    'mousedown',
    'mouseup',
    'globalout',
  ];

  /* eslint-disable */
  export default {
    name: 'echarts',
    props: {
      className: {
        type: String,
        required: false,
        default: 'echarts',
      },
      style: {
        type: Object,
        required: false,
      },
      theme: {
        type: String,
        required: false,
      },
      group: {
        type: String,
        required: false,
      },
      options: {
        type: Object,
        required: true,
      },
      initOptions: {
        type: Object,
        required: false,
      },
      notMerge: {
        type: Boolean,
        required: false,
        default: false,
      },
      lazyUpdate: {
        type: Boolean,
        required: false,
        default: false,
      },
      loading: {
        type: Boolean,
        required: false,
        default: false,
      },
      loadingOptions: {
        type: Object,
        required: false,
        default: () => ({
          text: 'Loading',
          color: '#fff',
          textColor: '#fff',
          maskColor: 'rgba(0, 0, 0, 0.2)',
        }),
      },
      resizable: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    data() {
      return {
        fnResize: null,
        insResize: null,
        chart: null,
      };
    },
    computed: {
      // Only recalculated when accessed from JavaScript.
      // Won't update DOM on value change because getters
      // don't depend on reactive values
      width: {
        cache: false,
        get() {
          return this.chart.getWidth();
        },
      },
      height: {
        cache: false,
        get() {
          return this.chart.getHeight();
        },
      },
      isDisposed: {
        cache: false,
        get() {
          return this.chart.isDisposed();
        },
      },
    },
    watch: {
      // use assign statements to tigger "options"、"group" and "loading" setters
      loading: {
        handler(loading) {
          this.isLoading(loading);
        },
        deep: false,
      },
      options: {
        handler(options) {
          if (!this.chart && options) {
            this._init();
          } else {
            this.chart.setOption(this.options, this.notMerge, this.lazyUpdate);
          }
        },
        deep: true,
      },
      group: {
        handler(group) {
          this.chart.group = group;
        },
        deep: false,
      },
    },
    methods: {
      // provide a explicit merge option method
      mergeOptions(options) {
        this._delegateMethod('setOption', options, false, this.lazyUpdate);
        this.resize();
      },
      resize(options) {
        this._delegateMethod('resize', options);
      },
      dispatchAction(payload) {
        this._delegateMethod('dispatchAction', payload);
      },
      convertToPixel(finder, value) {
        return this._delegateMethod('convertToPixel', finder, value);
      },
      convertFromPixel(finder, value) {
        return this._delegateMethod('convertFromPixel', finder, value);
      },
      containPixel(finder, value) {
        return this._delegateMethod('containPixel', finder, value);
      },
      showLoading(type, options) {
        this._delegateMethod('showLoading', type, options);
      },
      hideLoading() {
        this._delegateMethod('hideLoading');
      },
      getDataURL(options) {
        return this._delegateMethod('getDataURL', options);
      },
      getConnectedDataURL(options) {
        return this._delegateMethod('getConnectedDataURL', options);
      },
      clear() {
        this._delegateMethod('clear');
      },
      dispose() {
        this._delegateMethod('dispose');
      },
      _connect(group) {
        if (typeof group !== 'string') {
          group = group.map(chart => chart.chart);
        }
        echarts.connect(group);
      },
      _disconnect(group) {
        echarts.disConnect(group);
      },
      _getchartByDom(target) {
        echarts.getchartByDom(target);
      },
      _getMap(mapName) {
        echarts.getMap(mapName);
      },
      _registerMap(...args) {
        echarts.registerMap(...args);
      },
      _registerTheme(...args) {
        echarts.registerTheme(...args);
      },
      _delegateMethod(name, ...args) {
        if (!this.chart) {
          warn(`Cannot call [${name}] before the chart is initialized. Set prop [options] first.`, this);
          return;
        }
        return this.chart[name](...args);
      },
      _isLoading(loading) {
        if (loading) {
          this.showLoading('default', this.loadingOptions);
        } else {
          this.hideLoading();
        }
      },
      _initResize(dom) {
        const that = this;
        if (that.resizable && typeof resize === 'function') {
          that.insResize = that.insResize || resize({
            strategy: 'scroll', // <- For ultra performance.
          });
          that.fnResize = that.fnResize || debounce(that.resize, 250, {
            'leading': true,
            'trailing': true,
          });
          that.insResize.listenTo(dom, function (element) {
            that.fnResize();
          });
        }
      },
      _uninitResize() {
        if (this.insResize && this.insResize.uninstall) {
          this.insResize.uninstall(this.$el);
          this.insResize = null;
        }
        if (this.fnResize && this.fnResize.cancel) {
          this.fnResize.cancel();
          this.fnResize = null;
        }
      },
      _bind() {
        ACTION_EVENTS.forEach((event) => {
          this.chart.on(event, (params) => {
            this.$emit(event, params);
          });
        });
        MOUSE_EVENTS.forEach((event) => {
          this.chart.on(event, (params) => {
            this.$emit(event, params);
          });
        });
      },
      _unbind() {
        ACTION_EVENTS.forEach((event) => {
          this.chart.off(event);
        });
        MOUSE_EVENTS.forEach((event) => {
          this.chart.off(event);
        });
      },
      _uninit() {
        if (!this.chart) {
          return;
        }

        this._unbind();
        this._uninitResize();
        this.dispose();
        this.chart = null;
      },
      _init() {
        if (this.chart) {
          return;
        }

        const dom = this.$el;
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) {
          chart = echarts.init(dom, this.theme, this.initOptions);
        }

        if (this.group) {
          chart.group = this.group;
        }

        chart.setOption(this.options, this.notMerge, this.lazyUpdate);

        this.$emit('ready', chart, echarts);
        this.$nextTick(function() {
          this._isLoading(this.loading);
          this._bind();
          this._initResize(dom);
        });

        this.chart = chart;
      },
    },
    mounted() {
      // auto init if `options` is already provided
      if (this.options) {
        this._init();
      }
    },
    beforeDestroy() {
      this._uninit();
    },
    connect(group) {
      if (typeof group !== 'string') {
        group = group.map(chart => chart.chart);
      }
      echarts.connect(group);
    },
    disconnect(group) {
      echarts.disConnect(group);
    },
    dispose(target) {
      echarts.dispose(target);
    },
    getchartByDom(target) {
      echarts.getchartByDom(target);
    },
    getMap(mapName) {
      echarts.getMap(mapName);
    },
    registerMap(...args) {
      echarts.registerMap(...args);
    },
    registerTheme(...args) {
      echarts.registerTheme(...args);
    },
  };
</script>
