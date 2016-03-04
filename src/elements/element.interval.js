import {CSS_PREFIX} from '../const';
import {Element} from './element';
import {default as _} from 'underscore';
export class Interval extends Element {

    constructor(config) {

        super(config);

        this.config = config;
        this.config.guide = _.defaults(this.config.guide || {}, {prettify: true, enableColorToBarPosition: true});
        this.config.guide.size = (this.config.guide.size || {});

        this.on('highlight', (sender, e) => this.highlight(e));
    }

    createScales(fnCreateScale) {

        var config = this.config;
        this.xScale = fnCreateScale('pos', config.x, [0, config.options.width]);
        this.yScale = fnCreateScale('pos', config.y, [config.options.height, 0]);
        this.color = fnCreateScale('color', config.color, {});

        const defaultSize = 3;
        var sizeGuide = {min: (this.config.guide.size.min || defaultSize)};
        sizeGuide.max = (this.config.guide.size.max || sizeGuide.min);
        sizeGuide.mid = (this.config.guide.size.mid || sizeGuide.min);
        this.size = fnCreateScale('size', config.size, sizeGuide);

        return this
            .regScale('x', this.xScale)
            .regScale('y', this.yScale)
            .regScale('size', this.size)
            .regScale('color', this.color);
    }

    drawFrames(frames) {

        var self = this;

        var options = this.config.options;
        var config = this.config;
        var xScale = this.xScale;
        var yScale = this.yScale;
        var sizeScale = this.size;
        var colorScale = this.color;
        var isHorizontal = config.flip || config.guide.flip;
        var prettify = config.guide.prettify;

        var barModel = this._buildDrawMethod({xScale, yScale, sizeScale, colorScale, isHorizontal});

        var params = {prettify, xScale, yScale, minBarHeight: 1};
        var d3Attrs = (isHorizontal ?
            this.toHorizontalDrawMethod(barModel, params) :
            this.toVerticalDrawMethod(barModel, params));

        var updateBar = function () {
            return this.attr(d3Attrs);
        };

        var updateBarContainer = function () {
            this.attr('class', 'i-role-bar-group');
            var bars = this.selectAll('.bar').data((d) => {
                return d.values.map(item => ({
                    data: item,
                    uid: d.uid
                }));
            });
            bars.exit()
                .remove();
            bars.call(updateBar);
            bars.enter()
                .append('rect')
                .call(updateBar);

            self.subscribe(bars, ({data:d}) => d);
        };

        var elements = options
            .container
            .selectAll(`.i-role-bar-group`)
            .data(frames.map((fr)=>({key: fr.key, values: fr.part(), uid: this.config.options.uid})));
        elements
            .exit()
            .remove();
        elements
            .call(updateBarContainer);
        elements
            .enter()
            .append('g')
            .call(updateBarContainer);
    }

    toVerticalDrawMethod({barX, barY, barH, barW, barColor}, {prettify, minBarHeight, yScale}) {

        return {
            x: (({data: d}) => barX(d) - barW(d) * 0.5),
            y: (({data: d}) => {
                var y = barY(d);

                if (prettify) {
                    // decorate for better visual look & feel
                    var h = barH(d);
                    var isTooSmall = (h < minBarHeight);
                    return ((isTooSmall && (d[yScale.dim] > 0)) ? (y - minBarHeight) : y);
                } else {
                    return y;
                }
            }),
            height: (({data: d}) => {
                var h = barH(d);
                if (prettify) {
                    // decorate for better visual look & feel
                    var y = d[yScale.dim];
                    return (y === 0) ? h : Math.max(minBarHeight, h);
                } else {
                    return h;
                }
            }),
            width: (({data: d}) => barW(d)),
            class: (({data: d}) => `i-role-element i-role-datum bar ${CSS_PREFIX}bar ${barColor(d)}`)
        };
    }

    toHorizontalDrawMethod({barX, barY, barH, barW, barColor}, {prettify, minBarHeight, xScale}) {

        return {
            y: (({data: d}) => barX(d) - barW(d) * 0.5),
            x: (({data: d}) => {
                var x = barY(d);

                if (prettify) {
                    // decorate for better visual look & feel
                    var h = barH(d);
                    var dx = d[xScale.dim];
                    var offset = 0;

                    if (dx === 0) {offset = 0;}
                    if (dx > 0) {offset = (h);}
                    if (dx < 0) {offset = (0 - minBarHeight);}

                    var isTooSmall = (h < minBarHeight);
                    return (isTooSmall) ? (x + offset) : (x);
                } else {
                    return x;
                }
            }),
            height: (({data: d}) => barW(d)),
            width: (({data: d}) => {
                var w = barH(d);

                if (prettify) {
                    // decorate for better visual look & feel
                    var x = d[xScale.dim];
                    return (x === 0) ? w : Math.max(minBarHeight, w);
                } else {
                    return w;
                }
            }),
            class: (({data: d}) => `i-role-element i-role-datum bar ${CSS_PREFIX}bar ${barColor(d)}`)
        };
    }

    _buildDrawMethod({xScale, yScale, isHorizontal, sizeScale, colorScale}) {

        const barsGap = 1;
        var baseScale = (isHorizontal ? yScale : xScale);
        var enableColorToBarPosition = this.config.guide.enableColorToBarPosition;
        var args = {
            xScale,
            yScale,
            isHorizontal,
            sizeScale,
            colorScale,
            barsGap,
            categories: (enableColorToBarPosition ? colorScale.domain() : [])
        };

        var createFunc = ((x) => (() => x));
        var barModel = [
            Interval.decorator_orientation,
            (baseScale.discrete ?
                Interval.decorator_discrete_size :
                Interval.decorator_continuous_size),
            ((baseScale.discrete && enableColorToBarPosition) ?
                Interval.decorator_discrete_positioningByColor :
                Interval.decorator_identity),
            Interval.decorator_color
        ].reduce(
            ((model, transformation) => transformation(model, args)),
            {
                y0: createFunc(0),
                yi: createFunc(0),
                xi: createFunc(0),
                size: createFunc(0),
                color: createFunc('')
            });

        return {
            barX: ((d) => barModel.xi(d)),
            barY: ((d) => Math.min(barModel.y0(d), barModel.yi(d))),
            barH: ((d) => Math.abs(barModel.yi(d) - barModel.y0(d))),
            barW: ((d) => barModel.size(d)),
            barColor: ((d) => barModel.color(d))
        };
    }

    static decorator_identity(model, {}) {
        return model;
    }

    static decorator_orientation(model, {xScale, yScale, isHorizontal}) {

        var baseScale = (isHorizontal ? yScale : xScale);
        var valsScale = (isHorizontal ? xScale : yScale);

        var k = (isHorizontal ? (-0.5) : (0.5));

        return {

            scaleX: baseScale,
            scaleY: valsScale,

            y0: (valsScale.discrete ?
                (() => valsScale(valsScale.domain()[0]) + valsScale.stepSize(valsScale.domain()[0]) * k) :
                (() => valsScale(Math.max(0, Math.min(...valsScale.domain()))))),
            yi: ((d) => (valsScale(d[valsScale.dim]))),
            xi: ((d) => (baseScale(d[baseScale.dim])))
        };
    }

    static decorator_continuous_size(model, {sizeScale}) {
        return {
            scaleX: model.scaleX,
            scaleY: model.scaleY,
            y0: model.y0,
            yi: model.yi,
            xi: model.xi,
            size: ((d) => (sizeScale(d[sizeScale.dim])))
        };
    }

    static decorator_discrete_size(model, {categories, barsGap}) {
        var categoriesCount = (categories.length || 1);
        var space = ((d) => model.scaleX.stepSize(d[model.scaleX.dim]) * (categoriesCount / (1 + categoriesCount)));
        var fnBarSize = ((d) => (space(d) / categoriesCount));
        var fnGapSize = ((w) => (w > (2 * barsGap)) ? barsGap : 0);

        return {
            scaleX: model.scaleX,
            scaleY: model.scaleY,
            y0: model.y0,
            yi: model.yi,
            xi: model.xi,
            size: ((d) => {
                var barSize = fnBarSize(d);
                var gapSize = fnGapSize(barSize);
                return barSize - 2 * gapSize;
            })
        };
    }

    static decorator_discrete_positioningByColor(model, {colorScale, categories, barsGap}) {
        var baseScale = model.scaleX;
        var categoriesCount = (categories.length || 1);
        var colorIndexScale = ((d) => Math.max(0, categories.indexOf(d[colorScale.dim]))); // -1 (not found) to 0
        var space = ((d) => baseScale.stepSize(d[baseScale.dim]) * (categoriesCount / (1 + categoriesCount)));
        var fnBarSize = ((d) => (space(d) / categoriesCount));

        return {
            scaleX: model.scaleX,
            scaleY: model.scaleY,
            y0: model.y0,
            yi: model.yi,
            xi: ((d) => {
                var absTickStart = (model.xi(d) - (space(d) / 2));
                var relSegmStart = (colorIndexScale(d) * fnBarSize(d));
                var absBarOffset = (model.size(d) * 0.5 + barsGap);
                return absTickStart + relSegmStart + absBarOffset;
            }),
            size: model.size
        };
    }

    static decorator_color(model, {colorScale}) {
        return {
            scaleX: model.scaleX,
            scaleY: model.scaleY,
            y0: model.y0,
            yi: model.yi,
            xi: model.xi,
            size: model.size,
            color: ((d) => colorScale(d[colorScale.dim]))
        };
    }

    highlight(filter) {

        this.config
            .options
            .container
            .selectAll('.bar')
            .classed({
                'graphical-report__highlighted': (({data: d}) => filter(d) === true),
                'graphical-report__dimmed': (({data: d}) => filter(d) === false)
            });
    }
}