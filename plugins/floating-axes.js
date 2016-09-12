(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['tauCharts'], function (tauPlugins) {
            return factory(tauPlugins);
        });
    } else if (typeof module === 'object' && module.exports) {
        var tauPlugins = require('tauCharts');
        module.exports = factory(tauPlugins);
    } else {
        factory(this.tauCharts);
    }
})(function (tauCharts) {

    var _ = tauCharts.api._;
    var d3 = tauCharts.api.d3;

    var SHADOW_SIZE = 16;
    var SHADOW_COLOR_0 = '#E5E7EB';
    var SHADOW_COLOR_1 = '#FFFFFF';
    var SHADOW_OPACITY_0 = 1;
    var SHADOW_OPACITY_1 = 0;

    var storeProp = '__transitionAttrs__';
    var parentProp = '__floatingAxesSrcParent__';
    var transProp = '__floatingAxesSrcTransform__';

    function floatingAxes(xSettings) {

        var settings = _.defaults(xSettings || {}, {
            bgcolor: '#fff'
        });

        var mmin = function (arr) {
            return Math.min.apply(null, arr);
        };

        var mmax = function (arr) {
            return Math.max.apply(null, arr);
        };

        var translate = function (x, y) {
            return ('translate(' + x + ',' + y + ')');
        };

        var parseTransform = function (transform) {
            if (!transform || transform.indexOf('translate(') !== 0) {
                return null;
            }
            return transform
                .replace('translate(', '')
                .replace(')', '')
                .replace(' ', ',')
                .split(',')
                .concat(0)
                .slice(0, 2)
                .map(function (x) {
                    return Number(x);
                });
        };

        var extractAxesInfo = function (selection) {
            var axes = [];
            selection.each(function () {
                var info = {
                    axis: this,
                    translate0: {x: 0, y: 0},
                    translate: {x: 0, y: 0}
                };
                var parent = this;
                var isTransformInTransition, currentTransform, nextTransform;
                while (parent.nodeName.toUpperCase() !== 'SVG') {
                    isTransformInTransition = (parent[storeProp] &&
                        parent[storeProp].transform);
                    currentTransform = parseTransform(parent.getAttribute('transform'));
                    nextTransform = (isTransformInTransition ?
                        parseTransform(parent[storeProp].transform) :
                        currentTransform);
                    if (currentTransform) {
                        info.translate0.x += currentTransform[0];
                        info.translate0.y += currentTransform[1];
                    }
                    if (nextTransform) {
                        info.translate.x += nextTransform[0];
                        info.translate.y += nextTransform[1];
                    }
                    parent = parent.parentNode;
                }
                axes.push(info);
            });

            return axes;
        };

        var createSlot = function (d3Svg, w, h) {
            var slot = d3Svg.append('g');
            slot.attr('class', 'floating-axes');
            addBackground(slot, w, h);
            return slot;
        };

        var addBackground = function (cont, w, h) {
            // TODO: What is "2", "-1"?
            var bs = 2;
            var dx = (bs + 1);
            var dy = (-bs);
            cont.append('rect')
                .attr({
                    class: 'i-role-bg',
                    x: 0,
                    y: dy,
                    width: w + dx,
                    height: h + bs,
                    fill: settings.bgcolor
                });

            return cont;
        };

        var addAxes = function (g, axes) {
            var container = g.node();
            axes.forEach(function (node) {
                node[parentProp] = node.parentNode;
                node[transProp] = (node[storeProp] && node[storeProp].transform ?
                    node[storeProp].transform :
                    node.getAttribute('transform'));
                container.appendChild(node);
            });
            return g;
        };

        var extractXAxes = function (getPositions, srcSvg, xAxesInfo, animationSpeed) {
            var pos = getPositions();
            var axes = xAxesInfo.map(function (info) {
                return info.axis;
            });

            var axisHeight = pos.svgHeight - pos.minXAxesY + 1 + pos.scrollbarHeight;

            var g = addAxes(createSlot(srcSvg, pos.svgWidth, axisHeight), axes);
            xAxesInfo.forEach(function (info) {
                translateAxis(
                    info.axis,
                    // NOTE: No vertical transition.
                    info.translate0.x, info.translate.y - pos.minXAxesY,
                    info.translate.x, info.translate.y - pos.minXAxesY,
                    animationSpeed
                );
            });
            var rect = g.select('.i-role-bg');

            var move = function (scrollTop) {
                var x = 0;
                var yLimit = pos.minXAxesY;
                var y = Math.min(
                    (pos.visibleHeight + scrollTop + pos.minXAxesY - pos.svgHeight - pos.scrollbarHeight),
                    yLimit
                );
                g.attr('transform', translate(x, y));
            };

            move(pos.scrollTop);

            return {
                element: g,
                handler: function () {
                    var pos = getPositions();
                    move(pos.scrollTop);
                }
            };
        };

        var extractYAxes = function (getPositions, srcSvg, yAxesInfo, animationSpeed) {
            var pos = getPositions();
            var axes = yAxesInfo.map(function (info) {
                return info.axis;
            });

            var g = addAxes(createSlot(srcSvg, pos.maxYAxesX, pos.svgHeight), axes);
            yAxesInfo.forEach(function (info, i) {
                translateAxis(
                    info.axis,
                    // NOTE: No horizontal transition.
                    info.translate.x, info.translate0.y,
                    info.translate.x, info.translate.y,
                    animationSpeed
                );
            });
            var rect = g.select('.i-role-bg');

            var move = function (scrollLeft) {
                var xLimit = 0;
                var x = Math.max(scrollLeft, xLimit);
                var y = 0;
                g.attr('transform', translate(x, y));
            };
            move(pos.scrollLeft);

            return {
                element: g,
                handler: function () {
                    var pos = getPositions();
                    move(pos.scrollLeft);
                }
            };
        };

        var extractCorner = function (getPositions, srcSvg) {
            var pos = getPositions();
            var xAxesHeight = pos.svgHeight - pos.minXAxesY + pos.scrollbarHeight;

            var g = createSlot(srcSvg, pos.maxYAxesX, xAxesHeight);

            var move = function (scrollLeft, scrollTop) {
                var bottomY = scrollTop + pos.visibleHeight;
                var xLimit = 0;
                var x = Math.max(scrollLeft, xLimit);
                var yLimit = pos.minXAxesY;
                var y = Math.min(
                    (scrollTop + pos.visibleHeight - xAxesHeight),
                    yLimit
                );
                g.attr('transform', translate(x, y));
            };
            move(pos.scrollLeft, pos.scrollTop);

            return {
                element: g,
                handler: function () {
                    var pos = getPositions();
                    move(pos.scrollLeft, pos.scrollTop);
                }
            };
        };

        var createShadows = function (getPositions, srcSvg) {
            var pos = getPositions();
            var yAxesWidth = pos.maxYAxesX;
            var xAxesHeight = pos.svgHeight - pos.minXAxesY + pos.scrollbarHeight;

            var g = srcSvg.append('g')
                .attr('class', 'floating-axes floating-axes-shadows')
                .attr('pointer-events', 'none');

            var createShadow = function (direction, x, y, width, height) {
                return g.append('rect')
                    .attr('fill', 'url(#shadow-gradient-' + direction + ')')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', width)
                    .attr('height', height);
            };
            var shadowNS = createShadow('ns', 0, 0, yAxesWidth, SHADOW_SIZE);
            var shadowEW = createShadow('ew',
                pos.visibleWidth - SHADOW_SIZE - pos.scrollbarWidth,
                pos.visibleHeight - xAxesHeight,
                SHADOW_SIZE,
                xAxesHeight
            );
            var shadowSN = createShadow('sn',
                0,
                pos.visibleHeight - xAxesHeight - SHADOW_SIZE,
                yAxesWidth,
                SHADOW_SIZE
            );
            var shadowWE = createShadow('we', yAxesWidth, pos.visibleHeight - xAxesHeight, SHADOW_SIZE, xAxesHeight);

            var move = function (scrollLeft, scrollTop) {
                var pos = getPositions();
                var x = scrollLeft;
                var y = scrollTop;
                g.attr('transform', translate(x, y));

                // Hide/show shadows
                var toggle = function (el, show) {
                    el.style('visibility', show ? '' : 'hidden');
                };
                toggle(shadowNS, pos.scrollTop > 0 && pos.svgHeight > pos.visibleHeight);
                toggle(shadowEW,
                    (pos.scrollLeft + pos.visibleWidth < pos.svgWidth) &&
                    (pos.svgWidth > pos.visibleWidth));
                toggle(shadowSN,
                    (pos.scrollTop + pos.visibleHeight < pos.svgHeight) &&
                    (pos.svgHeight > pos.visibleHeight));
                toggle(shadowWE, pos.scrollLeft > 0 && pos.svgWidth > pos.visibleWidth);
            };
            move(pos.scrollLeft, pos.scrollTop);

            return {
                element: g,
                handler: function () {
                    var pos = getPositions();
                    move(pos.scrollLeft, pos.scrollTop);
                }
            };
        };

        var translateAxis = function (axisNode, x0, y0, x1, y1, animationSpeed) {
            if (animationSpeed > 0) {
                d3.select(axisNode)
                    .attr('transform', translate(x0, y0))
                    .transition('axisTransition')
                    // TODO: Determine, how much time passed since last transition beginning.
                    .duration(animationSpeed)
                    .attr('transform', translate(x1, y1));
            } else {
                axisNode.setAttribute('transform', translate(x1, y1));
            }
        };

        return {

            init: function (chart) {
                this._chart = chart;
                this.rootNode = chart.getLayout().contentContainer;
                this.handlers = [];

                this._beforeExportHandler = chart.on('beforeExportSVGNode', function () {
                    this.recycle();
                }, this);
                this._afterExportHandler = chart.on('afterExportSVGNode', function () {
                    this.onRender();
                }, this);
            },

            recycle: function () {
                var root = this.rootNode;
                this.handlers.forEach(function (item) {
                    root.removeEventListener('scroll', item.handler);
                    item.element.selectAll('.axis').each(function () {
                        this[parentProp].appendChild(this);
                        this.setAttribute('transform', this[transProp]);
                        delete this[parentProp];
                        delete this[transProp];
                    });
                    item.element.remove();
                });
                var srcSvg = d3.select(this._chart.getSVG());
                // TODO: Reuse elements.
                srcSvg.selectAll('.floating-axes').remove();
            },

            destroy: function () {
                this.recycle();
                this._chart.removeHandler(this._beforeExportHandler, this);
                this._chart.removeHandler(this._afterExportHandler, this);
            },

            onRender: function () {

                var self = this;
                var chart = this._chart;

                var applicable = true;
                chart.traverseSpec(chart.getSpec(), function (unit) {
                    var isCoordNode = (unit && (unit.type.indexOf('COORDS.') === 0));
                    if (isCoordNode) {
                        if (unit.type !== 'COORDS.RECT') {
                            // non-rectangular coordinates
                            applicable = false;
                        } else {
                            var guide = unit.guide || {};
                            if (guide.autoLayout !== 'extract-axes') {
                                // non-extract axes
                                applicable = false;
                            }
                        }
                    }
                });

                if (applicable) {
                    var root = this.rootNode;
                    var srcSvg = d3.select(chart.getSVG());

                    var defs = srcSvg.append('defs')
                        .attr('class', 'floating-axes');

                    // Create shadow gradients definitions
                    var directions = {
                        ns: {x1: 0, y1: 0, x2: 0, y2: 1},
                        ew: {x1: 1, y1: 0, x2: 0, y2: 0},
                        sn: {x1: 0, y1: 1, x2: 0, y2: 0},
                        we: {x1: 0, y1: 0, x2: 1, y2: 0}
                    };
                    Object.keys(directions).forEach(function createGradient(direction) {
                        // TODO: Use class prefix.
                        var coords = directions[direction];
                        var g = defs.append('linearGradient')
                            .attr('id', 'shadow-gradient-' + direction)
                            .attr('x1', coords.x1)
                            .attr('y1', coords.y1)
                            .attr('x2', coords.x2)
                            .attr('y2', coords.y2);
                        g.append('stop')
                            .attr('class', 'floating-axes_shadow-start')
                            .attr('offset', '0%')
                            .attr('stop-color', SHADOW_COLOR_0)
                            .attr('stop-opacity', SHADOW_OPACITY_0);
                        g.append('stop')
                            .attr('class', 'floating-axes_shadow-end')
                            .attr('offset', '100%')
                            .attr('stop-color', SHADOW_COLOR_1)
                            .attr('stop-opacity', SHADOW_OPACITY_1);
                    });

                    // Move axes into Floating Axes container
                    var getAxesSelector = function (axis) {
                        var axisPart = '> .' + axis + '.axis.tau-active';
                        var rootPart = '.frame-root.tau-active ';
                        return [
                            rootPart + axisPart,
                            rootPart + '.cell.tau-active ' + axisPart
                        ].join(', ');
                    };
                    var xSel = srcSvg.selectAll(getAxesSelector('x'));
                    var ySel = srcSvg.selectAll(getAxesSelector('y'));

                    var xAxesInfo = extractAxesInfo(xSel);
                    var yAxesInfo = extractAxesInfo(ySel);

                    var maxYAxesX = mmax(yAxesInfo.map(function (info) {
                        return info.translate.x;
                    })) + 1;
                    var minXAxesY = mmin(xAxesInfo.map(function (info) {
                        return info.translate.y;
                    })) - 1;

                    var scrollRect = root.getBoundingClientRect();
                    var scrollbars = tauCharts.api.globalSettings.getScrollbarSize(root);
                    var visibleWidth = scrollRect.width;
                    var visibleHeight = scrollRect.height;

                    var getPositions = function () {
                        return {
                            scrollLeft: root.scrollLeft,
                            scrollTop: root.scrollTop,
                            visibleWidth: scrollRect.width,
                            visibleHeight: scrollRect.height,
                            scrollbarWidth: scrollbars.width,
                            scrollbarHeight: scrollbars.height,
                            svgWidth: Number(srcSvg.attr('width')),
                            svgHeight: Number(srcSvg.attr('height')),
                            minXAxesY: minXAxesY,
                            maxYAxesX: maxYAxesX
                        };
                    };

                    var animationSpeed = chart.configGPL.settings.animationSpeed;

                    this.handlers = [
                        extractXAxes(getPositions, srcSvg, xAxesInfo, animationSpeed),
                        extractYAxes(getPositions, srcSvg, yAxesInfo, animationSpeed),
                        extractCorner(getPositions, srcSvg),
                        createShadows(getPositions, srcSvg)
                    ];

                    this.handlers.forEach(function (item) {
                        root.addEventListener('scroll', item.handler, false);
                    });
                }
            },

            onBeforeRender: function () {
                this.recycle();
            }
        };
    }

    tauCharts.api.plugins.add('floating-axes', floatingAxes);

    return floatingAxes;
});