/*
 * heatmap.js v2.0.0 | JavaScript Heatmap Library
 *
 * Copyright 2008-2014 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2014-08-09 03:12
 */
;
(function (global) {
    // Heatmap Config stores default values and will be merged with instance config
    var HeatmapConfig = {
        defaultRadius: 50,
        defaultRenderer: 'canvas2d',
        defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)" },
        defaultMaxOpacity: 1,
        defaultMinOpacity: 0,
        defaultBlur: 1,
        defaultXField: 'x',
        defaultYField: 'y',
        defaultValueField: 'value',
        plugins: {}
    };
    var Store = (function StoreClosure() {

        var Store = function Store(config) {
            this._coordinator = {};
            this._data = [];
            this._radi = [];
            this._min = 0;
            this._max = 1;
            this._xField = config['xField'] || config.defaultXField; //x坐标属性名称，默认为'x'
            this._yField = config['yField'] || config.defaultYField; //y坐标属性名称，默认为'y'
            this._valueField = config['valueField'] || config.defaultValueField; //渲染属性名称，默认为'value',若渲染属性不存在，则一个点value为1

            if (config["radius"]) {
                this._cfgRadius = config["radius"];
            }
        };

        var defaultRadius = HeatmapConfig.defaultRadius;

        Store.prototype = {
            // when forceRender = false -> called from setData, omits renderall event
            _organiseData: function (dataPoint, forceRender) {
                var x = dataPoint[this._xField];
                var y = dataPoint[this._yField];
                var radi = this._radi;
                var store = this._data;
                var max = this._max;
                var min = this._min;
                var value = dataPoint[this._valueField] || 1;
                var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

                if (!store[x]) { //如果不存在store[x] 则把store[x],radi[x]置为空数组
                    store[x] = [];
                    radi[x] = [];
                }

                if (!store[x][y]) {//如果不存在store[x][y] 则把value赋值给store[x][y] 半径赋值给radi[x][y]  x,y 为坐标
                    store[x][y] = value;
                    radi[x][y] = radius;
                } else {
                    store[x][y] += value;
                }

                if (store[x][y] > max) { //如果大于max 最大权重值 max默认为1
                    if (!forceRender) {
                        this._max = store[x][y]; //重新赋值this._max
                    } else {
                        this.setDataMax(store[x][y]);
                    }
                    return false;
                } else {
                    return {
                        x: x,
                        y: y,
                        value: value,
                        radius: radius,
                        min: min,
                        max: max
                    };
                }
            },
            _unOrganizeData: function () {
                var unorganizedData = [];
                var data = this._data;
                var radi = this._radi;

                for (var x in data) {
                    for (var y in data[x]) {

                        unorganizedData.push({
                            x: x,
                            y: y,
                            radius: radi[x][y],
                            value: data[x][y]
                        });

                    }
                }
                return {
                    min: this._min,
                    max: this._max,
                    data: unorganizedData
                };
            },
            _onExtremaChange: function () {
                this._coordinator.emit('extremachange', {
                    min: this._min,
                    max: this._max
                });
            },
            addData: function () {
                if (arguments[0].length > 0) {
                    var dataArr = arguments[0];
                    var dataLen = dataArr.length;
                    while (dataLen--) {
                        this.addData.call(this, dataArr[dataLen]);
                    }
                } else {
                    // add to store  
                    var organisedEntry = this._organiseData(arguments[0], true);
                    if (organisedEntry) {
                        this._coordinator.emit('renderpartial', {
                            min: this._min,
                            max: this._max,
                            data: [organisedEntry]
                        });
                    }
                }
                return this;
            },
            setData: function (data) {
                var dataPoints = data.data; //热力图点
                var pointsLen = dataPoints.length;


                // reset data arrays
                this._data = [];
                this._radi = [];

                for (var i = 0; i < pointsLen; i++) {
                    this._organiseData(dataPoints[i], false); //组织数据
                }
                this._max = data.max; //热力图点最大值
                this._min = data.min || 0; //热力图点最小值

                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            removeData: function () {
                // TODO: implement
            },
            setDataMax: function (max) {
                this._max = max;
                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            setDataMin: function (min) {
                this._min = min;
                this._onExtremaChange();
                this._coordinator.emit('renderall', this._getInternalData());
                return this;
            },
            setCoordinator: function (coordinator) {
                this._coordinator = coordinator;
            },
            _getInternalData: function () {
                return {
                    max: this._max,
                    min: this._min,
                    data: this._data,
                    radi: this._radi
                };
            },
            getData: function () {
                return this._unOrganizeData();
            }
            /*,

                  TODO: rethink.

                getValueAt: function(point) {
                  var value;
                  var radius = 100;
                  var x = point.x;
                  var y = point.y;
                  var data = this._data;

                  if (data[x] && data[x][y]) {
                    return data[x][y];
                  } else {
                    var values = [];
                    // radial search for datapoints based on default radius
                    for(var distance = 1; distance < radius; distance++) {
                      var neighbors = distance * 2 +1;
                      var startX = x - distance;
                      var startY = y - distance;

                      for(var i = 0; i < neighbors; i++) {
                        for (var o = 0; o < neighbors; o++) {
                          if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                            if (data[startY+i] && data[startY+i][startX+o]) {
                              values.push(data[startY+i][startX+o]);
                            }
                          } else {
                            continue;
                          } 
                        }
                      }
                    }
                    if (values.length > 0) {
                      return Math.max.apply(Math, values);
                    }
                  }
                  return false;
                }*/
        };


        return Store;
    })();

    var Canvas2dRenderer = (function Canvas2dRendererClosure() {

        var _getColorPalette = function (config) {
            var gradientConfig = config.gradient || config.defaultGradient; //获取自定义颜色梯度 还是 默认颜色梯度
            var paletteCanvas = document.createElement('canvas'); //创建调色板Canvas
            var paletteCtx = paletteCanvas.getContext('2d');

            paletteCanvas.width = 256; //设置宽度为256px
            paletteCanvas.height = 1; //高度为1px

            var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1); //创建线性渐变色 渐变结束坐标为(256,1)
            for (var key in gradientConfig) {
                gradient.addColorStop(key, gradientConfig[key]); //设置gradient对象中的位置和颜色
            }

            paletteCtx.fillStyle = gradient;
            paletteCtx.fillRect(0, 0, 256, 1); //绘制出一个调色板

            return paletteCtx.getImageData(0, 0, 256, 1).data; //获取这个调色板中每一个像素数据(R:红 G:绿 B:蓝 A:alpha(0-255 0代表透明，255代表完全可见))
        };

        var _getPointTemplate = function (radius, blurFactor) { //根据圆半径和渐变因子确定一个点渲染的模板
            var tplCanvas = document.createElement('canvas');
            var tplCtx = tplCanvas.getContext('2d');
            var x = radius;
            var y = radius;
            tplCanvas.width = tplCanvas.height = radius * 2;

            if (blurFactor == 1) {
                tplCtx.beginPath();
                tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
                tplCtx.fillStyle = 'rgba(0,0,0,1)';
                tplCtx.fill();
            } else {
                var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);
                gradient.addColorStop(0, 'rgba(0,0,0,1)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                tplCtx.fillStyle = gradient;
                tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
            }



            return tplCanvas;
        };

        var _prepareData = function (data) {
            var renderData = [];
            var min = data.min;
            var max = data.max;
            var radi = data.radi;
            var data = data.data;

            var xValues = Object.keys(data); //找到所有的x坐标
            var xValuesLen = xValues.length;

            while (xValuesLen--) {
                var xValue = xValues[xValuesLen];
                var yValues = Object.keys(data[xValue]);
                var yValuesLen = yValues.length;
                while (yValuesLen--) {
                    var yValue = yValues[yValuesLen]; //找到对应的y坐标
                    var value = data[xValue][yValue];
                    var radius = radi[xValue][yValue];//找到对应的半径
                    renderData.push({
                        x: xValue,
                        y: yValue,
                        value: value,
                        radius: radius
                    });
                }
            }

            return {
                min: min,
                max: max,
                data: renderData
            };
        };


        function Canvas2dRenderer(config) {
            var container = config.container;// heatmap 载体 div
            var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
            var canvas = this.canvas = config.canvas || document.createElement('canvas');
            var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0]; //边界

            var computed = getComputedStyle(config.container) || {};

            canvas.className = 'heatmap-canvas';

            this._width = canvas.width = shadowCanvas.width = +(computed.width.replace(/px/, ''));
            this._height = canvas.height = shadowCanvas.height = +(computed.height.replace(/px/, ''));

          

            this.shadowCtx = shadowCanvas.getContext('2d');
            this.ctx = canvas.getContext('2d');

            // @TODO:
            // conditional wrapper

            canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

            container.style.position = 'relative';
            container.appendChild(canvas); //添加Canvas          

            this._palette = _getColorPalette(config); //获取调色板
            this._templates = {};

            this._setStyles(config);
        };

        Canvas2dRenderer.prototype = {
            renderPartial: function (data) {
                this._drawAlpha(data);
                this._colorize();
            },
            renderAll: function (data) {
                // reset render boundaries
                this._clear();
                this._drawAlpha(_prepareData(data));
                this._colorize();
            },
            _updateGradient: function (config) {
                this._palette = _getColorPalette(config);
            },
            updateConfig: function (config) {
                if (config['gradient']) {
                    this._updateGradient(config);
                }
                this._setStyles(config);
            },
            setDimensions: function (width, height) {
                this._width = width;
                this._height = height;
                this.canvas.width = this.shadowCanvas.width = width;
                this.canvas.height = this.shadowCanvas.height = height;
            },
            _clear: function () {
                this.shadowCtx.clearRect(0, 0, this._width, this._height);
                this.ctx.clearRect(0, 0, this._width, this._height);
            },
            _setStyles: function (config) {
                this._blur = (config.blur == 0) ? 0 : (config.blur || config.defaultBlur); //获取模糊因子，数值越高梯度越平滑，颜色渐变时的内圆半径越小

                if (config.backgroundColor) {
                    this.canvas.style.backgroundColor = config.backgroundColor;
                }

                this._opacity = (config.opacity || 0) * 255; //热力图透明度
                this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255; //最大透明度 defaultMaxOpacity默认为1
                this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;//最小透明度 defaultMinOpacity默认为0
                this._useGradientOpacity = !!config.useGradientOpacity; // 热力图渲染是否使用gradient渐变色的透明度
            },
            _drawAlpha: function (data) {
                var min = this._min = data.min;
                var max = this._max = data.max;
                var data = data.data || [];
                var dataLen = data.length;
                // on a point basis?
                var blur = 1 - this._blur;

                while (dataLen--) {

                    var point = data[dataLen];

                    var x = point.x;
                    var y = point.y;
                    var radius = point.radius;
                    // if value is bigger than max
                    // use max as value
                    var value = Math.min(point.value, max);
                    var rectX = x - radius;
                    var rectY = y - radius;
                    var shadowCtx = this.shadowCtx;

                    var tpl;
                    if (!this._templates[radius]) {
                        this._templates[radius] = tpl = _getPointTemplate(radius, blur);
                    } else {
                        tpl = this._templates[radius];
                    }

                    shadowCtx.globalAlpha = value / (Math.abs(max - min));

                    shadowCtx.drawImage(tpl, rectX, rectY); //在热力图测点半径周围绘制阴影(黑到白的放射性渐变)

                    // update renderBoundaries
                    if (rectX < this._renderBoundaries[0]) {
                        this._renderBoundaries[0] = rectX;
                    }
                    if (rectY < this._renderBoundaries[1]) {
                        this._renderBoundaries[1] = rectY;
                    }
                    if (rectX + 2 * radius > this._renderBoundaries[2]) {
                        this._renderBoundaries[2] = rectX + 2 * radius;
                    }
                    if (rectY + 2 * radius > this._renderBoundaries[3]) {
                        this._renderBoundaries[3] = rectY + 2 * radius;
                    }

                }
            },
            _colorize: function () {
                var x = this._renderBoundaries[0];
                var y = this._renderBoundaries[1];
                var width = this._renderBoundaries[2] - x;
                var height = this._renderBoundaries[3] - y;
                var maxWidth = this._width;
                var maxHeight = this._height;
                var opacity = this._opacity;
                var maxOpacity = this._maxOpacity;
                var minOpacity = this._minOpacity;
                var useGradientOpacity = this._useGradientOpacity;

                if (x < 0) {
                    x = 0;
                }
                if (y < 0) {
                    y = 0;
                }
                if (x + width > maxWidth) {
                    width = maxWidth - x;
                }
                if (y + height > maxHeight) {
                    height = maxHeight - y;
                }

                var img = this.shadowCtx.getImageData(x, y, width, height);
                var imgData = img.data;
                var len = imgData.length;
                var palette = this._palette;


                for (var i = 3; i < len; i += 4) {
                    var alpha = imgData[i];
                    var offset = alpha * 4;


                    if (!offset) {
                        continue;
                    }

                    var finalAlpha;
                    if (opacity > 0) {
                        finalAlpha = opacity;
                    } else {
                        if (alpha < maxOpacity) {
                            if (alpha < minOpacity) {
                                finalAlpha = minOpacity;
                            } else {
                                finalAlpha = alpha;
                            }
                        } else {
                            finalAlpha = maxOpacity;
                        }
                    }

                    imgData[i - 3] = palette[offset];
                    imgData[i - 2] = palette[offset + 1];
                    imgData[i - 1] = palette[offset + 2];
                    imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;
                }

                img.data = imgData;
                this.ctx.putImageData(img, x, y);

                this._renderBoundaries = [1000, 1000, 0, 0];

            },
            getValueAt: function (point) {
                var value;
                var shadowCtx = this.shadowCtx;
                var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
                var data = img.data[3];
                var max = this._max;
                var min = this._min;

                value = (Math.abs(max - min) * (data / 255)) >> 0;

                return value;
            },
            getDataURL: function () {
                return this.canvas.toDataURL();
            }
        };


        return Canvas2dRenderer;
    })();

    var Renderer = (function RendererClosure() {

        var rendererFn = false;

        if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
            rendererFn = Canvas2dRenderer;
        }

        return rendererFn;
    })();


    var Util = {
        merge: function () {
            var merged = {};
            var argsLen = arguments.length;
            for (var i = 0; i < argsLen; i++) {
                var obj = arguments[i]
                for (var key in obj) {
                    merged[key] = obj[key];
                }
            }
            return merged;
        }
    };
    // Heatmap Constructor
    var Heatmap = (function HeatmapClosure() {

        var Coordinator = (function CoordinatorClosure() {

            function Coordinator() {
                this.cStore = {};
            };

            Coordinator.prototype = {
                on: function (evtName, callback, scope) {
                    var cStore = this.cStore;

                    if (!cStore[evtName]) {
                        cStore[evtName] = [];
                    }
                    cStore[evtName].push((function (data) {
                        return callback.call(scope, data);
                    }));
                },
                emit: function (evtName, data) {
                    var cStore = this.cStore;
                    if (cStore[evtName]) {
                        var len = cStore[evtName].length;
                        for (var i = 0; i < len; i++) {
                            var callback = cStore[evtName][i];
                            callback(data);
                        }
                    }
                }
            };

            return Coordinator;
        })();


        var _connect = function (scope) {
            var renderer = scope._renderer;
            var coordinator = scope._coordinator;
            var store = scope._store;

            coordinator.on('renderpartial', renderer.renderPartial, renderer);
            coordinator.on('renderall', renderer.renderAll, renderer);
            coordinator.on('extremachange', function (data) {
                scope._config.onExtremaChange &&
                    scope._config.onExtremaChange({
                        min: data.min,
                        max: data.max,
                        gradient: scope._config['gradient'] || scope._config['defaultGradient']
                    });
            });
            store.setCoordinator(coordinator);
        };


        function Heatmap() {
            var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
            this._coordinator = new Coordinator();
            if (config['plugin']) {
                var pluginToLoad = config['plugin'];
                if (!HeatmapConfig.plugins[pluginToLoad]) {
                    throw new Error('Plugin \'' + pluginToLoad + '\' not found. Maybe it was not registered.');
                } else {
                    var plugin = HeatmapConfig.plugins[pluginToLoad];
                    // set plugin renderer and store
                    this._renderer = new plugin.renderer(config);
                    this._store = new plugin.store(config);
                }
            } else {
                this._renderer = new Renderer(config);
                this._store = new Store(config);
            }
            _connect(this);
        };

        // @TODO:
        // add API documentation
        Heatmap.prototype = {
            addData: function () {
                this._store.addData.apply(this._store, arguments);
                return this;
            },
            removeData: function () {
                this._store.removeData && this._store.removeData.apply(this._store, arguments);
                return this;
            },
            setData: function () {
                this._store.setData.apply(this._store, arguments);
                return this;
            },
            setDataMax: function () {
                this._store.setDataMax.apply(this._store, arguments);
                return this;
            },
            setDataMin: function () {
                this._store.setDataMin.apply(this._store, arguments);
                return this;
            },
            configure: function (config) {
                this._config = Util.merge(this._config, config);
                this._renderer.updateConfig(this._config);
                this._coordinator.emit('renderall', this._store._getInternalData());
                return this;
            },
            repaint: function () {
                this._coordinator.emit('renderall', this._store._getInternalData());
                return this;
            },
            getData: function () {
                return this._store.getData();
            },
            getDataURL: function () {
                return this._renderer.getDataURL();
            },
            getValueAt: function (point) {

                if (this._store.getValueAt) {
                    return this._store.getValueAt(point);
                } else if (this._renderer.getValueAt) {
                    return this._renderer.getValueAt(point);
                } else {
                    return null;
                }
            }
        };

        return Heatmap;

    })();

    // core
    var heatmapFactory = {
        create: function (config) {
            return new Heatmap(config);
        },
        register: function (pluginKey, plugin) {
            HeatmapConfig.plugins[pluginKey] = plugin;
        }
    };

    global['h337'] = heatmapFactory;

})(this || window);
