/**
 * @Name: akxy-drawcad V1.0.0  Canvas绘制CAD矿图  
 * @Author: wyd  http://www.wuyandong.me/
 * @Copyright: 2018 AKXY 
 */
; (function () {
    var _global,
        middleX,
        middleY,
        areaInfo,
        firstZoom,
        layercadInfo,
        pointSize;
    /*
     *  config 参数说明
     *    container : 传入指定div
     *    pointSize : 配置应力、微震等测点大小{stress,quake等}
     *    isTrueCoordinate : 是否为真实测点坐标（用于微震剖面功能，一个为cad矿图坐标，一个为剖面坐标），
                             传入微震信息时，cad矿图坐标用X,Y,Z表示，剖面坐标用PX,PY，PZ表示。
     *    layercadInfo : 关键信息，记录绘制矿图是所用的Layer
     */
    var akxyCad = {
        config: function (config) {
            var container = config.container;
            layercad = new AKXY.Layer(container);
            var isTrueCoordinate = true;
            if (config.isTrueCoordinate != undefined && !config.isTrueCoordinate)//是否是测点真实坐标
                isTrueCoordinate = config.isTrueCoordinate;
            layercadInfo = {
                layercad: layercad,
                bounds: layercad.bounds,
                isTrueCoordinate: isTrueCoordinate
            }
            areaInfo = config.areaInfo;
            pointSize = config.pointSize;
        },
        loadCad: function (cadInfo) {
            if (cadInfo != null) {
                var layercad = layercadInfo.layercad;
                var middlex = (cadInfo.Xmax - cadInfo.Xmin) / 2;
                var middley = (cadInfo.Ymax - cadInfo.Ymin) / 2;
                middleX = cadInfo.Xmin + middlex;
                middleY = cadInfo.Ymin + middley;
                layercad.setMiddleXY(middleX, middleY);
                var maxx = middlex, miny = -1 * middley;
                drawCad.drawArc(layercad, cadInfo)
                .drawCircles(layercad, cadInfo)
                .drawLine(layercad, cadInfo)
                .drawPolyline(layercad, cadInfo)
                .drawText(layercad, cadInfo);
                moveTo(maxx, miny, layercad);
                var movetoPoint = {
                    x: maxx,
                    y: miny
                }
                layercadInfo.movetoPoint = movetoPoint;
            }
            return this;
        },
        clearCad: function () {
            var layercad = layercadInfo.layercad;
            layercad.renderer.context.clearRect(0, 0, layercad.size.w, layercad.size.h);
            layercad.renderer.geometrys = {}; //清除geometrys
            layercad.vectors = {};//清除geometrys 方便定位准确
            layercad.vectorsCount = 0;
        },
        resize: function (width, height) {
            layercadInfo.layercad.size = new AKXY.Size(parseInt(width), parseInt(height));
            layercadInfo.layercad.renderer.setSize(layercadInfo.layercad.size);
            layercadInfo.layercad.renderer.heatmapInstance._renderer.setDimensions(layercadInfo.layercad.size.w, layercadInfo.layercad.size.h);
            layercadInfo.layercad.bounds = new AKXY.Bounds(-layercadInfo.layercad.size.w / 2, -layercadInfo.layercad.size.h / 2, layercadInfo.layercad.size.w / 2, layercadInfo.layercad.size.h / 2);
        },
        drawStress: function drawPoint(stressTable) {
            var layercad = layercadInfo.layercad;
            var circleStyle = {
                fillColor: "green",
                strokeColor: "green",
                fill: false,
                stroke: true,
                fillOpacity: 1,
                strokeOpacity: 1
            };
            objStressTable = JSON.stringify(stressTable);
            window.localStorage.setItem("StressTable", objStressTable);
            var startAngle = 0;
            var endAngle = Math.PI * 2;
            var radius = pointSize.stress;
            var circleVectors = [];
            for (var i in stressTable) {
                if (stressTable[i].LevelInfo == null)
                    continue;
                var x = stressTable[i].X;
                var y = stressTable[i].Y;
                if (stressTable[i].Is >= 0.2) {
                    var newRadius = 3 * layercadInfo.firstZoom;
                    var circle = new AKXY.Circle(x - middleX, y - middleY, newRadius, startAngle, endAngle, true, stressTable[i].Is * 100);
                    var vector = new AKXY.Vector(circle, circleStyle);
                    circleVectors.push(vector);
                }
                var levelInfo = stressTable[i].LevelInfo.split(',')[0];
                var cadStressInfo = {
                    "Type": "Stress",
                    "AcquisitionTime": stressTable[i].AcquisitionTime,
                    "MPName": stressTable[i].MPName,
                    "PValue": stressTable[i].PValue,
                    "ZFValue": stressTable[i].ZFValue,
                    "LevelInfo": levelInfo,
                    "Z": stressTable[i].Z,
                    "Is": stressTable[i].Is
                }
                if (stressTable[i].Is < 0.3) {
                    circleStyle = {
                        fillColor: "green",
                        strokeColor: "green",
                        fill: false,
                        stroke: true,
                        fillOpacity: 1,
                        strokeOpacity: 1
                    };
                }
                else if (stressTable[i].Is >= 0.3 && stressTable[i].Is < 0.5) {
                    circleStyle = {
                        fillColor: "Yellow",
                        strokeColor: "green",
                        fill: false,
                        stroke: true,
                        fillOpacity: 1,
                        strokeOpacity: 1
                    };
                }
                else if (stressTable[i].Is >= 0.5 && stressTable[i].Is < 0.8) {
                    circleStyle = {
                        fillColor: "Orange",
                        strokeColor: "green",
                        fill: false,
                        stroke: true,
                        fillOpacity: 1,
                        strokeOpacity: 1
                    };
                }
                else {
                    circleStyle = {
                        fillColor: "red",
                        strokeColor: "green",
                        fill: false,
                        stroke: true,
                        fillOpacity: 1,
                        strokeOpacity: 1
                    };
                }
                var circle = new AKXY.Circle(x - middleX, y - middleY, radius, startAngle, endAngle, false, stressTable[i].Is, cadStressInfo, true);
                var vector = new AKXY.Vector(circle, circleStyle);
                circleVectors.push(vector);
            }
            layercad.addVectors(circleVectors);
            return this;
        },
        drawQuake: function drawQuake(quakeTable) {
            var layercad = layercadInfo.layercad;
            var circleVectors = [];
            objQuakeTable = JSON.stringify(quakeTable);
            window.localStorage.setItem("QuakeTable", objQuakeTable);
            var startAngle = 0;
            var endAngle = Math.PI * 2;
            var radius = Number(pointSize.quake);
            for (var i in quakeTable) {
                var energy = quakeTable[i].Energy;
                var circleStyle = getQuakeSize(energy, radius, 0.6);
                var x, y, z;
                if (layercadInfo.isTrueCoordinate) { //真实矿图坐标
                    x = quakeTable[i].X;
                    y = quakeTable[i].Y;
                    z = quakeTable[i].Z;
                } else { //剖面坐标
                    x = quakeTable[i].PX;
                    y = quakeTable[i].PY;
                    z = quakeTable[i].PZ;
                }
                var cadQuakeInfo = {
                    "Type": "Quake",
                    "OccurrenceTime": quakeTable[i].OccurrenceTime,
                    "ShowEnergy": quakeTable[i].ShowEnergy,
                    "Z": quakeTable[i].Z,
                    "X": quakeTable[i].X,
                    "Y": quakeTable[i].Y
                }
                var circle = new AKXY.Circle(x - middleX, y - middleY, radius, startAngle, endAngle, false, energy, cadQuakeInfo);
                var vector = new AKXY.Vector(circle, circleStyle);
                circleVectors.push(vector);
            };
            layercad.addVectors(circleVectors); //画测点结束
            return this;
        },
        drawDrillBit: function drawDrillBit(drillBitTable) {
            var layercad = layercadInfo.layercad;
            drawCad.drawFillLine(layercad, drillBitTable);
            return this;
        },
        getLayer: function () {
            return layercadInfo;
        },
        setLayer: function (layerInfo) {
            layercadInfo = layerInfo;
        },
        getmiddleX: function () {
            return middleX;
        },
        getmiddleY: function () {
            return middleY;
        },
        getpointsofWarn: function () {
            return layercadInfo.layercad.renderer.pointsOfWarn;
        },
        moveTo: function (x, y) {
            moveTo(x, y, layercadInfo.layercad);
        },
        goTo: function (zoom, position, url) { //用于定位
            layercadInfo.layercad.moveTo(zoom, position);
            layercadInfo.layercad.setCircleImage(position, 2.8, url);
        }
    };

    var drawCad = {
        drawArc: function (layer, jsonData) {
            if (jsonData.arcs.length > 0) {
                var arcVectors = [];
                for (var i in jsonData.arcs) {
                    if (jsonData.arcs[i].Center != null) {
                        var r = jsonData.arcs[i].Color.R;
                        var g = jsonData.arcs[i].Color.G;
                        var b = jsonData.arcs[i].Color.B;
                        if (r == 255 && g == 255 && b == 255) {
                            r = 0;
                            g = 0;
                            b = 0;
                        }
                        var circleStyle = {
                            fillColor: "green",
                            strokeColor: "rgb(" + r + "," + g + "," + b + ")",
                            fill: false,
                            stroke: true,
                            fillOpacity: 1,
                            strokeOpacity: 1
                        };
                        var x = jsonData.arcs[i].Center.X - middleX;
                        var y = jsonData.arcs[i].Center.Y - middleY;

                        var startAngle = jsonData.arcs[i].StartAngle;
                        startAngle = startAngle * Math.PI / 180;
                        var endAngle = jsonData.arcs[i].EndAngle;
                        endAngle = endAngle * Math.PI / 180;
                        var radius = jsonData.arcs[i].Radius;

                        var circle = new AKXY.Circle(x, y, radius, startAngle, endAngle, false);
                        var vector = new AKXY.Vector(circle, circleStyle);
                        arcVectors.push(vector);
                    }
                }
                layer.addVectors(arcVectors);
            }
            return this;
        },
        drawCircles: function (layer, jsonData) {
            if (jsonData.circles.length > 0) {
                var circleVectors = [];
                for (var i in jsonData.circles) {
                    if (jsonData.circles[i].Center != null) {
                        var r = jsonData.circles[i].Color.R;
                        var g = jsonData.circles[i].Color.G;
                        var b = jsonData.circles[i].Color.B;
                        if (r == 255 && g == 255 && b == 255) {
                            r = 0;
                            g = 0;
                            b = 0;
                        }
                        var circleStyle = {
                            fillColor: "green",
                            strokeColor: "rgb(" + r + "," + g + "," + b + ")",
                            fill: false,
                            stroke: true,
                            fillOpacity: 1,
                            strokeOpacity: 1
                        };

                        var x = jsonData.circles[i].Center.X - middleX;
                        var y = jsonData.circles[i].Center.Y - middleY;

                        var startAngle = 0;
                        var endAngle = Math.PI * 2;
                        var radius = jsonData.circles[i].Radius;

                        var circle = new AKXY.Circle(x, y, radius, startAngle, endAngle, false);
                        var vector = new AKXY.Vector(circle, circleStyle);
                        circleVectors.push(vector);
                    }
                }
                layer.addVectors(circleVectors);
            }
            return this;
        },
        drawEllipses: function (layer, jsonData) {
            if (jsonData.ellipses.length > 0) {
                var circleVectors = [];
                for (var i in jsonData.ellipses) {
                    if (jsonData.ellipses[i].Cenetr != null) {
                        var x = jsonData.ellipses[i].Center.X - middleX;
                        var y = jsonData.ellipses[i].Center.Y - middleY;
                        var startAngle = jsonData.arcs[i].StartAngle;
                        startAngle = startAngle * Math.PI / 180;
                        var endAngle = jsonData.arcs[i].EndAngle;
                        endAngle = endAngle * Math.PI / 180;

                        var minorAxis = jsonData.ellipses[i].MinorAxis;
                        var majorAxis = jsonData.ellipses[i].MajorAxis
                    }
                }
            }
            return this;
        },
        drawLine: function (layer, jsonData) {
            if (jsonData.lines.length > 0) {
                var sX = [];
                var sY = [];
                var lineVectors = [];

                for (var i in jsonData.lines) {
                    var r = jsonData.lines[i].Color.R;
                    var g = jsonData.lines[i].Color.G;
                    var b = jsonData.lines[i].Color.B;
                    if (r == 255 && g == 255 && b == 255) {
                        r = 0;
                        g = 0;
                        b = 0;
                    }
                    var circleStyle = {
                        fillColor: "green",
                        strokeColor: "rgb(" + r + "," + g + "," + b + ")",
                        fill: false,
                        stroke: true,
                        fillOpacity: 1,
                        strokeOpacity: 1
                    };
                    var points = [];
                    if (jsonData.lines[i].StartPoint != null && jsonData.lines[i].EndPoint != null) {
                        var startX = jsonData.lines[i].StartPoint.X - middleX;
                        var startY = jsonData.lines[i].StartPoint.Y - middleY;
                        var endX = jsonData.lines[i].EndPoint.X - middleX;
                        var endY = jsonData.lines[i].EndPoint.Y - middleY;

                        var point = new AKXY.Point(startX, startY);
                        points.push(point);
                        point = new AKXY.Point(endX, endY);
                        points.push(point);
                        var line = new AKXY.Vector(new AKXY.Line(points), circleStyle);
                        lineVectors.push(line);
                    }
                }
                layer.addVectors(lineVectors);
            }
            return this;
        },
        drawFillLine: function (layer, jsonData) {
            if (jsonData.lines.length > 0) {
                var sX = [];
                var sY = [];
                var lineVectors = [];
                var points = [];
                var num = 0;
                for (var i = 0; i < jsonData.lines.length; i++) {
                    if (jsonData.lines[i].Color != null) {
                        var r = jsonData.lines[i].Color.R;
                        var g = jsonData.lines[i].Color.G;
                        var b = jsonData.lines[i].Color.B;
                        if (r == 255 && g == 255 && b == 255) {
                            r = 0;
                            g = 0;
                            b = 0;
                        }
                        var fillColor, fill;
                        if (jsonData.lines[i].Value == 0)
                            fillColor = "green";
                        else if (jsonData.lines[i].Value == 1)
                            fillColor = "yellow";
                        else
                            fillColor = "red";

                        var circleStyle = {
                            fillColor: fillColor,
                            strokeColor: "rgb(" + r + "," + g + "," + b + ")",
                            fill: false,
                            stroke: fill,
                            fillOpacity: 1,
                            strokeOpacity: 1
                        };

                        if (jsonData.lines[i].StartPoint != null && jsonData.lines[i].EndPoint != null) {
                            var startX = jsonData.lines[i].StartPoint.X - middleX;
                            var startY = jsonData.lines[i].StartPoint.Y - middleY;
                            var endX = jsonData.lines[i].EndPoint.X - middleX;
                            var endY = jsonData.lines[i].EndPoint.Y - middleY;
                            var point = new AKXY.Point(startX, startY);
                            points.push(point);
                            point = new AKXY.Point(endX, endY);
                            points.push(point);
                            num++;
                        }
                        if (num == 4) {
                            var line = new AKXY.Vector(new AKXY.Line(points), circleStyle);
                            lineVectors.push(line);
                            points = [];
                            num = 0;
                        }

                    }
                }
                layer.addVectors(lineVectors);
            }
        },
        drawPolyline: function (layer, jsonData) {
            if (jsonData.polylines.length > 0) {
                var vectors = [];

                for (var i in jsonData.polylines) {
                    var polyline = jsonData.polylines[i];
                    if (polyline.Flags >= 0) {
                        var point;
                        var firstPoint;
                        var r = polyline.Color.R;
                        var g = polyline.Color.G;
                        var b = polyline.Color.B;
                        if (r == 255 && g == 255 && b == 255) {
                            r = 0;
                            g = 0;
                            b = 0;
                        }
                        var circleStyle = {
                            fillColor: "green",
                            strokeColor: "rgb(" + r + "," + g + "," + b + ")",
                            fill: false,
                            stroke: true,
                            fillOpacity: 1,
                            strokeOpacity: 1
                        };
                        for (var i in polyline.Vertexes) {
                            var seg = polyline.Vertexes[i];
                            var points = [];
                            if (i == 0) {
                                point = new AKXY.Point(seg.Location.X - middleX, seg.Location.Y - middleY);
                                firstPoint = point;
                            }
                            else {
                                if (seg.Bulge == 0 || seg.Bulge == null) {//直线  
                                    var otherPoint = new AKXY.Point(seg.Location.X - middleX, seg.Location.Y - middleY);
                                    points.push(point);
                                    points.push(otherPoint);
                                    var line = new AKXY.Vector(new AKXY.Line(points), circleStyle);
                                    vectors.push(line);
                                    point = otherPoint;
                                }
                                //else {//圆弧
                                //    var bulge = seg.Bulge;
                                //    var otherPoint = new Point(seg.Location.X - 3074, seg.Location.Y - 4952);
                                //    var angle = 4 * Math.atan(Math.abs(bulge)) / Math.PI * 180;
                                //    var length = Math.sqrt((point.x - otherPoint.x) * (point.x - otherPoint.x) + (point.y - otherPoint.y) * (point.y - otherPoint.y));
                                //    var radius = Math.abs(length / (2 * Math.sin(angle / 360 * Math.PI)));

                                //}
                            }
                        }

                        if (polyline.IsClosed) {//如果闭合 直线连接
                            var endPoints = [];
                            endPoints.push(point);
                            endPoints.push(firstPoint);
                            var line = new AKXY.Vector(new AKXY.Line(endPoints), circleStyle);
                            var vector = [];
                            vector.push(line);
                            layer.addVectors(vector);
                        }
                    }
                }
                layer.addVectors(vectors);
            }
            return this;
        },
        drawMText: function (layer, jsonData) {
            if (jsonData.mtexts.length > 0) {
                for (var i in jsonData.mtexts) {

                }
            }
            return this;
        },
        drawText: function (layer, jsonData) {
            if (jsonData.texts.length > 0) {
                var textVectors = [];
                for (var i in jsonData.texts) {
                    var texts = jsonData.texts[i];
                    var value = texts.Value;
                    var x = texts.BasePoint.X - middleX;
                    var y = texts.BasePoint.Y - middleY;
                    var height = texts.Height;
                    var rotation = texts.Rotation;
                    var r = texts.Color.R;
                    var g = texts.Color.G;
                    var b = texts.Color.B;
                    if (r == 255 && g == 255 && b == 255) {
                        r = 0;
                        g = 0;
                        b = 0;
                    }
                    var textStyle = {
                        fillColor: "rgb(" + r + "," + g + "," + b + ")",
                        height: height,
                        rotation: rotation
                    };
                    var t = new AKXY.Text(x, y, value);
                    var text = new AKXY.Vector(t, textStyle);
                    textVectors.push(text);
                }
                layer.addVectors(textVectors);
            }
            return this;
        },
    };

    function getQuakeSize(energy, size, step) {
        var circleStyle = {
            color: "#4169E1", //大红    	
            darkColor: "#000080", //暗红                    
            size: 3,
            fill: true,
        };
        var quakesize = size;
        if (energy >= 100 && energy < 10000) {
            circleStyle.color = "#00FF00";
            circleStyle.darkColor = "rgb(0,170,85)";
            circleStyle.size = size + 2 * step;
        }
        else if (energy >= 10000 && energy < 100000) {//4-5
            circleStyle.color = "rgb(255,255,83)";
            circleStyle.darkColor = "rgb(189,189,0)";
            circleStyle.size = size + 3 * step;
        }
        else if (energy >= 100000 && energy < 1000000) {//5-6
            circleStyle.color = "#FFA500";
            circleStyle.darkColor = "#CD853F";
            circleStyle.size = size + 4 * step;
        }
        else if (energy >= 1000000) {//6
            circleStyle.color = "#ff0000";
            circleStyle.darkColor = "rgb(183,0,0)";
            circleStyle.size = size + 5 * step;
        }
        return circleStyle;
    }

    function moveTo(maxx, miny, layercad) {
        var zoom = 100;
        for (var j = 100; j >= 1; j--) {
            var res = 100 / j;
            var left = -1 * layercad.size.w / 2 * res;
            var right = layercad.size.w / 2 * res;
            var bottom = -1 * layercad.size.h / 2 * res;
            var top = layercad.size.h / 2 * res;
            var xv = (maxx / res - left / res);
            var yv = (top / res - miny / res);
            if (xv <= layercad.size.w && yv <= layercad.size.h) {
                zoom = j;
                break;
            }
        }
        layercad.moveTo(zoom, { x: 0, y: 0 });
        layercadInfo.firstZoom = zoom;
    }

    _global = (function () { return this || (0, eval)('this'); }());
    !('akxyCad' in _global) && (_global.akxyCad = akxyCad);
})();



/**
 * @Name: akxy-canvas V1.0.0  Canvas绘制矢量图基础类库  
 * @Author: wyd  http://www.wuyandong.me/
 * @Copyright: 2018 AKXY 
 * thanks to http://www.cnblogs.com/doudougou
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.AKXY = {})));
}(this, (function (exports) {
    'use strict';

    /*
     工具类
    */
    var Util = {
        constructor: Util,
        type: 'Util',
        getId: function (preString) {
            Util.lastId += 1;
            return preString + Util.lastId;
        },
        defaultStyle: function () {
            this.fill = true;
            this.stroke = true;
            this.pointRadius = 5;
            this.fillOpacity = 0.6;
            this.strokeOpacity = 1;
            this.fillColor = "red";
            this.strokeColor = "black";
            this.fixedSize = false;
        },
        bindAsEventListener: function (func, object) {
            return function (event) {
                return func.call(object, event || window.event);
            };
        },
        stopEventBubble: function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }

            if (e && e.stopPropagation)
                e.stopPropagation();
            else
                window.event.cancelBubble = true;
        },
        cloneObj: function (obj) {
            var reObj = {};
            for (var id in obj) {
                reObj[id] = obj[id];
            }
            return reObj;
        }
    }
    Util.lastId = 0;

    /*
      Layer类
    */
    function Layer(div) {
        this.div = div;
        this.size = new Size(parseInt(div.clientWidth), parseInt(div.clientHeight));
        this.maxBounds = new Bounds(-this.size.w / 2, -this.size.h / 2, this.size.w / 2, this.size.h / 2);
        this.bounds = new Bounds(-this.size.w / 2, -this.size.h / 2, this.size.w / 2, this.size.h / 2);
        this.center = this.bounds.getCenter();
        this.zoom = 100;
        this.getRes();
        this.vectors = {};
        this.middleXY = { x: 0, y: 0 };
        this.vectorsCount = 0;
        this.type = 'Layer';
        this.renderer = new Canvas(this);
        this.scale = new Scale(this);
        this.pan = new Pan(this);
    }

    Layer.prototype = {
        constructor: Layer,
        getRes: function () {
            this.res = 1 / (this.zoom / 100);
            return this.res;
        },
        getResFromZoom: function (zoom) {
            var res = 1 / (zoom / 100);
            return res;
        },
        addVectors: function (vectors) {
            this.renderer.lock = true;
            for (var i = 0, len = vectors.length; i < len; i++) {
                if (i == len - 1) { this.renderer.lock = false; }
                this.vectors[vectors[i].id] = vectors[i];
                this.drawVector(vectors[i]);
            }
            this.vectorsCount += vectors.length;
        },
        drawVector: function (vector) {
            var style;
            if (!vector.style) {
                style = new CanvasSketch.defaultStyle();
            } else {
                style = vector.style;
            }
            this.renderer.drawGeometry(vector.geometry, style);
        },
        moveTo: function (zoom, center) {
            if (zoom <= 0) {
                return;
            }
            this.zoom = zoom;
            this.center = center;
            var res = this.getRes();
            var width = this.size.w * res;
            var height = this.size.h * res;
            //获取新的视图范围。
            var bounds = new Bounds(center.x - width / 2, center.y - height / 2, center.x + width / 2, center.y + height / 2);
            this.bounds = bounds;
            //记录已经绘制vector的个数
            var index = 0;
            this.renderer.lock = true;
            for (var id in this.vectors) {
                index++;
                if (index == this.vectorsCount) {
                    this.renderer.lock = false;
                }
                this.drawVector(this.vectors[id]);
            }
        },
        getPositionFromPx: function (px) {
            return new Position((px.x + this.bounds.left / this.res) * this.res,
               (this.bounds.top / this.res - px.y) * this.res);
        },
        setMiddleXY: function (x, y) {
            this.middleXY.x = x;
            this.middleXY.y = y;
        },
        setCircleImage: function (point, radius, url) {
            this.renderer.setCircleImage(point, radius, url);
        },
        getPointToCanvas: function (box, touch, width, height) {
            var x = (touch.clientX - box.left) * (width / box.width);
            var y = (touch.clientY - box.top) * (height / box.height);
            return { x: x, y: y };
        },
        getVectorsCount: function () {
            return this.vectorsCount;
        },
        isShowCadInfo: function (layer, pt) {
            var cadGeometry = layer.renderer.cadGeometrys;
            var zoom = layer.zoom;
            var x = pt.x * (100 / zoom) + layer.bounds.left + layer.middleXY.x;
            var y = layer.bounds.top - pt.y * (100 / zoom) + layer.middleXY.y;
            var spanx = document.getElementById("spanx");
            var spany = document.getElementById("spany");
            spanx.innerHTML = "X = " + x.toFixed(1);
            spany.innerHTML = "Y = " + y.toFixed(1);
            for (var i in cadGeometry) {
                var radius = cadGeometry[i][2];
                var xcad = cadGeometry[i][1].x;
                var ycad = cadGeometry[i][1].y;
                var dis = (xcad - pt.x) * (xcad - pt.x) + (ycad - pt.y) * (ycad - pt.y);
                if (dis <= radius * radius) {
                    var cadInfo = cadGeometry[i][0].cadInfo;
                    if (cadInfo.Type == "Stress") {
                        spany.innerHTML = "Y = " + y.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;Z=&nbsp;" + cadInfo.Z + "&nbsp;&nbsp;&nbsp;&nbsp;采集时间:&nbsp;" + cadInfo.AcquisitionTime + "&nbsp;&nbsp;&nbsp;&nbsp;测点名称:&nbsp;" + cadInfo.MPName + "&nbsp;&nbsp;&nbsp;&nbsp;压力值:&nbsp;" + cadInfo.PValue + "&nbsp;&nbsp;&nbsp;&nbsp;增幅:&nbsp;" + cadInfo.ZFValue + "&nbsp;&nbsp;&nbsp;&nbsp;" + cadInfo.LevelInfo;
                    }
                    else if (cadInfo.Type == "Quake") {
                        var ox = Number(cadInfo.X);
                        var oy = Number(cadInfo.Y);
                        spanx.innerHTML = "X = " + ox.toFixed(1);
                        spany.innerHTML = "Y = " + oy.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;Z=&nbsp;" + cadInfo.Z + "&nbsp;&nbsp;&nbsp;&nbsp;起震时间:&nbsp;" + cadInfo.OccurrenceTime + "&nbsp;&nbsp;&nbsp;&nbsp;能量大小:&nbsp;" + cadInfo.ShowEnergy;
                    }
                    else if (cadInfo.Type == "SupportZJ") {
                        spany.innerHTML = "Y = " + y.toFixed(1) + "&nbsp;&nbsp;&nbsp;&nbsp;Z=&nbsp;" + cadInfo.Z + "&nbsp;&nbsp;&nbsp;&nbsp;采集时间:&nbsp;" + cadInfo.AcquisitionTime + "&nbsp;&nbsp;&nbsp;&nbsp;测点名称:&nbsp;" + cadInfo.MPName + "&nbsp;&nbsp;&nbsp;&nbsp;压力值:&nbsp;" + cadInfo.PValue + "&nbsp;&nbsp;&nbsp;&nbsp;增幅:&nbsp;" + cadInfo.ZFValue;
                    }
                }
            }
        }
    };

    /*
      矢量类 承载Geometry
    */
    function Vector(geometry, style, attributes) {
        this.id = Util.getId("vector");
        this.geometry = geometry;
        this.style = style;
        this.type = 'Vector';
        if (attributes) {
            this.attributes = attributes;
        }
    }

    /*
      图形绘制类
    */
    //全局变量，确保预警特效刷新时，Windows对象中还保存有数值。
    var contextSE, size, isAnimation = false, r = 1, ptt = []; //ptt测点预警值>0.3
    function Canvas(layer) {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        //预警特效Canvas
        this.canvasSE = document.createElement("canvas");
        contextSE = this.canvasSE.getContext("2d");
        this.canvasSE.style.cssText = 'position:absolute;left:0;top:0;';
        this.lock = true;
        this.aklayer = layer;
        size = this.aklayer.size;
        this.setSize(this.aklayer.size);
        this.geometrys = {};
        this.cadGeometrys = {};
        this.index = 0; //判断热力图
        this.nowXYZ = []; //需要热力图的测点
        this.type = 'Canvas';
        this.pointsOfWarn = [];
        //绘制图形this.canvas融入了热力图中，如果用不到热力图可以自行取出
        this.heatmapInstance = h337.create({
            container: this.aklayer.div,
            canvas: this.canvas
            //blur: 0.1,        
        });
        layer.div.appendChild(this.canvasSE);

        //渲染预警特效
        //setInterval(this.setChange, 200);
    }

    Canvas.prototype = {
        maxvalue: 20,
        setSize: function (size) {
            this.canvas.width = size.w;
            this.canvas.height = size.h;
            this.canvas.style.width = size.w + "px";
            this.canvas.style.height = size.h + "px";

            this.canvasSE.width = size.w;
            this.canvasSE.height = size.h;
            this.canvasSE.style.width = size.w + "px";
            this.canvasSE.style.height = size.h + "px";
        },
        drawGeometry: function (geometry, style) {
            this.geometrys[geometry.id] = [geometry, style];
            if (!this.lock) {
                this.redraw();
            }
        },
        redraw: function () {
            var w = this.aklayer.size.w;
            var h = this.aklayer.size.h;
            this.context.clearRect(0, 0, this.aklayer.size.w, this.aklayer.size.h);
            contextSE.clearRect(0, 0, this.aklayer.size.w, this.aklayer.size.h);
            this.heatmapInstance._renderer._clear();

            var geometry;
            if (!this.lock) {
                this.nowXYZ = [];
                ptt = [];
                this.pointsOfWarn = [];
                for (var id in this.geometrys) {
                    geometry = this.geometrys[id][0];
                    var bounds = geometry.getBounds();
                    if (this.aklayer.bounds.intersect(bounds)) {
                        if (geometry.isHeatMap) {
                            var pt = this.getLocalXYCircle(geometry);
                            pt.radius = geometry.radius;
                            this.nowXYZ.push(pt);
                        }
                    }
                }

                this.drawHeatMap(this.nowXYZ);
                for (var id in this.geometrys) {
                    geometry = this.geometrys[id][0];
                    var bounds = geometry.getBounds();
                    if (this.aklayer.bounds.intersect(bounds)) {
                        var style = this.geometrys[id][1];
                        this.draw(geometry, style);
                    }
                }
                isAnimation = true;
            }
        },
        drawHeatMap: function (nowXYZ) {
            if (nowXYZ.length <= 0)
                return;
            var points = [];
            var resolution = this.aklayer.res;
            var rad = 130 / resolution;
            var maxValue = 20;

            for (var i = 0; i < nowXYZ.length; i++) {
                var value = nowXYZ[i].value;
                maxValue = Math.max(maxValue, value);
                var point = {
                    x: nowXYZ[i].x,
                    y: nowXYZ[i].y,
                    value: value,
                    radius: nowXYZ[i].radius / resolution
                };
                points.push(point);
            }
            var gra;
            if (this.index == 1) {
                maxValue = this.maxvalue;
            }
            if (maxValue <= 30) {
                gra = {
                    0: 'rgb(0,255,0)',
                    1: 'rgb(0,255,0)',
                }
                maxValue = 30;
            }
            else if (maxValue > 30 && maxValue <= 50) {
                gra = {
                    0: 'rgb(32,255,0)',
                    0.5: 'rgb(0,255,0)',
                    1: 'yellow',
                }
                maxValue = 50;
            }
            else if (maxValue > 50 && maxValue <= 80) {
                gra = {
                    0: 'rgb(32,255,0)',
                    0.3: 'rgb(0,255,0)',
                    0.6: 'yellow',
                    1: 'rgb(250,128,10)',
                }
                maxValue = 80;
            }
            else if (maxValue > 80 && maxValue <= 100) {
                gra = {
                    0: 'rgb(32,255,0)', //rgb(0,119,255)
                    0.3: 'rgb(0,255,0)',
                    0.5: 'yellow',
                    0.8: 'rgb(250,128,10)',
                    1: 'rgb(151,1,0)' //
                }
                maxValue = 90;
            }
            this.maxvalue = maxValue;
            var data = {
                max: maxValue,
                data: points
            };

            var nuConfig = {
                gradient: gra
            };
            this.heatmapInstance.configure(nuConfig);

            this.heatmapInstance.setData(data);
            this.index = 1;
        },
        draw: function (geometry, style) {
            switch (geometry.type) {
                case "Point":
                    this.drawPoint(geometry, style);
                    break;
                case "Circle":
                    this.drawCircle(geometry, style);
                    break;
                case "Line":
                    this.drawLine(geometry, style);
                    break;
                case "LinerRing":
                    this.drawLinerRing(geometry, style);
                    break;
                case "Rect":
                    this.drawRect(geometry, style);
                    break;
                case "Img":
                    this.drawImage(geometry, style);
                    break;
                case "Text":
                    this.drawText(geometry, style);
                    break;
                default:

            }
        },
        drawPoint: function (geometry, style) {
            var radius = style.pointRadius;
            var twoPi = Math.PI * 2;
            var pt = this.getLocalXY(geometry);
            this.nowXYZ.push(pt);
            //填充
            if (style.fill) {
                this.setCanvasStyle("fill", style)
                this.context.beginPath();
                this.context.arc(pt.x, pt.y, radius, 0, twoPi, true);
                this.context.fill();
            }
            //描边
            if (style.stroke) {
                this.setCanvasStyle("stroke", style)
                this.context.beginPath();
                this.context.arc(pt.x, pt.y, radius, 0, twoPi, true);
                this.context.stroke();
            }
            this.setCanvasStyle("reset");
        },
        drawCircle: function (geometry, style) {
            var radius = geometry.radius
            var startAngle = geometry.startAngle;
            var endAngle = geometry.endAngle;
            var resolution = this.aklayer.getRes();
            if (!geometry.isHeatMap) {
                var pt = this.getLocalXY(geometry);
                if (geometry.isCadPoint && geometry.value > 0.3 && geometry.value < 1) {
                    ptt.push(pt);
                    this.pointsOfWarn.push(pt);
                }
                //填充
                if (style.fill) {
                    this.context.beginPath();
                    this.context.arc(pt.x, pt.y, style.size / this.aklayer.res, 0, Math.PI * 2, true);
                    var gradient = this.context.createRadialGradient(pt.x - style.size / (2 * this.aklayer.res), pt.y - style.size / (2 * this.aklayer.res), 0, pt.x, pt.y, style.size / this.aklayer.res);

                    gradient.addColorStop(0, style.color);
                    gradient.addColorStop(1, style.darkColor);
                    this.context.fillStyle = gradient;
                    this.context.fill();
                    this.cadGeometrys[geometry.id] = [geometry, pt, style.size / this.aklayer.res];
                }
                //描边
                if (style.stroke) {
                    this.setCanvasStyle("stroke", style)
                    this.context.beginPath();
                    this.context.arc(pt.x, pt.y, radius / resolution, startAngle, endAngle, false);
                    this.context.stroke();
                    if (geometry.isCadPoint) {
                        this.context.globalAlpha = 0.5;
                        this.context.fillStyle = style['fillColor'];
                        this.context.fill();
                        this.cadGeometrys[geometry.id] = [geometry, pt, radius / resolution];
                    }
                }
            }
            this.setCanvasStyle("reset");
        },
        drawLine: function (geometry, style) {
            this.setCanvasStyle("stroke", style);
            this.rendererPath(geometry, { fill: false, stroke: true });
            if (geometry.points.length > 2) {
                this.setCanvasStyle("fill", style);
                this.rendererPath(geometry, { fill: true, stroke: true });
            }
            this.setCanvasStyle("reset");
        },
        drawLinerRing: function (geometry, style) {
            if (style.stroke) {
                this.setCanvasStyle("stroke", style);
                this.rendererPath(geometry, { fill: false, stroke: true });
            }
            if (style.fill) {
                this.setCanvasStyle("fill", style);
                this.rendererPath(geometry, { fill: true, stroke: true });
            }
            this.setCanvasStyle("reset");
        },
        drawRect: function (geometry, style) {
            var pt = this.getLocalXY(geometry);
            var res = this.aklayer.getRes();
            this.context.fillStyle = geometry.fillStyle;
            this.context.fillRect(pt.x, pt.y, geometry.width / this.aklayer.res, geometry.height / this.aklayer.res);
        },
        drawImage: function myfunction(geometry, style) {
            var canvas = this;
            if (!geometry.useUrl) {
                var img = geometry.image;
                imageLoad();
            } else {
                var img = new Image();
                img.onload = imageLoad;
                img.loadErro = imageErro;
                img.src = geometry.image;
            }

            function imageLoad() {
                canvas.setCanvasStyle("fill", style);
                var fixedSize = style.fixedSize;
                var pt = canvas.getLocalXY(geometry.point);
                var width = style.width || img.width;
                var height = style.width || img.height;
                if (fixedSize) {
                    var offsetX = width / 2;
                    var offsetY = height / 2;
                    canvas.context.drawImage(img, pt.x - offsetX, pt.y - offsetY, width, height);
                } else {
                    var res = canvas.aklayer.getRes();
                    var offsetX = width / 2 / res;
                    var offsetY = height / 2 / res;
                    canvas.context.drawImage(img, pt.x - offsetX, pt.y - offsetY, width / res, height / res);
                }
                if (geometry.useUrl) {
                    geometry.useUrl = false;
                    geometry.image = img;
                }
                canvas.setCanvasStyle("reset");
            }

            function imageErro() {

            }
        },
        drawText: function (geometry, style) {
            this.context.save();
            var pt = this.getLocalXY(geometry);
            var value = geometry.value;
            var rotation = style["rotation"];
            this.context.translate(pt.x, pt.y);
            this.context.rotate(-rotation * Math.PI / 180);
            var resolution = this.aklayer.getRes();
            this.context.font = style["height"] * 1.428571 / resolution + "px 宋体";
            this.context.fillStyle = style["fillColor"];
            this.context.fillText(value, 0, 0);
            this.context.restore();
        },
        rendererPath: function (geometry, rendererType) {
            var points = geometry.points;
            var len = points.length;
            var context = this.context;
            context.beginPath();
            var start = this.getLocalXY(points[0]);
            var x = start.x;
            var y = start.y;
            if (!isNaN(x) && !isNaN(y)) {
                context.moveTo(x, y);
                for (var i = 1; i < len; ++i) {
                    var pt = this.getLocalXY(points[i]);
                    context.lineTo(pt.x, pt.y);
                }
                if (rendererType.fill) {
                    context.globalAlpha = 0.5;
                    context.fill();
                }
                if (rendererType.stroke) {
                    context.stroke();
                }
            }
        },
        setCanvasStyle: function (type, style) {
            if (type === "fill") {
                this.context.globalAlpha = style['fillOpacity'];
                this.context.fillStyle = style['fillColor'];
            } else if (type === "stroke") {
                this.context.globalAlpha = style['strokeOpacity'];
                this.context.strokeStyle = style['strokeColor'];
                this.context.lineWidth = style['strokeWidth'];
            } else {
                this.context.globalAlpha = 1;
                this.context.lineWidth = 1;
            }
        },
        getLocalXY: function (point) {
            var resolution = this.aklayer.getRes();
            var extent = this.aklayer.bounds;
            var x = (point.x / resolution + (-extent.left / resolution));
            var y = ((extent.top / resolution) - point.y / resolution);
            return { x: x, y: y };
        },
        getLocalXYCircle: function (point) {
            var resolution = this.aklayer.getRes();
            var extent = this.aklayer.bounds;
            var x = (point.x / resolution + (-extent.left / resolution));
            var y = ((extent.top / resolution) - point.y / resolution);
            return { x: x, y: y, value: point.value };
        },
        setCircleImage: function (point, radius, url) {
            var cont = this.context;
            var pt = this.getLocalXY(point);
            var img = new Image();
            img.src = url;
            img.onload = function () {
                var width = img.width;
                var height = img.height;
                var offsetX = width / 2;
                var offsetY = height / 2;
                cont.drawImage(img, pt.x - offsetX, pt.y - offsetY);
            }
        },
        setChange: function () {
            if (!isAnimation)
                return;
            contextSE.clearRect(0, 0, size.w, size.h);
            for (var i = 0; i < ptt.length; i++) {
                var grad = contextSE.createRadialGradient(ptt[i].x, ptt[i].y, 1, ptt[i].x, ptt[i].y, r);
                grad.addColorStop(0, 'rgba(168,84,93,0)');
                grad.addColorStop(0.5, 'rgba(172,55,73,0)');
                grad.addColorStop(1, '#ff3333');
                contextSE.strokeStyle = 'red';
                //grad.addColorStop(0, 'rgba(231,241,2,0)');
                //grad.addColorStop(0.5, 'rgba(231,241,2,0.2)');
                //grad.addColorStop(1, 'rgba(231,241,2,0.5)');
                //contextSE.strokeStyle = 'orange';
                contextSE.fillStyle = grad;
                contextSE.beginPath();
                contextSE.arc(ptt[i].x, ptt[i].y, r++, 0, 2 * Math.PI);
                contextSE.closePath();
                contextSE.stroke();
                contextSE.fill();
            }
            r++;
            if (r >= 30) {
                r = 1;
            }
        }
    }


    /*
      Geometry类 点、线、文本、图片等的父类
    */
    function Geometry() {
        this.id = Util.getId("geomtry_");
        this.type = 'Geometry';
    }

    Geometry.prototype = {
        constructor: Geometry,
        clone: function () {
            return new Geometry();
        },
        destroy: function () {
            //目前Canvas无法清除指定的图形
        },
        bounds: null,
        id: null
    }

    /*
       点类
       坐标x,y
    */
    function Point(x, y) {
        Geometry.apply(this, arguments);
        this.type = 'Point';
        this.x = x;
        this.y = y;
    }

    Point.prototype = Object.assign(Object.create(Geometry.prototype), {
        constructor: Point,
        getBounds: function () {
            if (!this.bounds) {
                var x = this.x;
                var y = this.y;
                this.bounds = new Bounds(x, y, x, y);
                return this.bounds;
            } else {
                return this.bounds;
            }
        },
        clone: function () {
            return new Point(this.x, this.y);
        }
    });


    /*
      圆形类
      x,y坐标，半径，起始角度，终止角度，是否绘制热力图，预警值，测点(应力等)信息，是否为测点(应力等)
    */
    function Circle(x, y, radius, startAngle, endAngle, isHeatMap, value, cadInfo, isCadPoint) {
        Point.apply(this, arguments);
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.isHeatMap = isHeatMap;
        this.value = value;
        this.cadInfo = cadInfo;
        this.type = 'Circle',
        this.isCadPoint = isCadPoint;
    }

    Circle.prototype = Object.assign(Object.create(Point.prototype), {
        constructor: Circle,
        getBounds: function () {
            if (!this.bounds) {
                this.bounds = new Bounds(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
                return this.bounds;
            } else {
                return this.bounds;
            }
        }
    });


    /*
      直线类
      一组坐标点
    */
    function Line(points) {
        Geometry.apply(this, arguments);
        this.points = points;
        this.type = 'Line';
    }

    Line.prototype = Object.assign(Object.create(Geometry.prototype), {
        constructor: Line,
        getBounds: function () {
            if (!this.bounds) {
                var p0 = this.points[0];
                this.bounds = new Bounds(p0.x, p0.y, p0.x, p0.y);
                for (var i = 1, len = this.points.length; i < len; i++) {
                    var point = this.points[i];
                    var bounds = new Bounds(point.x, point.y, point.x, point.y);
                    this.bounds.extend(bounds);
                }
            }
            return this.bounds;
        }
    })

    /*
       矩形类
    */
    function Rect(x, y, width, height, fillStyle) {
        Geometry.apply(this, arguments);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.style = fillStyle;
        this.fillStyle = fillStyle;
        this.type = 'Rect';
    }

    Rect.prototype = Object.assign(Object.create(Geometry.prototype), {
        constructor: Rect,
        getBounds: function () {
            if (!this.bounds) {
                this.bounds = new Bounds(this.x, this.y, this.x + this.width, this.y + this.height);
                return this.bounds;
            } else {
                return this.bounds;
            }
        }
    });

    /*
       图片类
       坐标，地址
    */
    function Img(point, image) {
        Geometry.apply(this, arguments);
        this.point = point;
        this.type = 'Img';
        if (typeof image == Image) {
            this.useUrl = false;
            this.image = image;
        } else {
            this.useUrl = true;
            this.image = image;
        }
    }

    Img.prototype = Object.assign(Object.create(Geometry.prototype), {
        constructor: Img,
        getBounds: function () {
            return new Bounds(this.point.x, this.point.y, this.point.x, this.point.y);
        }
    });


    /*
       文本类
       坐标，文字
    */
    function Text(x, y, value) {
        Geometry.apply(this, arguments);
        this.x = x;
        this.y = y;
        this.value = value;
        this.type = 'Text';
    }

    Text.prototype = Object.assign(Object.create(Geometry.prototype), {
        constructor: Text,
        getBounds: function () {
            return new Bounds(this.x, this.y, this.x, this.y);
        }
    })

    /*
       封闭线类
       一组点
    */
    function LinerRing(points) {
        Line.apply(this, arguments);
        if (points) {
            this.points = points;
            var len = this.points.length;
            if (this.points[0].x != this.points[len - 1].x || this.points[0].y != this.points[len - 1].y) {
                this.points.push(this.points[0].clone());
            }
        };
        this.type = 'LinerRing';
    }

    LinerRing.prototype = new Line();
    LinerRing.prototype.constructor = LinerRing;


    /*
      三角形类 目前没有实现倾斜的三角形
      中心点 半径 测点信息
    */
    function Triangle(center, r, cadInfo) {
        this.center = center;
        this.r = r;
        this.cadInfo = cadInfo;
        this.type = 'LinerRing';
        var points = this.getPoints(center, r);
        LinerRing.call(this, points);
    }

    Triangle.prototype = Object.assign(Object.create(LinerRing.prototype), {
        getPoints: function (center, r) {
            var point, points = [];
            var angle = 30;
            var degree = Math.PI / 180;

            point = new Point(center.x, center.y + r);
            points.push(point);

            point = new Point(center.x - r * Math.cos(angle * degree), center.y - r * Math.sin(angle * degree));
            points.push(point);

            point = new Point(center.x + r * Math.cos(angle * degree), center.y - r * Math.sin(angle * degree));
            points.push(point);
            return points;
        }
    });


    /*
       五角星类
    */
    function Star(center, r) {
        this.center = center;
        this.r = r;
        this.type = 'LinerRing';
        var points = this.getPoints(center, r);
        LinerRing.call(this, points);
    }

    Star.prototype = Object.assign(Object.create(LinerRing.prototype), {
        getPoints: function (center, r) {
            var point, points = [];
            var angle = 0;
            var degree = Math.PI / 180;
            for (var i = 0; i < 10; i++) {
                var radius = (i % 2 == 0) ? r : r / 2;
                point = new Point(center.x + Math.sin(angle * degree) * radius, center.y + Math.cos(angle * degree) * radius);
                points.push(point);
                angle += 36;
            }
            return points;
        }
    });


    /*
      矢量图范围类
    */
    function Bounds(x1, y1, x2, y2) {
        this.left = x1;
        this.right = x2;
        this.bottom = y1;
        this.top = y2;
    }

    Bounds.prototype = {
        constructor: Bounds,
        getCenter: function () {
            var w = this.right - this.left;
            var h = this.top - this.bottom;
            return new Position(this.left + w / 2, this.bottom + h / 2);
        },
        intersect: function (bounds) {
            var inBottom = (
                ((bounds.bottom >= this.bottom) && (bounds.bottom <= this.top)) ||
                ((this.bottom >= bounds.bottom) && (this.bottom <= bounds.top))
            );
            var inTop = (
                ((bounds.top >= this.bottom) && (bounds.top <= this.top)) ||
                ((this.top > bounds.bottom) && (this.top < bounds.top))
            );
            var inLeft = (
                ((bounds.left >= this.left) && (bounds.left <= this.right)) ||
                ((this.left >= bounds.left) && (this.left <= bounds.right))
            );
            var inRight = (
                ((bounds.right >= this.left) && (bounds.right <= this.right)) ||
                ((this.right >= bounds.left) && (this.right <= bounds.right))
            );
            var intersects = ((inBottom || inTop) && (inLeft || inRight));
            return intersects;
        },
        extend: function (bounds) {
            if (this.left > bounds.left) {
                this.left = bounds.left;
            }
            if (this.bottom > bounds.bottom) {
                this.bottom = bounds.bottom;
            }
            if (this.right < bounds.right) {
                this.right = bounds.right;
            }
            if (this.top < bounds.top) {
                this.top = bounds.top;
            }
        }
    }

    function Position(x, y) {
        this.x = x;
        this.y = y;
    }

    function Size(w, h) {
        this.w = w;
        this.h = h;
    }

    function Pan(layer) {
        this.layer = layer;
        this.div = layer.div;
        this.active();
        this.dragging = false;
        this.delta = 4;
    }

    Pan.prototype = {
        constructor: Pan,
        startPan: function (e) {
            this.dragging = true;
            //在一开始保存点击的位置。
            this.lastX = (e.offsetX || e.layerX);
            this.lastY = (e.offsetY || e.layerY);
            //设置鼠标样式。
            this.layer.div.style.cursor = "move";
            Util.stopEventBubble(e);
        },
        pan: function (e) {
            var layer = this.layer;
            var box = layer.div.children[1].getBoundingClientRect();
            var x = (e.clientX - box.left) * (layer.div.children[1].width / box.width);
            var y = (e.clientY - box.top) * (layer.div.children[1].height / box.height);
            var pt = {
                x: x,
                y: y
            }
            layer.isShowCadInfo(layer, pt);
            if (this.dragging) {
                //计算改变的像素值
                var dx = (e.offsetX || e.layerX) - this.lastX;
                var dy = (e.offsetY || e.layerY) - this.lastY;
                this.lastX = (e.offsetX || e.layerX);
                this.lastY = (e.offsetY || e.layerY);
                layer.center.x -= dx * layer.res;
                layer.center.y += dy * layer.res;

                layer.moveTo(layer.zoom, layer.center);

            }
            Util.stopEventBubble(e);
        },
        endPan: function (e) {
            this.layer.div.style.cursor = "default";
            this.dragging = false;
            Util.stopEventBubble(e);
        },
        //touchXX: 适配移动端 手指操作
        touchstart: function () {
            this.dragging = true;
            var changed = e.changedTouches.length,
                touching = e.targetTouches.length;
            e.preventDefault(e);
            if (changed === 1 && touching === 1) {
                var touch = e.touches[0];
                this.lastX = touch.clientX;
                this.lastY = touch.clientY;
            }
            else if (changed === 1 || changed === 2 && touching === 2) {
                var touch1 = e.touches.item(0),
                    touch2 = e.touches.item(1)
                this.box = this.layer.div.children[2].getBoundingClientRect();
                this.width = this.layer.div.children[2].width;
                this.height = this.layer.div.children[2].height;
                var p = this.layer.GetPointToCanvas(this.box, touch1, this.width, this.height);
                var point1 = { x: p.x, y: p.y };
                p = this.layer.GetPointToCanvas(this.box, touch2, this.width, this.height);
                var point2 = { x: p.x, y: p.y };
                this.distance = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
            }
        },
        touchmove: function (e) {
            var layer = this.layer;
            var changed = e.changedTouches.length,
               touching = e.targetTouches.length;
            e.preventDefault(e);
            if (changed === 1 && touching === 1) {
                var touch = e.touches[0];
                var x = touch.clientX;
                var y = touch.clientY;
                var zoom = this.layer.zoom;
                x = x * (100 / zoom) + layer.bounds.left + layer.middleXY.x;
                y = layer.bounds.top - y * (100 / zoom) + layer.middleXY.y;
                var spanx = document.getElementById("spanx");
                var spany = document.getElementById("spany");
                spanx.innerHTML = "X = " + x.toFixed(3);
                spany.innerHTML = "Y = " + y.toFixed(3);
                if (this.dragging) {
                    //计算改变的像素值           
                    var dx = touch.clientX - this.lastX;
                    var dy = touch.clientY - this.lastY;
                    this.lastX = touch.clientX;
                    this.lastY = touch.clientY;

                    layer.center.x -= dx * layer.res;
                    layer.center.y += dy * layer.res;

                    layer.moveTo(layer.zoom, layer.center);
                }
            }
            else if (changed === 1 || changed === 2 && touching === 2) {
                var touch1 = e.touches.item(0),
                   touch2 = e.touches.item(1)

                var p = this.layer.GetPointToCanvas(this.box, touch1, this.width, this.height);
                var point1 = { x: p.x, y: p.y };
                p = this.layer.GetPointToCanvas(this.box, touch2, this.width, this.height);
                var point2 = { x: p.x, y: p.y };

                var nowdistance = Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));


                var centerx = (point1.x + point2.x) / 2;
                var centery = (point1.y + point2.y) / 2;


                var deltalX = layer.size.w / 2 - centerx;
                var deltalY = centery - layer.size.h / 2;

                var px = { x: centerx, y: centery };
                var zoomPoint = layer.getPositionFromPx(px);

                var zoom;
                if (nowdistance >= this.distance) {
                    zoom = layer.zoom + this.delta;

                }
                else {
                    zoom = layer.zoom - this.delta - 3;
                    if (zoom <= 10) {
                        this.layer.zoom = 4;
                        return;
                    }
                }
                var newRes = layer.getResFromZoom(zoom);
                var center = new CanvasSketch.Position(zoomPoint.x + deltalX * newRes, zoomPoint.y + deltalY * newRes);
                layer.moveTo(zoom, center);
                this.distance = nowdistance;
            }
        },
        touchend: function (e) {
            this.dragging = false;
            e.preventDefault();
        },
        active: function () {
            var Events = [["mousemove", Pan.prototype.pan],
                 ["mousedown", Pan.prototype.startPan],
                 ["mouseup", Pan.prototype.endPan],
                 ["touchstart", Pan.prototype.touchstart],
                 ["touchmove", Pan.prototype.touchmove],
                 ["touchend", Pan.prototype.touchend]];
            for (var i = 0, len = Events.length; i < len; i++) {
                var type = Events[i][0];
                var listener = Events[i][1];
                listener = Util.bindAsEventListener(listener, this);
                this.div.addEventListener(type, listener, true);
            }
        }
    }

    function Scale(layer) {
        this.layer = layer;
        this.div = layer.div;
        this.active();
    }

    Scale.prototype = {
        constructor: Scale,
        wheelChange: function (e) {
            var layer = this.layer;
            var delta = e.wheelDelta ? (e.wheelDelta / 120) * 30 : -e.detail / 3 * 30;
            var deltalX = layer.size.w / 2 - (e.offsetX || e.layerX);
            var deltalY = (e.offsetY || e.layerY) - layer.size.h / 2;

            var px = { x: (e.offsetX || e.layerX), y: (e.offsetY || e.layerY) };
            var zoomPoint = this.layer.getPositionFromPx(px);
            var zoom = this.layer.zoom + delta;
            var newRes = this.layer.getResFromZoom(zoom);

            var center = new Position(zoomPoint.x + deltalX * newRes, zoomPoint.y + deltalY * newRes);

            this.layer.moveTo(zoom, center);
            Util.stopEventBubble(e);
        },
        DOMScroll: function (e) {
            Util.stopEventBubble(e);
        },
        active: function () {
            var Events = [["mousewheel", Scale.prototype.wheelChange], ["DOMMouseScroll", Scale.prototype.wheelChange]];
            for (var i = 0, len = Events.length; i < len; i++) {
                var type = Events[i][0];
                var listener = Events[i][1];
                listener = Util.bindAsEventListener(listener, this);
                this.div.addEventListener(type, listener, true);
            }
        }
    }

    exports.Layer = Layer;
    exports.Line = Line;
    exports.Vector = Vector;
    exports.Point = Point;
    exports.Size = Size;
    exports.Bounds = Bounds;
    exports.Text = Text;
    exports.Circle = Circle;
})));


