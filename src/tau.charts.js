(function () {
    /** @class
     * @extends Plugin */
    var Plugins = Class.extend({
        /** @constructs */
        init: function (plugins) {
            this._plugins = plugins;
        },

        _call: function (name, args) {
            for (var i = 0; i < this._plugins.length; i++) {
                if (typeof(this._plugins[i][name]) == 'function') {
                    this._plugins[i][name].apply(this._plugins[i], args);
                }
            }
        },

        render: function (context, tools) {
            this._call('render', arguments);
        },

        click: function (context, tools) {
            this._call('click', arguments);
        },

        mouseover: function (context, tools) {
            this._call('mouseover', arguments);
        },

        mouseout: function (context, tools) {
            this._call('mouseout', arguments);
        }
    });

    /**
     * @class
     */
    var Chart = Class.extend({
        /**
         * @constructs
         * @param {DataSource} dataSource
         */
        init: function (dataSource) {
            this._dataSource = dataSource;
        },

        map: function (config) {
            /** @type Mapper */
            this._mapper = tau.data.Mapper(config);
            return this;
        },

        plugins: function () {
            /** @type {Plugin} */
            this._plugins = new Plugins(arguments);
            return this;
        },

        render: function () {
            throw new Error('Not implemented');
        }
    });

    var Axes = {
        padding: 10
    };

    /** @class */
    var Axis = Class.extend({
        /**
         * @constructs
         * @param {PropertyMapper} mapper */
        init: function (mapper) {
            this._mapper = mapper;
        },

        render: function (context) {
        }
    });

    /** @class
     * @extends Axis */
    var XAxis = Axis.extend({
        render: function (container) {
            var xAxis = d3.svg.axis()
                // TODO: internal _scale property of binder is exposed
                .scale(this._mapper._scale)
                .orient('bottom');

            container
                .append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0, ' + Axes.padding + ')')
                .call(xAxis)
                .append('text')
                .attr('class', 'label')
                .attr('x', container.layout('width'))
                .attr('y', -xAxis.tickSize())
                .style('text-anchor', 'end')
                .text(this._mapper.caption());
        }
    });

    /** @class
     * @extends Axis */
    var YAxis = Axis.extend({
        render: function (container) {
            var yAxis = d3.svg.axis()
                // TODO: internal _scale property of binder is exposed
                .scale(this._mapper._scale)
                .orient('left');

            container
                .append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(-' + Axes.padding + ', 0)')
                .call(yAxis)
                .append('text')
                .attr('class', 'label')
                .attr('transform', 'rotate(-90)')
                .attr('x', yAxis.tickSize())
                .attr('y', yAxis.tickSize() + container.layout('width'))
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text(this._mapper.caption());

            container
                .selectAll('.tick line')
                .attr('x1', container.layout('width') - 6)
                .attr('x2', container.layout('width'));

            container
                .selectAll('.tick text')
                .attr('dx', container.layout('width'));

            container
                .select('.domain')
                .attr('transform', 'translate(' + container.layout('width') + ', 0)');
        }
    });

    /** @class */
    var Grid = Class.extend({
        init: function (mapperX, mapperY) {
            this._mapperX = mapperX;
            this._mapperY = mapperY;
        },

        render: function (container) {
            var xAxis = d3.svg.axis()
                // TODO: internal _scale property of binder is exposed
                .scale(this._mapperX._scale)
                .orient('bottom')
                .tickSize(container.layout('height'));

            var yAxis = d3.svg.axis()
                // TODO: internal _scale property of binder is exposed
                .scale(this._mapperY._scale)
                .orient('left')
                .tickSize(-container.layout('width'));

            var grid = container.insert('g', ':first-child').attr('class', 'grid');

            grid.append('g').call(xAxis);
            grid.append('g').call(yAxis);

            // TODO: make own axes and grid instead of using d3's in such tricky way
            grid.selectAll('text').remove();
        }
    });

    var CHART_PADDINGS = {top: 20, right: 20, bottom: 30, left: 40};

    var CHART_HTML =
        '<div class="html html-left"></div>' +
        '<svg></svg>' +
        '<div class="html html-right"></div>' +
        '<div class="html html-above"></div>' +
        '<div class="html html-below"></div>';

    /** @class */
    var ChartLayout = Class.extend({
        /** @constructs */
        init: function(selector){
            var container = d3.select(selector)
                .classed('tau-chart', true)
                .html(CHART_HTML);

            this.html = {
                left: container.select('.html-left'),
                right: container.select('.html-right'),
                above: container.select('.html-above'),
                below: container.select('.html-below')
            };

            this.svg = tau.svg.paddedBox(container.select('svg'), CHART_PADDINGS);

            var layout = new tau.svg.Layout(this.svg);

            layout.row(-30);
            this.yAxis = layout.col(20);
            this.data = layout.col();

            layout.row();
            layout.col(20);
            this.xAxis = layout.col();

            this.width = this.data.layout('width');
            this.height = this.data.layout('height');
        }
    });

    var propagateDatumEvents = function (plugins) {
        return function () {
            this
                .on('click', function (d) {
                    plugins.click(new ElementContext(d), new ChartElementTools(d3.select(this)));
                })
                .on('mouseover', function (d) {
                    plugins.mouseover(new ElementContext(d), new ChartElementTools(d3.select(this)));
                })
                .on('mouseout', function (d) {
                    plugins.mouseout(new ElementContext(d), new ChartElementTools(d3.select(this)));
                })
        }
    };

    /**@class */
    /**@extends Chart */
    var BasicChart = Chart.extend({
        /** @constructs
         * @param {DataSource} dataSource */
        init: function (dataSource) {
            this._super.call(this, dataSource);
        },

        _renderData: function (container, data) {
            throw new Error('Not implemented');
        },

        render: function (selector) {
            var chartLayout = new ChartLayout(selector);

            this._mapper.binder('x').range([0, chartLayout.width]);
            this._mapper.binder('y').range([chartLayout.height, 0]);

            this._dataSource.get(/** @this BasicChart */ function (data) {
                // TODO: use metadata to get domain when implemented
                this._mapper.binder('x').domain([0, d3.max(data, this._mapper.raw('x'))]);
                this._mapper.binder('y').domain([0, d3.max(data, this._mapper.raw('y'))]);

                var renderData = function(data){
                    this._renderData(chartLayout.data, data);
                    chartLayout.data.selectAll('.i-role-datum').call(propagateDatumEvents(this._plugins));
                }.bind(this);

                renderData(data);
                this._dataSource.update(renderData);

                new YAxis(this._mapper.binder('y')).render(chartLayout.yAxis);
                new XAxis(this._mapper.binder('x')).render(chartLayout.xAxis);
                new Grid(this._mapper.binder('x'), this._mapper.binder('y')).render(chartLayout.data);

                tau.svg.bringOnTop(chartLayout.data);

                this._plugins.render(new RenderContext(this._dataSource), new ChartTools(chartLayout, this._mapper));
            }.bind(this));
        }
    });

    /**@class */
    /**@extends BasicChart */
    var ScatterPlotChart = BasicChart.extend({

        _renderData: function (container, data) {
            this._mapper.binder('size').domain([0, d3.max(data, this._mapper.raw('size'))]); // TODO: should be done automatically using chart metadata

            var mapper = this._mapper;

            var update = function () {
                return this
                    .attr('class', mapper.map('dot i-role-datum %color%'))
                    .attr('r', mapper.map('size'))
                    .attr('cx', mapper.map('x'))
                    .attr('cy', mapper.map('y'));
            };

            var elements = container.selectAll('.dot').data(data);

            elements.call(update);
            elements.enter().append('circle').call(update);
            elements.exit().remove();
        }
    });


    /**@class */
    /**@extends BasicChart */
    var LineChart = BasicChart.extend({
        map: function (config) {
            this._super(config);
            this._mapper.alias('color', 'key');

            return this;
        },
        _renderData: function (container, data) {
            var mapper = this._mapper;

            // prepare data to build several lines
            // TODO: provide several data transformers to support more formats
            // sometime we will have data already nested, for example.
            var categories = d3.nest()
                .key(mapper.raw('color'))
                .entries(data);

            var updateLines = function () {
                this.attr('class', mapper.map('line %color%'));

                var paths = this.selectAll('path').data(function (d) {
                    return [d.values];
                });

                // TODO: extract update pattern to some place
                paths.call(updatePaths);
                paths.enter().append('path').call(updatePaths);
                paths.exit().remove();

                var dots = this.selectAll('.dot').data(function (d) {
                    return d.values;
                });

                dots.call(updateDots);
                dots.enter().append('circle').attr('class', 'dot i-role-datum').call(updateDots);
                dots.exit().remove();
            };

            //TODO: allow to set interpolation outside
            var line = d3.svg.line()
                .interpolate('cardinal')
                .x(mapper.map('x'))
                .y(mapper.map('y'));

            var updatePaths = function () {
                this.attr('d', line);
            };

            var updateDots = function () {
                // draw circles (to enable mouse interactions)
                return this
                    .attr('cx', mapper.map('x'))
                    .attr('cy', mapper.map('y'))
                    .attr('r', function () {
                        return 3;
                    });
            };

            var lines = container.selectAll('.line').data(categories);
            lines.call(updateLines);
            lines.enter().append('g').call(updateLines);
            lines.exit().remove();
        }
    });

    /** @class ChartTools */
    var ChartTools = Class.extend({
        /**
         * @constructs
         * @param {ChartLayout} layout
         * @param {Mapper} mapper
         */
        init: function (layout, mapper) {
            this.svg = layout.svg;
            this.html = layout.html;
            this.mapper = mapper;
        }
    });

    /** @class ChartElementTools*/
    var ChartElementTools = Class.extend({
        /** @constructs */
        init: function (element) {
            this.element = element;
        }
    });

    /** @class RenderContext*/
    var RenderContext = Class.extend({
        /** @constructs */
        init: function (dataSource) {
            this.data = dataSource;
        }
    });

    /** @class ElementContext */
    var ElementContext = Class.extend({
        /**
         * @constructs
         * @param datum
         */
        init: function (datum) {
            this.datum = datum;
        }
    });

    tau.charts = {
        /**
         * @param data
         * @returns {ScatterPlotChart}
         */
        Scatterplot: function (data) {
            return new ScatterPlotChart(data);
        },
        Line: function (data) {
            return new LineChart(data);
        }
    };
})();
