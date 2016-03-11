import {CSS_PREFIX} from '../const';
import {Element} from './element';
import {PointModel} from '../models/point';
import {default as _} from 'underscore';
export class Point extends Element {

    constructor(config) {

        super(config);

        this.config = config;

        this.config.guide = this.config.guide || {};

        this.config.guide.x = this.config.guide.x || {};
        this.config.guide.x = _.defaults(
            this.config.guide.x,
            {
                tickFontHeight: 0,
                density: 20
            }
        );

        this.config.guide.y = this.config.guide.y || {};
        this.config.guide.y = _.defaults(
            this.config.guide.y,
            {
                tickFontHeight: 0,
                density: 20
            }
        );

        this.config.guide.size = (this.config.guide.size || {});

        this.decorators = [
            PointModel.decorator_orientation,
            PointModel.decorator_size,
            PointModel.decorator_color
        ];

        this.on('highlight', (sender, e) => this.highlight(e));
    }

    createScales(fnCreateScale) {

        var config = this.config;

        this.xScale = fnCreateScale('pos', config.x, [0, config.options.width]);
        this.yScale = fnCreateScale('pos', config.y, [config.options.height, 0]);
        this.color = fnCreateScale('color', config.color, {});

        var g = config.guide;
        var isNotZero = (x => x !== 0);
        const halfPart = 0.5;
        var minFontSize = halfPart * _.min([g.x, g.y].map(n => n.tickFontHeight).filter(isNotZero));
        var minTickStep = halfPart * _.min([g.x, g.y].map(n => n.density).filter(isNotZero));
        var notLessThan = ((lim, val) => Math.max(val, lim));

        var sizeGuide = {
            min: g.size.min || (2),
            max: g.size.max || notLessThan(2, minTickStep),
            mid: g.size.mid || notLessThan(1, Math.min(minTickStep, minFontSize))
        };

        this.size = fnCreateScale('size', config.size, sizeGuide);

        return this
            .regScale('x', this.xScale)
            .regScale('y', this.yScale)
            .regScale('size', this.size)
            .regScale('color', this.color);
    }

    buildModel({xScale, yScale, sizeScale, colorScale}) {

        var args = {xScale, yScale, sizeScale, colorScale};

        var pointModel = this
            .decorators
            .filter(x => x)
            .reduce(((model, transform) => transform(model, args)), (new PointModel()));

        return {
            x: pointModel.xi,
            y: pointModel.yi,
            size: pointModel.size,
            color: pointModel.color
        };
    }

    drawFrames(frames) {

        var self = this;

        var options = this.config.options;

        var prefix = `${CSS_PREFIX}dot dot i-role-element i-role-datum`;

        var model = this.buildModel({
            xScale: this.xScale,
            yScale: this.yScale,
            colorScale: this.color,
            sizeScale: this.size
        });

        var attr = {
            r: (({data:d}) => model.size(d)),
            cx: (({data:d}) => model.x(d)),
            cy: (({data:d}) => model.y(d)),
            class: (({data:d}) => `${prefix} ${model.color(d)}`)
        };

        var enter = function () {
            return this.attr(attr).transition().duration(500).attr('r', attr.r);
        };

        var update = function () {
            return this.attr(attr);
        };

        var updateGroups = function () {

            this.attr('class', (f) => `frame-id-${options.uid} frame-${f.hash}`)
                .call(function () {
                    var dots = this
                        .selectAll('circle')
                        .data(frame => frame.data.map(item => ({data: item, uid: options.uid})));
                    dots.exit()
                        .remove();
                    dots.call(update);
                    dots.enter()
                        .append('circle')
                        .call(enter);

                    self.subscribe(dots, ({data:d}) => d);
                });
        };

        var mapper = (f) => ({tags: f.key || {}, hash: f.hash(), data: f.part()});

        var frameGroups = options.container
            .selectAll(`.frame-id-${options.uid}`)
            .data(frames.map(mapper), (f) => f.hash);
        frameGroups
            .exit()
            .remove();
        frameGroups
            .call(updateGroups);
        frameGroups
            .enter()
            .append('g')
            .call(updateGroups);

        return [];
    }

    highlight(filter) {
        this.config
            .options
            .container
            .selectAll('.dot')
            .classed({
                'graphical-report__highlighted': (({data: d}) => filter(d) === true),
                'graphical-report__dimmed': (({data: d}) => filter(d) === false)
            });
    }
}