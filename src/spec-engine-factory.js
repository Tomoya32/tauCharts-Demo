import {utils} from './utils/utils';
import {utilsDraw} from './utils/utils-draw';
import {FormatterRegistry} from './formatter-registry';

var inheritProps = (childUnit, root) => {

    childUnit.guide = childUnit.guide || {};
    childUnit.guide.padding = childUnit.guide.padding || {l: 0, t: 0, r: 0, b: 0};

    // leaf elements should inherit coordinates properties
    if (!childUnit.hasOwnProperty('unit')) {
        childUnit = _.defaults(childUnit, root);
        childUnit.guide = _.defaults(childUnit.guide, utils.clone(root.guide));
        childUnit.guide.x = _.defaults(childUnit.guide.x, utils.clone(root.guide.x));
        childUnit.guide.y = _.defaults(childUnit.guide.y, utils.clone(root.guide.y));
    }

    return childUnit;
};

var createSelectorPredicates = (root) => {

    var children = root.unit || [];

    var isLeaf = !root.hasOwnProperty('unit');
    var isLeafParent = !children.some((c) => c.hasOwnProperty('unit'));

    return {
        type: root.type,
        isLeaf: isLeaf,
        isLeafParent: !isLeaf && isLeafParent
    };
};

var getMaxTickLabelSize = function (domainValues, formatter, fnCalcTickLabelSize, axisLabelLimit) {

    if (domainValues.length === 0) {
        return { width: 0, height: 0 };
    }

    if (formatter === null) {
        var size = fnCalcTickLabelSize("TauChart Library");
        size.width = axisLabelLimit * 0.625; // golden ration
        return size;
    }

    var maxXTickText = _.max(domainValues, (x) => formatter(x).toString().length);
    return fnCalcTickLabelSize(formatter(maxXTickText));
};

var getTickFormat = (dim, meta, defaultFormats) => {
    var dimType = dim.dimType;
    var scaleType = dim.scaleType;
    var specifier = '*';
    if (dimType === 'measure' && scaleType === 'time') {
        let src = meta.source.filter((x) => (x !== null)).sort();
        let resolutionAvg = 0;
        if (src.length > 1) {
            let i = 1;
            let l = src.length;
            let m = [];
            while (i < l) {
                m.push(src[i] - src[i - 1]);
                ++i;
            }

            var s = m.reduce((sum, x) => {
                sum += x;
                return sum;
            }, 0);

            resolutionAvg = s / m.length;
        }

        var resolutions = [
            [1000 * 60 * 60 * 24 * 365, 'year'],
            [1000 * 60 * 60 * 24 * 30 * 3, 'quarter'],
            [1000 * 60 * 60 * 24 * 30, 'month'],
            [1000 * 60 * 60 * 24 * 7, 'week'],
            [1000 * 60 * 60 * 24, 'day'],
            [1000 * 60 * 60, 'hour'],
            [1000 * 60, 'min'],
            [1000, 'sec'],
            [0, 'ms']
        ];

        let r = -1;
        do {
            ++r;
        }
        while (resolutions[r][0] > resolutionAvg);

        specifier = resolutions[r][1];
    }

    var key = [dimType, scaleType, specifier].join(':');
    var tag = [dimType, scaleType].join(':');
    return defaultFormats[key] || defaultFormats[tag] || defaultFormats[dimType] || null;
};

var fnTraverseTree = (specUnitRef, transformRules) => {
    var temp = utilsDraw.applyNodeDefaults(specUnitRef);
    var root = transformRules(createSelectorPredicates(temp), temp);
    var prop = _.omit(root, 'unit');
    (root.unit || []).forEach((unit) => fnTraverseTree(inheritProps(unit, prop), transformRules));
    return root;
};

var SpecEngineTypeMap = {

    'NONE': (spec, meta, settings) => {
        return (selectorPredicates, unit) => {

            unit.guide.x.tickFontHeight = settings.getAxisTickLabelSize('X').height;
            unit.guide.y.tickFontHeight = settings.getAxisTickLabelSize('Y').height;

            return unit;
        };
    },

    'AUTO': (spec, meta, settings) => {

        var xLabels = [];
        var yLabels = [];
        var xUnit = null;
        var yUnit = null;
        fnTraverseTree(spec.unit, (selectors, unit) => {

            if (selectors.isLeaf) {
                return unit;
            }


            if (!xUnit && unit.x) (xUnit = unit);
            if (!yUnit && unit.y) (yUnit = unit);


            if (unit.x) {
                unit.guide.x.label.text = unit.guide.x.label.text || unit.x;
            }

            if (unit.y) {
                unit.guide.y.label.text = unit.guide.y.label.text || unit.y;
            }

            var x = unit.guide.x.label.text;
            if (x) {
                xLabels.push(x);
                unit.guide.x.label.text = '';
            }

            var y = unit.guide.y.label.text;
            if (y) {
                yLabels.push(y);
                unit.guide.y.label.text = '';
            }

            return unit;
        });

        if (xUnit) {
            xUnit.guide.x.label.text = xLabels.join(' > ');
        }

        if (yUnit) {
            yUnit.guide.y.label.text = yLabels.join(' > ');
        }

        return (selectorPredicates, unit) => {

            if (selectorPredicates.isLeaf) {
                return unit;
            }

            var isFacetUnit = (!selectorPredicates.isLeaf && !selectorPredicates.isLeafParent);
            if (isFacetUnit) {
                // unit is a facet!
                unit.guide.x.cssClass += ' facet-axis';
                unit.guide.y.cssClass += ' facet-axis';
            }

            var dimX = meta.dimension(unit.x);
            var dimY = meta.dimension(unit.y);

            var isXContinues = (dimX.dimType === 'measure');
            var isYContinues = (dimY.dimType === 'measure');

            var xScaleOptions = {
                map: unit.guide.x.tickLabel,
                min: unit.guide.x.tickMin,
                max: unit.guide.x.tickMax,
                period: unit.guide.x.tickPeriod,
                autoScale: unit.guide.x.autoScale
            };

            var yScaleOptions = {
                map: unit.guide.y.tickLabel,
                min: unit.guide.y.tickMin,
                max: unit.guide.y.tickMax,
                period: unit.guide.y.tickPeriod,
                autoScale: unit.guide.y.autoScale
            };

            var xMeta = meta.scaleMeta(unit.x, xScaleOptions);
            var xValues = xMeta.values;
            var yMeta = meta.scaleMeta(unit.y, yScaleOptions);
            var yValues = yMeta.values;


            unit.guide.x.tickFormat = unit.guide.x.tickFormat || getTickFormat(dimX, xMeta, settings.defaultFormats);
            unit.guide.y.tickFormat = unit.guide.y.tickFormat || getTickFormat(dimY, yMeta, settings.defaultFormats);

            var xIsEmptyAxis = (xValues.length === 0);
            var yIsEmptyAxis = (yValues.length === 0);

            var maxXTickSize = getMaxTickLabelSize(
                xValues,
                FormatterRegistry.get(unit.guide.x.tickFormat),
                settings.getAxisTickLabelSize,
                settings.xAxisTickLabelLimit);

            var maxYTickSize = getMaxTickLabelSize(
                yValues,
                FormatterRegistry.get(unit.guide.y.tickFormat),
                settings.getAxisTickLabelSize,
                settings.yAxisTickLabelLimit);


            var xAxisPadding = selectorPredicates.isLeafParent ? settings.xAxisPadding : 0;
            var yAxisPadding = selectorPredicates.isLeafParent ? settings.yAxisPadding : 0;

            var isXVertical = !isFacetUnit && (!!dimX.dimType && dimX.dimType !== 'measure');

            unit.guide.x.padding = xIsEmptyAxis ? 0 : xAxisPadding;
            unit.guide.y.padding = yIsEmptyAxis ? 0 : yAxisPadding;

            unit.guide.x.rotate = isXVertical ? 90 : 0;
            unit.guide.x.textAnchor = isXVertical ? 'start' : unit.guide.x.textAnchor;

            var xTickWidth = xIsEmptyAxis ? 0 : settings.xTickWidth;
            var yTickWidth = yIsEmptyAxis ? 0 : settings.yTickWidth;

            unit.guide.x.tickFormatWordWrapLimit = settings.xAxisTickLabelLimit;
            unit.guide.y.tickFormatWordWrapLimit = settings.yAxisTickLabelLimit;

            var maxXTickH = isXVertical ? maxXTickSize.width : maxXTickSize.height;

            if (!isXContinues && (maxXTickH > settings.xAxisTickLabelLimit)) {
                maxXTickH = settings.xAxisTickLabelLimit;
            }

            if (!isXVertical && (maxXTickSize.width > settings.xAxisTickLabelLimit)) {
                unit.guide.x.tickFormatWordWrap = true;
                unit.guide.x.tickFormatWordWrapLines = settings.xTickWordWrapLinesLimit;
                maxXTickH = settings.xTickWordWrapLinesLimit * maxXTickSize.height;
            }

            var maxYTickW = maxYTickSize.width;
            if (!isYContinues && (maxYTickW > settings.yAxisTickLabelLimit)) {
                maxYTickW = settings.yAxisTickLabelLimit;
                unit.guide.y.tickFormatWordWrap = true;
                unit.guide.y.tickFormatWordWrapLines = settings.yTickWordWrapLinesLimit;
            }

            var xFontH = xTickWidth + maxXTickH;
            var yFontW = yTickWidth + maxYTickW;

            var xFontLabelHeight = settings.xFontLabelHeight;
            var yFontLabelHeight = settings.yFontLabelHeight;

            var distToXAxisLabel = settings.distToXAxisLabel;
            var distToYAxisLabel = settings.distToYAxisLabel;


            var xTickLabelW = Math.min(settings.xAxisTickLabelLimit, (isXVertical ? maxXTickSize.height : maxXTickSize.width));
            unit.guide.x.density = settings.xDensityKoeff * xTickLabelW;

            var guessLinesCount = Math.ceil(maxYTickSize.width / settings.yAxisTickLabelLimit);
            var koeffLinesCount = Math.min(guessLinesCount, settings.yTickWordWrapLinesLimit);
            var yTickLabelH = Math.min(settings.yAxisTickLabelLimit, koeffLinesCount * maxYTickSize.height);
            unit.guide.y.density = settings.yDensityKoeff * yTickLabelH;


            unit.guide.x.label.padding = (unit.guide.x.label.text) ? (xFontH + distToXAxisLabel) : 0;
            unit.guide.y.label.padding = (unit.guide.y.label.text) ? (yFontW + distToYAxisLabel) : 0;


            var xLabelPadding = (unit.guide.x.label.text) ? (unit.guide.x.label.padding + xFontLabelHeight) : (xFontH);
            var yLabelPadding = (unit.guide.y.label.text) ? (unit.guide.y.label.padding + yFontLabelHeight) : (yFontW);


            unit.guide.x.label.text = unit.guide.x.label.text.toUpperCase();
            unit.guide.y.label.text = unit.guide.y.label.text.toUpperCase();


            unit.guide.padding.b = xAxisPadding + xLabelPadding;
            unit.guide.padding.l = yAxisPadding + yLabelPadding;


            unit.guide.x.tickFontHeight = maxXTickSize.height;
            unit.guide.y.tickFontHeight = maxYTickSize.height;

            unit.guide.x.$minimalDomain = xValues.length;
            unit.guide.y.$minimalDomain = yValues.length;

            unit.guide.x.$maxTickTextW = maxXTickSize.width;
            unit.guide.x.$maxTickTextH = maxXTickSize.height;

            unit.guide.y.$maxTickTextW = maxYTickSize.width;
            unit.guide.y.$maxTickTextH = maxYTickSize.height;

            return unit;
        };
    }
};

var SpecEngineFactory = {

    get: (typeName, settings) => {

        var rules = (SpecEngineTypeMap[typeName] || SpecEngineTypeMap.NONE);
        return (srcSpec, meta) => {
            var spec = utils.clone(srcSpec);
            fnTraverseTree(spec.unit, rules(spec, meta, settings));
            return spec;
        };
    }

};

export {SpecEngineFactory};