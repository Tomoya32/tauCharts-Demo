/*! tauCharts - v0.0.1 - 2014-10-10
* https://github.com/TargetProcess/tauCharts
* Copyright (c) 2014 Taucraft Limited; Licensed MIT */
(function(definition) {
    if (typeof define === "function" && define.amd) {
        define(definition);
    } else if (typeof module === "object" && module.exports) {
        module.exports = definition();
    } else {
        this.tauChart = definition();
    }
})(function() {
    var dsl$lang$$COORDS = {
        RECT: function(dim, tail) {
            var subUnits = _.isArray(tail) ? tail : [tail];
            var isFacet = (subUnits[0].type === 'COORDS.RECT');
            return {
                type: 'COORDS.RECT',
                guide: {
                    showGridLines: (isFacet ? '' : 'xy'),
                    padding: {L: 64, B: 32, R: 8, T: 8}
                },
                axes: dim,
                unit: subUnits
            };
        }
    };

    var dsl$lang$$DIM = function(x, y) {
        return [
            x ? {scaleDim: x} : null,
            y ? {scaleDim: y} : null
        ];
    };

    var dsl$lang$$ELEMENT = {
        POINT: function (x, y, color, size) {
            return {
                type: 'ELEMENT.POINT',
                x: x,
                y: y,
                color: color,
                size: size
            };
        }
    };

    var matrix$$TMatrix = (function () {

        var Matrix = function (r, c) {

            var args = _.toArray(arguments);
            var cube;

            if (_.isArray(args[0])) {
                cube = args[0];
            }
            else {
                cube = _.times(r, function () {
                    return _.times(c, function () {
                        return null;
                    });
                });
            }

            this.cube = cube;
        };

        Matrix.prototype = {

            iterate: function (iterator) {
                var cube = this.cube;
                _.each(cube, function (row, ir) {
                    _.each(row, function (colValue, ic) {
                        iterator(ir, ic, colValue);
                    });
                });
                return this;
            },

            getRC: function (r, c) {
                return this.cube[r][c];
            },

            setRC: function (r, c, val) {
                this.cube[r][c] = val;
                return this;
            },

            sizeR: function () {
                return this.cube.length;
            },

            sizeC: function () {
                var row = this.cube[0] || [];
                return row.length;
            }
        };

        return Matrix;

    })();

    var unit$visitor$factory$$TUnitVisitorFactory = (function () {

        var cloneObject = function(obj)  {return JSON.parse(JSON.stringify(obj))};

        var FacetAlgebra = {

            'CROSS': function (root, dimX, dimY) {

                var domainX = root.domain(dimX);
                var domainY = root.domain(dimY).reverse();

                return _(domainY).map(function(rowVal)  {
                    return _(domainX).map(function(colVal)  {

                        var r = {};

                        if (dimX) {
                            r[dimX] = colVal;
                        }

                        if (dimY) {
                            r[dimY] = rowVal;
                        }

                        return r;
                    });
                });
            }
        };

        var TFuncMap = function(opName)  {return FacetAlgebra[opName] || (function()  {return [[{}]]})};

        var TUnitMap = {

            'COORDS.RECT': function (unit, continueTraverse) {

                var root = _.defaults(
                    unit,
                    {
                        $where: {}
                    });

                root.axes = _(root.axes).map(function(axis, i)  {return _.defaults(axis || {}, {
                    scaleOrient: (i === 0 ? 'bottom' : 'left'),
                    padding: 0
                })});

                var isFacet = _.any(root.unit, function(n)  {return n.type.indexOf('COORDS.') === 0} );
                var unitFunc = TFuncMap(isFacet ? 'CROSS' : '');

                var matrixOfPrFilters = new matrix$$TMatrix(unitFunc(root, root.axes[0].scaleDim, root.axes[1].scaleDim));
                var matrixOfUnitNodes = new matrix$$TMatrix(matrixOfPrFilters.sizeR(), matrixOfPrFilters.sizeC());

                matrixOfPrFilters.iterate(function(row, col, $whereRC)  {
                    var cellWhere = _.extend({}, root.$where, $whereRC);
                    var cellNodes = _(root.unit).map(function(sUnit)  {
                        // keep arguments order. cloned objects are created
                        return _.extend(cloneObject(sUnit), { $where: cellWhere });
                    });
                    matrixOfUnitNodes.setRC(row, col, cellNodes);
                });

                root.$matrix = matrixOfUnitNodes;

                matrixOfUnitNodes.iterate(function(r, c, cellNodes)  {
                    _.each(cellNodes, function(refSubNode)  {return continueTraverse(refSubNode)});
                });

                return root;
            }
        };

        return function (unitType) {
            return TUnitMap[unitType] || (function(unit)  {return unit});
        };

    })();

    var node$visitor$factory$$TNodeVisitorFactory = (function () {

        var translate = function(left, top)  {return 'translate(' + left + ',' + top + ')'};

        var fnDrawDimAxis = function (x, AXIS_POSITION, CSS_CLASS) {
            var container = this;
            if (x.scaleDim) {
                container
                    .append('g')
                    .attr('class', CSS_CLASS)
                    .attr('transform', translate.apply(null, AXIS_POSITION))
                    .call(d3.svg.axis().scale(x.scale).orient(x.scaleOrient));
            }
        };

        var fnDrawGrid = function (node, H, W) {

            var container = this;

            var grid = container
                .append('g')
                .attr('class', 'grid')
                .attr('transform', translate(0, 0));

            var linesOptions = (node.guide.showGridLines || '').toLowerCase();
            if (linesOptions.length > 0) {

                var gridLines = grid.append('g').attr('class', 'grid-lines');

                if ((linesOptions.indexOf('x') > -1) && node.axes[0]) {
                    var x = node.axes[0];
                    var xGridAxis = d3
                        .svg
                        .axis()
                        .scale(x.scale)
                        .orient(x.scaleOrient)
                        .tickSize(H);

                    gridLines.append('g').call(xGridAxis);
                }

                if ((linesOptions.indexOf('y') > -1) && node.axes[1]) {
                    var y = node.axes[1];
                    var yGridAxis = d3
                        .svg
                        .axis()
                        .scale(y.scale)
                        .orient(y.scaleOrient)
                        .tickSize(-W);

                    gridLines.append('g').call(yGridAxis);
                }

                // TODO: make own axes and grid instead of using d3's in such tricky way
                gridLines.selectAll('text').remove();
            }

            return grid;
        };

        var TNodeMap = {

            'COORDS.RECT': function (node, continueTraverse) {

                var options = node.options;
                var padding = node.guide.padding;

                var axes = _(node.axes).map(function (axis, i) {
                    var a = _.isArray(axis) ? axis : [axis];
                    a[0] = _.defaults(
                        a[0] || {},
                        {
                            scaleOrient: (i === 0 ? 'bottom' : 'left'),
                            padding: 0
                        });
                    return a;
                });

                var x = axes[0][0];
                var y = axes[1][0];

                var L = options.left + padding.L;
                var T = options.top + padding.T;

                var W = options.width - (padding.L + padding.R);
                var H = options.height - (padding.T + padding.B);

                var xScale = x.scaleDim && node.scaleTo(x, [0, W]);
                var yScale = y.scaleDim && node.scaleTo(y, [H, 0]);

                axes[0][0].scale = xScale;
                axes[1][0].scale = yScale;

                var X_AXIS_POS = [0, H + x.padding];
                var Y_AXIS_POS = [0 - y.padding, 0];

                var container = options
                    .container
                    .append('g')
                    .attr('class', 'cell')
                    .attr('transform', translate(L, T));

                if (!x.hide) {
                    fnDrawDimAxis.call(container, x, X_AXIS_POS, 'x axis');
                }

                if (!y.hide) {
                    fnDrawDimAxis.call(container, y, Y_AXIS_POS, 'y axis');
                }

                var grid = fnDrawGrid.call(container, node, H, W);

                node.$matrix.iterate(function(iRow, iCol, subNodes)  {
                    subNodes.forEach(function(node)  {
                        node.options = _.extend({container: grid}, node.options);
                        continueTraverse(node);
                    });
                });
            },

            'ELEMENT.POINT': function (node) {

                var filteredData = node.partition();
                var srcData = node.source();
                var defaultRange = ['color10-1', 'color10-2', 'color10-3', 'color10-4', 'color10-5', 'color10-6', 'color10-7', 'color10-8', 'color10-9', 'color10-10'];
                var getDefaultDomain = function () {
                    return _(srcData).chain().pluck(node.color).uniq().value();
                };

                var options = node.options || {};
                options.xScale = node.scaleTo(node.x, [0, options.width]);
                options.yScale = node.scaleTo(node.y, [options.height, 0]);

                var range, domain, colorDim;
                colorDim = node.color;
                if (_.isObject(node.color)) {
                    range = node.color.range || defaultRange;
                    domain = node.color.domain || getDefaultDomain();
                    colorDim = node.color.dimension;
                } else {
                    range = defaultRange;
                    domain = getDefaultDomain();
                }
                var color = d3.scale
                    .ordinal()
                    .range(range)
                    .domain(domain);
                var maxAxis = _.max([options.width, options.height]);
                var sizeValues = _(srcData).chain().pluck(node.size);
                var size = d3
                    .scale
                    .linear()
                    .range([maxAxis/200, maxAxis/100])
                    .domain([
                        sizeValues.min().value(),
                        sizeValues.max().value()
                    ]);

                var update = function () {
                    return this
                        .attr('r', function (d) {
                            var s = size(d[node.size]);
                            if (_.isNaN(s)) {
                                s = maxAxis / 100;
                            }
                            return s;
                        })
                        .attr('class', function (d) {
                            return 'dot i-role-datum ' + color(d[colorDim]);
                        })
                        .attr('cx', function (d) {
                            return options.xScale(d[node.x]);
                        })
                        .attr('cy', function (d) {
                            return options.yScale(d[node.y]);
                        });
                };

                var elements = options.container.selectAll('.dot').data(filteredData);
                elements.call(update);
                elements.exit().remove();
                elements.enter().append('circle').call(update);
            },

            'ELEMENT.INTERVAL': function (node) {

                var options = node.options || {};
                options.xScale = node.scaleTo(node.x, [0, options.width]);
                options.yScale = node.scaleTo(node.y, [options.height, 0]);

                var update = function () {
                    return this
                        .attr('class', 'i-role-datum  bar')
                        .attr('x', function (d) {
                            return options.xScale(d[node.x]);
                        })
                        .attr('width', options.xScale.rangeBand())
                        .attr('y', function (d) {
                            return options.yScale(d[node.y]);
                        })
                        .attr('height', function (d) {
                            return options.height - options.yScale(d[node.y]);
                        });
                };


                var elements = options.container.selectAll(".bar").data(node.partition());
                elements.call(update);
                elements.enter().append('rect').call(update);
                elements.exit().remove();
            },

            'ELEMENT.LINE': function (node) {

                var options = node.options || {};
                options.xScale = node.scaleTo(node.x, [0, options.width]);
                options.yScale = node.scaleTo(node.y, [options.height, 0]);

                var line = d3
                    .svg
                    .line()
                    .x(function (d) {
                        return options.xScale(d[node.x]);
                    })
                    .y(function (d) {
                        return options.yScale(d[node.y]);
                    });

                options.container
                    .append('g')
                    .attr("class", "line")
                    .attr('stroke', '#4daf4a')
                    .append("path")
                    .datum(node.partition())
                    .attr("d", line);
            },

            'WRAP.AXIS': function (node, continueTraverse) {

                var options = node.options;
                var padding = node.guide.padding;

                var axes = _(node.axes).map(function (axis, i) {
                    var a = _.isArray(axis) ? axis : [axis];
                    a[0] = _.defaults(
                        a[0] || {},
                        {
                            scaleOrient: (i === 0 ? 'bottom' : 'left'),
                            padding: 0
                        });
                    return a;
                });

                var x = axes[0][0];
                var y = axes[1][0];

                var L = options.left + padding.L;
                var T = options.top + padding.T;

                var W = options.width - (padding.L + padding.R);
                var H = options.height - (padding.T + padding.B);

                var xScale = x.scaleDim && node.scaleTo(x, [0, W]);
                var yScale = y.scaleDim && node.scaleTo(y, [H, 0]);

                axes[0][0].scale = xScale;
                axes[1][0].scale = yScale;

                var X_AXIS_POS = [0, H + x.padding];
                var Y_AXIS_POS = [0 - y.padding, 0];

                var container = options
                    .container
                    .append('g')
                    .attr('class', 'axis-container')
                    .attr('transform', translate(L, T));

                if (options.showX && !x.hide) {
                    fnDrawDimAxis.call(container, x, X_AXIS_POS, 'x axis');
                }

                if (options.showY && !y.hide) {
                    fnDrawDimAxis.call(container, y, Y_AXIS_POS, 'y axis');
                }

                var grid = container
                    .append('g')
                    .attr('class', 'sub-axis-container')
                    .attr('transform', translate(0, 0));

                var nRows = node.$axes.sizeR();
                var nCols = node.$axes.sizeC();

                node.$axes.iterate(function(iRow, iCol, subNodes)  {
                    if (iCol === 0 || (iRow === (nRows - 1))) {
                        subNodes.forEach(function(node)  {
                            node.options = _.extend(
                                {
                                    container: grid
                                },
                                node.options || {});

                            if (node.$axes) {
                                continueTraverse(node);
                            }
                        });
                    }
                });
            },

            'WRAP.MULTI_AXES': function (node, continueTraverse) {
                var options = node.options;
                var padding = node.guide.padding;

                var L = options.left + padding.L;
                var T = options.top + padding.T;

                var W = options.width - (padding.L + padding.R);
                var H = options.height - (padding.T + padding.B);

                var container = options
                    .container
                    .append('g')
                    .attr('class', 'cell-wrapper')
                    .attr('transform', translate(L, T));

                node.$axes.iterate(function(r, c, subAxesNodes)  {
                    subAxesNodes.forEach(function(node)  {
                        node.options = _.extend({container: container}, node.options);
                        continueTraverse(node);
                    });
                });

                node.$matrix.iterate(function(r, c, subNodes)  {
                    subNodes.forEach(function(node)  {
                        node.options = _.extend({container: container}, node.options);
                        continueTraverse(node);
                    });
                });
            },

            'WRAP.MULTI_GRID': function (node, continueTraverse) {
                var options = node.options;
                var padding = node.guide.padding;

                var L = options.left + padding.L;
                var T = options.top + padding.T;

                var grid = options
                    .container
                    .append('g')
                    .attr('class', 'grid-wrapper')
                    .attr('transform', translate(L, T));

                node.$matrix.iterate(function(r, c, subNodes)  {
                    subNodes.forEach(function(node)  {
                        node.options = _.extend({container: grid}, node.options);
                        continueTraverse(node);
                    });
                });
            }
        };

        return function (unitType) {

            if (!TNodeMap.hasOwnProperty(unitType)) {
                throw new Error('Unknown unit type: ' + unitType);
            }

            return TNodeMap[unitType];
        };

    })();

    var unit$domain$mixin$$SCALE_STRATEGIES = {
        'ordinal': function(domain)  {return domain},
        'linear': function(domain)  {return d3.extent(domain)}
    };

    var unit$domain$mixin$$getRangeMethod = function(scaleType)  {return (scaleType === 'ordinal') ? 'rangeRoundBands' : 'rangeRound'} ;

    var unit$domain$mixin$$UnitDomainMixin = (function(){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};

        function UnitDomainMixin(meta, data) {var this$0 = this;

            this.fnSource = function(whereFilter)  {return _(data).where(whereFilter || {})};

            // TODO: memoize
            this.fnDomain = function(dim)  {return _(data).chain().pluck(dim).uniq().value()};

            this.fnScaleTo = function(scaleDim, interval)  {
                var temp = _.isString(scaleDim) ? {scaleDim: scaleDim} : scaleDim;
                var dimx = _.defaults(temp, meta[temp.scaleDim]);
                var type = dimx.scaleType;
                var vals = this$0.fnDomain(dimx.scaleDim);

                var rangeMethod = unit$domain$mixin$$getRangeMethod(type);
                var domainParam = unit$domain$mixin$$SCALE_STRATEGIES[type](vals);

                return d3.scale[type]().domain(domainParam)[rangeMethod](interval, 0.1);
            };
        }DP$0(UnitDomainMixin,"prototype",{"configurable":false,"enumerable":false,"writable":false});

        proto$0.mix = function(unit) {
            unit.source = this.fnSource;
            unit.domain = this.fnDomain;
            unit.scaleTo = this.fnScaleTo;
            unit.partition = (function()  {return unit.source(unit.$where)});

            return unit;
        };
    MIXIN$0(UnitDomainMixin.prototype,proto$0);proto$0=void 0;return UnitDomainMixin;})();var dsl$reader$$DSLReader = (function(){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};

        function DSLReader (spec, data) {
            this.spec = spec;
            this.domain = new unit$domain$mixin$$UnitDomainMixin(this.spec.dimensions, data);
        }DP$0(DSLReader,"prototype",{"configurable":false,"enumerable":false,"writable":false});

        proto$0.buildGraph = function() {var this$0 = this;
            var buildRecursively = function(unit)  {return unit$visitor$factory$$TUnitVisitorFactory(unit.type)(this$0.domain.mix(unit), buildRecursively)};
            return buildRecursively(this.spec.unit);
        };

        proto$0.calcLayout = function(graph, layoutEngine, size) {

            graph.options = {
                top: 0,
                left: 0,
                width: size.width,
                height: size.height
            };

            return layoutEngine(graph, this.domain);
        };

        proto$0.renderGraph = function(styledGraph, target) {var this$0 = this;

            styledGraph.options.container = target;

            var renderRecursively = function(unit)  {return node$visitor$factory$$TNodeVisitorFactory(unit.type)(this$0.domain.mix(unit), renderRecursively)};

            renderRecursively(styledGraph);
            return styledGraph.options.container;
        };
    MIXIN$0(DSLReader.prototype,proto$0);proto$0=void 0;return DSLReader;})();
    var layout$engine$factory$$this$0 = this;

    var layout$engine$factory$$cloneNodeSettings = function(node)  {
        var obj = _.omit(node, '$matrix');
        return JSON.parse(JSON.stringify(obj));
    };

    var layout$engine$factory$$applyNodeDefaults = function(node)  {
        node.options = node.options || {};
        node.guide = node.guide || {};
        node.guide.padding = _.defaults(
            node.guide.padding || {},
            {L: 0, B: 0, R: 0, T: 0});

        return node;
    };

    var layout$engine$factory$$fnDefaultLayoutEngine = function(rootNode, domainMixin)  {

        var fnTraverseLayout = function(rawNode)  {

            var node = layout$engine$factory$$applyNodeDefaults(rawNode);

            if (!node.$matrix) {
                return node;
            }

            var options = node.options;
            var padding = node.guide.padding;

            var innerW = options.width - (padding.L + padding.R);
            var innerH = options.height - (padding.T + padding.B);

            var nRows = node.$matrix.sizeR();
            var nCols = node.$matrix.sizeC();

            var cellW = innerW / nCols;
            var cellH = innerH / nRows;

            node.$matrix.iterate(function(iRow, iCol, subNodes)  {
                _.each(
                    subNodes,
                    function(node)  {
                        node.options = {
                            width: cellW,
                            height: cellH,
                            top: iRow * cellH,
                            left: iCol * cellW
                        };
                        fnTraverseLayout(node);
                    });
            });

            return node;
        };

        return fnTraverseLayout(rootNode);
    };

    var layout$engine$factory$$LayoutEngineTypeMap = {

        'DEFAULT': layout$engine$factory$$fnDefaultLayoutEngine,

        'EXTRACT-AXES': function(rootNode, domainMixin)  {

            var fnExtractAxesTransformation = (function(root)  {

                var traverse = (function(rootNode, wrapperNode)  {

                    var node = layout$engine$factory$$applyNodeDefaults(rootNode);

                    _.each(node.axes, function(a, i)  {return a.hide = true});

                    var nRows = node.$matrix.sizeR();
                    var nCols = node.$matrix.sizeC();

                    wrapperNode.$axes = new matrix$$TMatrix(nRows, nCols);

                    node.$matrix.iterate(function(r, c, subNodes)  {

                        var axesMap = [];
                        wrapperNode.$axes.setRC(r, c, axesMap);

                        var isHeadCol = (c === 0);
                        var isTailRow = (r === (nRows - 1));

                        subNodes.forEach(function(subNode)  {
                            var node = layout$engine$factory$$applyNodeDefaults(subNode);
                            if (node.$matrix) {
                                var axis = _.extend(layout$engine$factory$$cloneNodeSettings(node), { type: 'WRAP.AXIS' });
                                axesMap.push(axis);

                                node.guide.padding.L = 0;
                                node.guide.padding.B = 0;

                                axis.guide.padding.L = (isHeadCol ? axis.guide.padding.L : 0);
                                axis.guide.padding.B = (isTailRow ? axis.guide.padding.B : 0);

                                traverse(node, axis);
                            }
                        });
                    });

                    return node;
                });

                var wrapperNode = layout$engine$factory$$applyNodeDefaults({
                    type: 'WRAP.MULTI_AXES',
                    options: layout$engine$factory$$cloneNodeSettings(root.options),
                    $matrix: new matrix$$TMatrix([[[root]]])
                });

                traverse(domainMixin.mix(wrapperNode), wrapperNode);

                wrapperNode.$matrix = new matrix$$TMatrix([
                    [
                        [
                            layout$engine$factory$$applyNodeDefaults({
                                type: 'WRAP.MULTI_GRID',
                                $matrix: new matrix$$TMatrix([[[root]]])
                            })
                        ]
                    ]
                ]);

                return wrapperNode;
            });

            var fnTraverseExtAxesLayout = function(wrapperNode)  {

                var multiAxisDecorator = function(node)  {

                    var options = node.options;
                    var padding = node.guide.padding;

                    var innerW = options.width - (padding.L + padding.R);
                    var innerH = options.height - (padding.T + padding.B);

                    var nR = node.$axes.sizeR();
                    var nC = node.$axes.sizeC();

                    var leftBottomItem = layout$engine$factory$$applyNodeDefaults(node.$axes.getRC(nR - 1, 0)[0] || {});
                    var lPadding = leftBottomItem.guide.padding.L;
                    var bPadding = leftBottomItem.guide.padding.B;

                    var sharedWidth = (innerW - lPadding);
                    var sharedHeight = (innerH - bPadding);

                    var cellW = sharedWidth / nC;
                    var cellH = sharedHeight / nR;

                    node.$axes.iterate(function(iRow, iCol, subNodes)  {

                        var isHeadCol = (iCol === 0);
                        var isTailRow = (iRow === (nR - 1));

                        if (isHeadCol || isTailRow) {

                            subNodes.forEach(function(node)  {
                                node.options = {
                                    showX: isTailRow,
                                    showY: isHeadCol,

                                    width : cellW + (isHeadCol ? lPadding: 0),
                                    height: cellH + (isTailRow ? bPadding: 0),

                                    top : iRow * cellH,
                                    left: iCol * cellW + (isHeadCol ? 0 : lPadding)
                                };

                                if (node.$axes) {
                                    multiAxisDecorator(node);
                                }
                            });
                        }
                    });

                    return node;
                };

                multiAxisDecorator(wrapperNode);

                var gridL = 0;
                var gridB = 0;
                var axisOffsetTraverser = function(node)  {
                    var padding = node.guide.padding;
                    var nR = node.$axes.sizeR();
                    node.$axes.iterate(function(iRow, iCol, subNodes)  {
                        if (iCol === 0 && (iRow === (nR - 1))) {
                            gridL += padding.L;
                            gridB += padding.B;
                            subNodes.forEach(function(node)  {return axisOffsetTraverser(node)});
                        }
                    });

                    return node;
                };

                axisOffsetTraverser(wrapperNode);

                var gridW = wrapperNode.options.width - gridL;
                var gridH = wrapperNode.options.height - gridB;

                var refRoot = wrapperNode.$matrix.getRC(0, 0)[0];
                refRoot.options = {
                    top: 0,
                    left: gridL,
                    width: gridW,
                    height: gridH
                };

                layout$engine$factory$$fnDefaultLayoutEngine(refRoot, domainMixin);

                return wrapperNode;
            };

            return (fnTraverseExtAxesLayout(fnExtractAxesTransformation(rootNode)));
        }
    };

    var layout$engine$factory$$LayoutEngineFactory = {

        get: function(typeName)  {
            return (layout$engine$factory$$LayoutEngineTypeMap[typeName] || layout$engine$factory$$LayoutEngineTypeMap.DEFAULT).bind(layout$engine$factory$$this$0);
        }

    };

    var plugins$$PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var plugins$$DP$0 = Object.defineProperty;var plugins$$GOPD$0 = Object.getOwnPropertyDescriptor;//plugins
    var plugins$$MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){plugins$$DP$0(t,p,plugins$$GOPD$0(s,p));}}return t};
    /** @class
     * @extends Plugin */
    var plugins$$Plugins = (function(){"use strict";var proto$0={};
        /** @constructs */
        function Plugins(plugins) {
            this._plugins = plugins;
        }plugins$$DP$0(Plugins,"prototype",{"configurable":false,"enumerable":false,"writable":false});

        proto$0._call = function(name, args) {
            for (var i = 0; i < this._plugins.length; i++) {
                if (typeof(this._plugins[i][name]) == 'function') {
                    this._plugins[i][name].apply(this._plugins[i], args);
                }
            }
        };

        proto$0.render = function(context, tools) {
            this._call('render', arguments);
        };

        proto$0.click = function(context, tools) {
            this._call('click', arguments);
        };

        proto$0.mouseover = function(context, tools) {
            this._call('mouseover', arguments);
        };

        proto$0.mouseout = function(context, tools) {
            this._call('mouseout', arguments);
        };

        proto$0.mousemove = function(context, tools) {
            this._call('mousemove', arguments);
        };
    plugins$$MIXIN$0(Plugins.prototype,proto$0);proto$0=void 0;return Plugins;})();


    var plugins$$propagateDatumEvents = function (plugins) {
        return function () {
            this
                .on('click', function (d) {
                    plugins.click(new plugins$$ElementContext(d), new plugins$$ChartElementTools(d3.select(this)));
                })
                .on('mouseover', function (d) {
                    plugins.mouseover(new plugins$$ElementContext(d), new plugins$$ChartElementTools(d3.select(this)));
                })
                .on('mouseout', function (d) {
                    plugins.mouseout(new plugins$$ElementContext(d), new plugins$$ChartElementTools(d3.select(this)));
                })
                .on('mousemove', function (d) {
                    plugins.mousemove(new plugins$$ElementContext(d), new plugins$$ChartElementTools(d3.select(this)));
                });
        };
    };

    /** @class ChartElementTools*/
    var plugins$$ChartElementTools = (function(){"use strict";
        /** @constructs */
            function ChartElementTools(element) {
            this.element = element;
        }plugins$$DP$0(ChartElementTools,"prototype",{"configurable":false,"enumerable":false,"writable":false});
    ;return ChartElementTools;})();

    /** @class RenderContext*/
    var plugins$$RenderContext = (function(){"use strict";
        /** @constructs */
        function RenderContext(dataSource) {
            this.data = dataSource;
        }plugins$$DP$0(RenderContext,"prototype",{"configurable":false,"enumerable":false,"writable":false});
    ;return RenderContext;})();

    /** @class ElementContext */
    var plugins$$ElementContext = (function(){"use strict";
        /**
         * @constructs
         * @param datum
         *
         * */
         function ElementContext(datum) {
            this.datum = datum;
        }plugins$$DP$0(ElementContext,"prototype",{"configurable":false,"enumerable":false,"writable":false});
    ;return ElementContext;})();

    /** @class ChartTools */
    var plugins$$ChartTools = (function(){"use strict";var proto$0={};
        /**
         * @constructs
         * @param {ChartLayout} layout
         * @param {Mapper} mapper
         **/
         function ChartTools(layout, mapper) {
            this.svg = layout.svg;
            this.html = layout.html;
            this.mapper = mapper;
        }plugins$$DP$0(ChartTools,"prototype",{"configurable":false,"enumerable":false,"writable":false});

        proto$0.elements = function() {
            return this.svg.selectAll('.i-role-datum');
        };
    plugins$$MIXIN$0(ChartTools.prototype,proto$0);proto$0=void 0;return ChartTools;})();

    var charts$tau$chart$$Chart = (function(){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};
        function Chart(config) {

            var chartConfig = this.convertConfig(config);

            if (!chartConfig.spec.dimensions) {
                chartConfig.spec.dimensions = this._autoDetectDimensions(chartConfig.data);
            }

            this.config = _.defaults(chartConfig, {
                spec: null,
                data: [],
                plugins: []
            });
            this.plugins = this.config.plugins;
            this.spec = this.config.spec;
            this.data = this.config.data;

            this.reader = new dsl$reader$$DSLReader(this.spec, this.data);
            this.graph = this.reader.buildGraph();

            //plugins
            this._plugins = new plugins$$Plugins(this.config.plugins);
        }DP$0(Chart,"prototype",{"configurable":false,"enumerable":false,"writable":false});

        proto$0.renderTo = function(target, xSize) {

            var size = xSize || {};
            var container = d3.select(target);

            var h = size.hasOwnProperty('height') ? size.height : container.offsetHeight;
            var w = size.hasOwnProperty('width') ? size.width : container.offsetWidth;

            var layoutXGraph = this.reader.calcLayout(
                this.graph,
                layout$engine$factory$$LayoutEngineFactory.get('EXTRACT-AXES'),
                {
                    width: w,
                    height: h
                });

            var layoutCanvas = this.reader.renderGraph(
                layoutXGraph,
                container.append("svg").style("border", 'solid 1px').attr("width", w).attr("height", h));

            //plugins
            layoutCanvas.selectAll('.i-role-datum').call(plugins$$propagateDatumEvents(this._plugins));
        };

        proto$0._autoDetectDimensions = function(data) {
            function detectType(value) {
                return _.isNumber(value) ? 'linear' : 'ordinal';
            }

            return _.reduce(data, function(dimensions, item) {
                _.each(item, function (value, key) {
                    if (dimensions[key]) {
                        if (dimensions[key].scaleType == detectType(value)) {
                            dimensions[key].scaleType = detectType(value);
                        } else {
                            dimensions[key].scaleType = 'ordinal';
                        }
                    } else {
                        dimensions[key] = {scaleType: detectType(value)};
                    }
                });
                return dimensions;
            }, {});
        };

        proto$0.convertConfig = function(config) {
            return config;
        };
    MIXIN$0(Chart.prototype,proto$0);proto$0=void 0;return Chart;})();

    function charts$tau$scatterplot$$convertAxis(data) {
        if(!data) {
            return null;
        }
        return {scaleDim: data};
    }
    var charts$tau$scatterplot$$Scatterplot = (function(super$0){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var SP$0 = Object.setPrototypeOf||function(o,p){if(PRS$0){o["__proto__"]=p;}else {DP$0(o,"__proto__",{"value":p,"configurable":true,"enumerable":false,"writable":true});}return o};var OC$0 = Object.create;function Scatterplot() {super$0.apply(this, arguments)}if(!PRS$0)MIXIN$0(Scatterplot, super$0);if(super$0!==null)SP$0(Scatterplot,super$0);Scatterplot.prototype = OC$0(super$0!==null?super$0.prototype:null,{"constructor":{"value":Scatterplot,"configurable":true,"writable":true}});DP$0(Scatterplot,"prototype",{"configurable":false,"enumerable":false,"writable":false});var proto$0={};
        proto$0.convertConfig = function(config) {
            var chartConfig = _.omit(config, 'spec');
            chartConfig.spec = {
                dimensions: config.dimensions,
                unit:{
                    type: 'COORDS.RECT',
                    axes: [
                        charts$tau$scatterplot$$convertAxis(config.x),
                        charts$tau$scatterplot$$convertAxis(config.y)
                    ],
                    guide: {
                        padding: { L:24, B:24, R:24, T:24 },
                        showGridLines: 'xy'
                    },
                    unit: [
                        {
                            type: 'ELEMENT.POINT',
                            x: config.x,
                            y: config.y,
                            color: config.color,
                            size: config.size
                        }
                    ]
                }

            };
            return chartConfig;
        };
    MIXIN$0(Scatterplot.prototype,proto$0);proto$0=void 0;return Scatterplot;})(charts$tau$chart$$Chart);


    var tau$newCharts$$tauChart = {
        Chart: charts$tau$chart$$Chart,
        Scatterplot: charts$tau$scatterplot$$Scatterplot,

        __api__: {
            UnitDomainMixin: unit$domain$mixin$$UnitDomainMixin,
            DSLReader: dsl$reader$$DSLReader
        }
    };

    "use strict";
    return tau$newCharts$$tauChart;
});