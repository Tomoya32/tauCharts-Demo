import {default as d3} from 'd3';
import {default as _} from 'underscore';
import {Element} from './element';
import {utilsDraw} from '../utils/utils-draw';
import {utils} from '../utils/utils';
import {CSS_PREFIX} from '../const';

export class Parallel extends Element {

    constructor(config) {

        super();

        this.config = config;

        this.config.guide = _.defaults(
            this.config.guide || {},
            {
                padding: {l: 50, r: 50, t: 50, b: 50},
                enableBrushing: false
            });

        this.columnsBrushes = {};

        this.on('force-brush', (sender, e) => this._forceBrushing(e));
    }

    drawLayout(fnCreateScale) {

        var cfg = this.config;

        var options = cfg.options;
        var padding = cfg.guide.padding;

        var innerWidth = options.width - (padding.l + padding.r);
        var innerHeight = options.height - (padding.t + padding.b);

        this.W = innerWidth;
        this.H = innerHeight;

        this.columnsScalesMap = cfg.columns.reduce(
            (memo, xi) => {
                memo[xi] = fnCreateScale('pos', xi, [innerHeight, 0]);
                return memo;
            },
            {});

        var step = innerWidth / (cfg.columns.length - 1);

        var colsMap = cfg.columns.reduce(
            (memo, p, i) => {
                memo[p] = (i * step);
                return memo;
            },
            {});

        this.xBase = ((p) => colsMap[p]);

        return this;
    }

    drawFrames(frames, continuation) {

        var cfg = _.extend({}, this.config);
        var options = cfg.options;
        var padding = cfg.guide.padding;

        var innerW = options.width - (padding.l + padding.r);
        var innerH = options.height - (padding.t + padding.b);

        var updateCellLayers = (cellId, cell, frame) => {

            var frameId = frame.hash();
            var mapper = (unit, i) => {
                unit.options = {
                    uid: frameId + i,
                    frameId: frameId,
                    container: cell,
                    containerWidth: innerW,
                    containerHeight: innerH,
                    left: 0,
                    top: 0,
                    width: innerW,
                    height: innerH
                };
                return unit;
            };

            var continueDrawUnit = function (unit) {
                unit.options.container = d3.select(this);
                continuation(unit, frame);
            };

            var layers = cell
                .selectAll(`.layer_${cellId}`)
                .data(frame.units.map(mapper), (unit) => (unit.options.uid + unit.type));
            layers
                .exit()
                .remove();
            layers
                .each(continueDrawUnit);
            layers
                .enter()
                .append('g')
                .attr('class', `layer_${cellId}`)
                .each(continueDrawUnit);
        };

        var cellFrameIterator = function (cellFrame) {
            updateCellLayers(options.frameId, d3.select(this), cellFrame);
        };

        var grid = this._fnDrawGrid(
            options.container,
            cfg,
            options.frameId,
            Object
                .keys(this.columnsScalesMap)
                .reduce((memo, k) => memo.concat([this.columnsScalesMap[k].getHash()]), [])
                .join('_'));

        var frms = grid
            .selectAll(`.parent-frame-${options.frameId}`)
            .data(frames, (f) => f.hash());
        frms.exit()
            .remove();
        frms.each(cellFrameIterator);
        frms.enter()
            .append('g')
            .attr('class', (d) => (`${CSS_PREFIX}cell cell parent-frame-${options.frameId} frame-${d.hash()}`))
            .each(cellFrameIterator);

        var cols = this._fnDrawColumns(grid, cfg);

        if (cfg.guide.enableBrushing) {
            this._enableBrushing(cols);
        }
    }

    _fnDrawGrid(container, config, frameId, uniqueHash) {

        var options = config.options;
        var padding = config.guide.padding;

        var l = options.left + padding.l;
        var t = options.top + padding.t;

        var grid = container
            .selectAll(`.grid_${frameId}`)
            .data([uniqueHash], _.identity);
        grid.exit()
            .remove();
        grid.enter()
            .append('g')
            .attr('class', `grid grid_${frameId}`)
            .attr('transform', utilsDraw.translate(l, t));

        return grid;
    }

    _fnDrawColumns(grid, config) {
        var colsGuide = config.guide.columns || {};
        var xBase = this.xBase;
        var columnsScalesMap = this.columnsScalesMap;
        var d3Axis = d3.svg.axis().orient('left');

        var cols = grid
            .selectAll('.column')
            .data(config.columns, _.identity);
        cols.exit()
            .remove();
        cols.enter()
            .append('g')
            .attr('class', 'column')
            .attr('transform', (d) => utilsDraw.translate(xBase(d), 0))
            .call(function () {
                this.append('g')
                    .attr('class', 'y axis')
                    .each(function (d) {
                        d3.select(this).call(d3Axis.scale(columnsScalesMap[d]));
                    })
                    .append('text')
                    .attr('class', 'label')
                    .attr('text-anchor', 'middle')
                    .attr('y', -9)
                    .text((d) => ((colsGuide[d] || {}).label || {}).text || columnsScalesMap[d].dim);
            });

        return cols;
    }

    _enableBrushing(cols) {

        var columnsScalesMap = this.columnsScalesMap;
        var columnsBrushes = this.columnsBrushes;

        var onBrushStartEventHandler = (e) => e;
        var onBrushEndEventHandler = (e) => e;
        var onBrushEventHandler = (e) => {
            var eventBrush = Object
                .keys(columnsBrushes)
                .filter((k) => !columnsBrushes[k].empty())
                .map((k) => {
                    var ext = columnsBrushes[k].extent();
                    var rng = [];
                    if (columnsScalesMap[k].descrete) {
                        rng = columnsScalesMap[k]
                            .domain()
                            .filter((val) => {
                                var pos = columnsScalesMap[k](val);
                                return (ext[0] <= pos) && (ext[1] >= pos);
                            });
                    } else {
                        rng = [ext[0], ext[1]];
                    }

                    return {
                        dim: columnsScalesMap[k].dim,
                        func: columnsScalesMap[k].descrete ? 'inset' : 'between',
                        args: rng
                    };
                });

            this.fire('brush', eventBrush);
        };

        cols.selectAll('.brush')
            .remove();
        cols.append('g')
            .attr('class', 'brush')
            .each(function (d) {
                columnsBrushes[d] = d3.svg
                    .brush()
                    .y(columnsScalesMap[d])
                    .on('brushstart', onBrushStartEventHandler)
                    .on('brush', onBrushEventHandler)
                    .on('brushend', onBrushEndEventHandler);

                d3.select(this)
                    .classed(`brush-${utils.generateHash(d)}`, true)
                    .call(columnsBrushes[d]);
            })
            .selectAll('rect')
            .attr('x', -8)
            .attr('width', 16);

        return cols;
    }

    _forceBrushing(colsBrushSettings = {}) {

        var columnsBrushes = this.columnsBrushes;
        var columnsScalesMap = this.columnsScalesMap;

        Object
            .keys(colsBrushSettings)
            .filter((k) => columnsBrushes[k] && columnsScalesMap[k] && colsBrushSettings[k])
            .forEach((k) => {
                var brushExt = colsBrushSettings[k];
                var ext = [];
                if (columnsScalesMap[k].descrete) {
                    var positions = brushExt.map(columnsScalesMap[k]).filter(x => (x >= 0));
                    var stepSize = columnsScalesMap[k].stepSize() / 2;
                    ext = [Math.min(...positions) - stepSize, Math.max(...positions) + stepSize];
                } else {
                    ext = [brushExt[0], brushExt[1]];
                }
                var hashK = utils.generateHash(k);
                columnsBrushes[k].extent(ext);
                columnsBrushes[k](d3.select(`.brush-${hashK}`));
                columnsBrushes[k].event(d3.select(`.brush-${hashK}`));
            });
    }
}