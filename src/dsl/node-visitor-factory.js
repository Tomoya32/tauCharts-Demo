var TNodeVisitorFactory = (function () {

    var translate = (left, top) => {
        return 'translate(' + left + ',' + top + ')';
    };

    var getRangeMethod = function (scaleType) {
        return ((scaleType === 'ordinal') ? 'rangeRoundBands' : 'rangeRound');
    };

    var fnDrawDimAxis = function(x, AXIS_POSITION, CSS_CLASS) {
        var container = this;
        if (x.scaleDim) {
            container
                .append('g')
                .attr('class', CSS_CLASS)
                .attr('transform', translate.apply(null, AXIS_POSITION))
                .call(d3.svg.axis().scale(x.scale).orient(x.scaleOrient));
        }
    };

    var fnDrawGrid = function(node, H, W) {

        var container = this;

        var grid = container
            .append('g')
            .attr('class', 'grid')
            .attr('transform', translate(0, 0));

        var linesOptions = (node.showGridLines || '').toLowerCase();
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

    var getBubbleAxis = function (node) {
        var cube = node.$matrix.cube[0];
        if (cube && cube[0] && cube[0][0].axes && cube[0][0].axes[0] && cube[0][0].axes[0].bubble) {
            return {
                $scales: cube[0][0].$scales,
                axes: cube[0][0].axes
            };
        } else {
            return {axes: []};
        }
    };

    var drawNestedAxes = function (nestedAxesConfig, container, srcData, dimensions, sizes) {
        container = container.append('g').attr("class", "axes nest");
        var nestedAxes = nestedAxesConfig;
        var groupX = _.chain(srcData).map(function (item) {
            return item[dimensions.x];
        }).unique().value();

        var groupY = _.chain(srcData).map(function (item) {
            return item[dimensions.y];
        }).unique().value();


        var xs = nestedAxes.axes[0];
        var xScales = nestedAxes.$scales[xs.scaleDim][getRangeMethod(xs.scaleType)]([0, sizes.width - sizes.paddingX*2], 0.1);
        // xScales.
        container.selectAll(".x.axis.nest")
            .data(groupX)
            .enter().append("g")
            .attr("class", "x axis nest")
            .attr("transform", function (d, ind) {
                return "translate(" + ((ind) * sizes.width + sizes.paddingY) + "," + sizes.containerHeight + ")";
            })
            .each(function (d) {
                d3.select(this).call(d3.svg.axis().scale(xScales).orient('bottom'));
            }
        );
        var ys = nestedAxes.axes[1];
        var yScales = nestedAxes.$scales[ys.scaleDim][getRangeMethod(ys.scaleType)]([sizes.height - sizes.paddingY*2, 0], 0.1);
        container.selectAll(".y.axis.nest")
            .data(groupY)
            .enter().append("g")
            .attr("class", "y axis nest")
            .attr("transform", function (d, ind) {
                return "translate(" + 0 + "," + (ind * sizes.height + sizes.paddingY/2) + ")";
            })
            .each(function (d) {
                d3.select(this).call(d3.svg.axis().scale(yScales).orient('left'));
            }
        );
    };

    var TNodeMap = {

        'COORDS/RECT': function (node, continueTraverse) {

            var options = node.options || {};
            var axes = node.axes;
            var x = _.defaults(axes[0] || {}, {scaleOrient: 'bottom'});
            var y = _.defaults(axes[1] || {}, {scaleOrient: 'left'});
            var PX = 36;
            var PY = 18;
            var paddingForNestedX = 5;
            var paddingForNestedY = 5;
            var bubbleAxes = getBubbleAxis(node);
            var existBubbleAxes = bubbleAxes.axes.length;
            if (x.bubble === true && y.bubble === true) {
                PX = paddingForNestedX;
                PY = paddingForNestedY;
            } else {
                if (existBubbleAxes) {
                    PX = 56;
                    PY = 30;
                }
            }
            var W = options.width - 2 * PX;
            var H = options.height - 2 * PY;


            this.container = options
                .container
                .append('g')
                .attr('class', 'cell')
                .attr('transform', translate(options.left + PX, options.top + PY / 2));


            var xScale;
            if (x.scaleDim) {
                xScale = node.$scales[x.scaleDim][getRangeMethod(x.scaleType)]([0, W], 0.1);
                if (x.bubble !== true) {
                    var xAxis = d3.svg.axis().scale(xScale).orient(x.scaleOrient);
                    this.container
                        .append('g')
                        .attr('class', 'x axis nest')
                        .attr('transform', translate(0, H + 25))
                        .call(xAxis);
                }
            }

            var yScale;
            if (y.scaleDim) {
                yScale = node.$scales[y.scaleDim][getRangeMethod(y.scaleType)]([H, 0], 0.1);
                if (y.bubble !== true) {
                    var yAxis = d3.svg.axis().scale(yScale).orient(y.scaleOrient);
                    this.container
                        .append('g')
                        .attr('class', 'y axis')
                        .attr('transform', translate(-25, 0))
                        .call(yAxis);
                }
            }

            if (node.showGrid) {

                var grids = this.container.insert('g', ':first-child').attr('class', 'grids');

                if (xScale) {
                    var xGridAxis = d3.svg.axis()
                        .scale(xScale)
                        .orient(x.scaleOrient)
                        .tickSize(H);

                    grids.append('g').call(xGridAxis);
                }

                if (yScale) {
                    var yGridAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient(y.scaleOrient)
                        .tickSize(-W);

                    grids.append('g').call(yGridAxis);
                }

                // TODO: make own axes and grid instead of using d3's in such tricky way
                grids.selectAll('text').remove();
            }

            var grid = this.container
                .append('g')
                .attr('class', 'grid')
                .attr('transform', translate(0, 0));

            var nR = node.$matrix.sizeR();
            var nC = node.$matrix.sizeC();

            var cellW = W / nC;
            var cellH = H / nR;
            if(existBubbleAxes) {
                drawNestedAxes(
                    bubbleAxes,
                    this.container,
                    node.partition(),
                    {
                        x: x.scaleDim,
                        y: y.scaleDim
                    },
                    {
                        width: cellW,
                        height: cellH,
                        containerHeight: H,
                        paddingX:paddingForNestedX,
                        paddingY:paddingForNestedY
                    }
                );
            }


            node.$matrix.iterate(function (iRow, iCol, subNodes) {
                subNodes.forEach(function (node) {

                    node.options = {
                        container: grid,
                        width: cellW,
                        height: cellH,
                        top: iRow * cellH,
                        left: iCol * cellW,
                        xScale: xScale,
                        yScale: yScale
                    };

                    continueTraverse(node);
                });
            });
        },

        'COORDS.RECT': function (node, continueTraverse) {

            var options = node.options || {};
            var axes = _(node.axes).map(function(axis, i) {
                var a = _.isArray(axis) ? axis : [axis];
                a[0] = _.defaults(
                    a[0] || {},
                    {
                        scaleOrient: (i === 0 ? 'bottom' : 'left'),
                        lwidth: 0,
                        rwidth: 0,
                        padding: 0
                    });
                return a;
            });

            var x = axes[0][0];
            var y = axes[1][0];

            var T = options.top  + _(axes[0]).reduce((memo, x) => memo + x.rwidth, 0);
            var L = options.left + _(axes[1]).reduce((memo, y) => memo + y.lwidth + y.padding, 0);

            var fnPaddings = (memo, a) => memo + a.lwidth + a.rwidth + a.padding;

            var W = options.width  - _(axes[1]).reduce(fnPaddings, 0);
            var H = options.height - _(axes[0]).reduce(fnPaddings, 0);

            var xScale = x.scaleDim && node.scale(x.scaleDim, x.scaleType)[getRangeMethod(x.scaleType)]([0, W], 0.1);
            var yScale = y.scaleDim && node.scale(y.scaleDim, y.scaleType)[getRangeMethod(y.scaleType)]([H, 0], 0.1);

            axes[0][0].scale = xScale;
            axes[1][0].scale = yScale;

            var X_AXIS_POS = [0, H + x.padding];
            var Y_AXIS_POS = [0 - y.padding, 0];

            this.container = options
                .container
                .append('g')
                .attr('class', 'cell')
                .attr('transform', translate(L, T));

            !x.hide && fnDrawDimAxis.call(this.container, x, X_AXIS_POS, 'x axis');
            !y.hide && fnDrawDimAxis.call(this.container, y, Y_AXIS_POS, 'y axis');

            var grid = fnDrawGrid.call(this.container, node, H, W);

            var nR = node.$matrix.sizeR();
            var nC = node.$matrix.sizeC();

            var cellW = W / nC;
            var cellH = H / nR;

            node.$matrix.iterate(function (iRow, iCol, subNodes) {
                subNodes.forEach(function (node) {

                    node.options = {
                        container: grid,
                        width: cellW,
                        height: cellH,
                        top: iRow * cellH,
                        left: iCol * cellW,
                        xScale: xScale,
                        yScale: yScale
                    };

                    continueTraverse(node);
                });
            });
        },

        'ELEMENT/POINT': function (node) {

            var filteredData = node.partition();
            var srcData = node.source();

            var options = node.options || {};

            var color = tau
                .data
                .scale
                .color10()
                .domain(_(srcData).chain().pluck(node.color).uniq().value());

            var size = d3
                .scale
                .linear()
                .range([0, options.width / 100])
                .domain([
                    0,
                    _(srcData).chain().pluck(node.size).max().value()
                ]);

            var update = function () {
                return this
                    .attr('r', function (d) {
                        var s = size(d[node.size]);
                        if (_.isNaN(s)) {
                            s = options.width / 100;
                        }
                        return s;
                    })
                    .attr('class', function (d) {
                        return 'dot i-role-datum ' + color(d[node.color]);
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

        'ELEMENT/INTERVAL': function (node) {

            var options = node.options || {};

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

        'ELEMENT/LINE': function (node) {

            var options = node.options || {};

            var updatePaths = function () {
                this.attr('d', line);
            };

            var updateLines = function () {

                var paths = this.selectAll('path').data(function (d) {
                    return [d.values];
                });

                paths.call(updatePaths);
                paths.enter().append('path').call(updatePaths);
                paths.exit().remove();
            };

            var line = d3
                .svg
                .line()
                .x(function (d) {
                    return options.xScale(d[node.x]);
                })
                .y(function (d) {
                    return options.yScale(d[node.y]);
                });

            var lines = this.container
                .append('g')
                .attr("class", "line")
                .attr('stroke', '#4daf4a')
                .append("path")
                .datum(node.partition())
                .attr("d", line);

            /*.selectAll('.line').data(data);
             lines.call(updateLines);
             lines.enter().append('g').call(updateLines);
             lines.exit().remove();*/
        }
    };

    return function (unitType) {

        if (!TNodeMap.hasOwnProperty(unitType)) {
            throw new Error('Unknown unit type: ' + unitType);
        }

        return TNodeMap[unitType];
    };

})();

export {TNodeVisitorFactory}