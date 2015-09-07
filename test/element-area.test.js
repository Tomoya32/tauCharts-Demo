define(function (require) {
    var expect = require('chai').expect;
    var schemes = require('schemes');
    var testUtils = require('testUtils');
    var assert = require('chai').assert;
    var getArea = testUtils.getArea;
    var attrib = testUtils.attrib;
    var tauChart = require('src/tau.charts');

    var createSpec = function (testData, flip = false) {
        return {
            spec: {
                unit: {
                    type: 'COORDS.RECT',
                    x: 'x',
                    y: 'y',
                    guide: {
                        x: {hide: true, autoScale: false},
                        y: {hide: true, autoScale: false},
                        padding: {l: 0, r: 0, b: 0, t: 0}
                    },
                    unit: [
                        {
                            type: 'ELEMENT.AREA',
                            x: 'x',
                            y: 'y',
                            color: 'color',
                            guide: {flip: flip}
                        }
                    ]
                }
            },
            data: testData,
            settings: {
                layoutEngine: 'NONE'
            }
        };
    };

    describe('ELEMENT.AREA', function () {

        var testData = [
            {x: 0, y: 0, color: 'up'},
            {x: 1, y: 1, color: 'up'},
            {x: 0, y: 1, color: 'down'},
            {x: 1, y: 0, color: 'down'}
        ];

        var element;
        var chart;

        beforeEach(function () {
            element = document.createElement('div');
            document.body.appendChild(element);
            chart = new tauChart.Plot(createSpec(testData));
            chart.renderTo(element, {width: 1000, height: 1000});
        });

        afterEach(function () {
            element.parentNode.removeChild(element);
        });

        it('should support event interface', function () {

            var areas = getArea();
            expect(areas.length).to.equal(2, 'should render two area elements');

            expect(testUtils.hasClass(areas[0], 'graphical-report__highlighted')).to.equal(false);
            expect(testUtils.hasClass(areas[0], 'graphical-report__dimmed')).to.equal(false);
            expect(testUtils.hasClass(areas[1], 'graphical-report__highlighted')).to.equal(false);
            expect(testUtils.hasClass(areas[1], 'graphical-report__dimmed')).to.equal(false);

            var areaNode = chart.select((n) => n.config.type === 'ELEMENT.AREA')[0];

            areaNode.fire('highlight', ((row) => (row.color === 'up')));

            expect(testUtils.hasClass(areas[0], 'graphical-report__highlighted')).to.equal(true);
            expect(testUtils.hasClass(areas[0], 'graphical-report__dimmed')).to.equal(false);

            expect(testUtils.hasClass(areas[1], 'graphical-report__highlighted')).to.equal(false);
            expect(testUtils.hasClass(areas[1], 'graphical-report__dimmed')).to.equal(true);

            areaNode.fire('highlight', ((row) => null));

            expect(testUtils.hasClass(areas[0], 'graphical-report__highlighted')).to.equal(false);
            expect(testUtils.hasClass(areas[0], 'graphical-report__dimmed')).to.equal(false);

            expect(testUtils.hasClass(areas[1], 'graphical-report__highlighted')).to.equal(false);
            expect(testUtils.hasClass(areas[1], 'graphical-report__dimmed')).to.equal(false);

            areaNode.fire('highlight-data-points', ((row) => (row.x === 0)));

            var highlightedDots0 = d3.selectAll('.i-data-anchor').filter(function () {
                var r = parseFloat(d3.select(this).attr('r'));
                return r === 3;
            });

            expect(highlightedDots0[0].length).to.equal(2, 'should highlight 2 data points');

            areaNode.fire('highlight-data-points', ((row) => false));

            var highlightedDots1 = d3.selectAll('.i-data-anchor').filter(function () {
                var r = parseFloat(d3.select(this).attr('r'));
                return r === 3;
            });

            expect(highlightedDots1[0].length).to.equal(0, 'should remove highlight from all points');

            var actualData;
            var polygons = d3.select('polygon')[0];
            areaNode.on('click', ((sender, e) => (actualData = e.data)));
            testUtils.simulateEvent('click', polygons[0]);
            expect(actualData.x).to.equal(0, 'proper x');
            expect(actualData.y).to.equal(0, 'proper y');
            expect(actualData.color).to.equal('up', 'proper color');
        });

        it('should render two area elements', function () {

            var svgPolygons = d3.selectAll('polygon')[0];

            // up triangle
            expect(d3.select(svgPolygons[0]).attr('points'))
                .to
                .equal('0,1000 0,1000 1000,0 1000,1000');

            // down triangle
            expect(d3.select(svgPolygons[1]).attr('points'))
                .to
                .equal('0,1000 0,0 1000,1000 1000,1000');

            var areas = getArea();
            expect(areas.length).to.equal(2, 'should render two area elements');

            expect(testUtils.hasClass(areas[0], 'color20-1')).to.equal(true);
            expect(testUtils.hasClass(areas[1], 'color20-2')).to.equal(true);
        });
    });

    describe('ELEMENT.AREA min is negative', function () {

        var testData = [
            {x: 0, y: 1, color: 'up'},
            {x: 1, y: -1, color: 'up'},
            {x: 0, y: 1, color: 'down'},
            {x: 1, y: 0, color: 'down'}
        ];

        var element;
        var chart;

        beforeEach(function () {
            element = document.createElement('div');
            document.body.appendChild(element);
            chart = new tauChart.Plot(createSpec(testData));
            chart.renderTo(element, {width: 1000, height: 1000});
        });

        afterEach(function () {
            element.parentNode.removeChild(element);
        });

        it('should render two area elements', function () {

            var svgPolygons = d3.selectAll('polygon')[0];

            // "bantik" :)
            expect(d3.select(svgPolygons[0]).attr('points'))
                .to
                .equal('0,500 0,0 1000,1000 1000,500');

            // down triangle
            expect(d3.select(svgPolygons[1]).attr('points'))
                .to
                .equal('0,500 0,0 1000,500 1000,500');
        });
    });

    describe('ELEMENT.AREA max is negative', function () {

        var testData = [
            {x: -1, y: -1, color: 'up'},
            {x: 1, y: -2, color: 'up'}
        ];

        var element;
        var chart;

        beforeEach(function () {
            element = document.createElement('div');
            document.body.appendChild(element);
            chart = new tauChart.Plot(createSpec(testData));
            chart.renderTo(element, {width: 1000, height: 1000});
        });

        afterEach(function () {
            element.parentNode.removeChild(element);
        });

        it('should render two area elements', function () {

            var svgPolygons = d3.selectAll('polygon')[0];

            expect(d3.select(svgPolygons[0]).attr('points'))
                .to
                .equal('0,0 0,0 1000,1000 1000,0');
        });
    });

    describe('ELEMENT.AREA flipped', function () {

        var testData = [
            {x: 0, y: 0, color: 'up'},
            {x: 1, y: 1, color: 'up'},
            {x: 0, y: 1, color: 'down'},
            {x: 1, y: 0, color: 'down'}
        ];

        var element;
        var chart;

        beforeEach(function () {
            element = document.createElement('div');
            document.body.appendChild(element);
            chart = new tauChart.Plot(createSpec(testData, true));
            chart.renderTo(element, {width: 1000, height: 1000});
        });

        afterEach(function () {
            element.parentNode.removeChild(element);
        });

        it('should render two area elements', function () {

            var svgPolygons = d3.selectAll('polygon')[0];

            // up triangle (flipped)
            expect(d3.select(svgPolygons[0]).attr('points'))
                .to
                .equal('0,1000 0,1000 1000,0 0,0');

            // down triangle (flipped)
            expect(d3.select(svgPolygons[1]).attr('points'))
                .to
                .equal('0,0 0,0 1000,1000 0,1000');

            var areas = getArea();
            expect(areas.length).to.equal(2, 'should render two area elements');

            expect(testUtils.hasClass(areas[0], 'color20-1')).to.equal(true);
            expect(testUtils.hasClass(areas[1], 'color20-2')).to.equal(true);
        });
    });

    describe('ELEMENT.AREA within ordinal / measure scales', function () {

        var testData = [
            {y: 'A', x: 0, color: 'up'},
            {y: 'B', x: 1, color: 'up'},
            {y: 'A', x: 1, color: 'down'},
            {y: 'B', x: 0, color: 'down'}
        ];

        var element;
        var chart;

        beforeEach(function () {
            element = document.createElement('div');
            document.body.appendChild(element);
            chart = new tauChart.Plot(createSpec(testData));
            chart.renderTo(element, {width: 1000, height: 1000});
        });

        afterEach(function () {
            element.parentNode.removeChild(element);
        });

        it('should render two area elements', function () {

            var svgPolygons = d3.selectAll('polygon')[0];

            // up triangle
            expect(d3.select(svgPolygons[0]).attr('points'))
                .to
                .equal('0,750 0,750 1000,250 1000,750');

            // down triangle
            expect(d3.select(svgPolygons[1]).attr('points'))
                .to
                .equal('1000,750 1000,750 0,250 0,750');

            var areas = getArea();
            expect(areas.length).to.equal(2, 'should render two area elements');

            expect(testUtils.hasClass(areas[0], 'color20-1')).to.equal(true);
            expect(testUtils.hasClass(areas[1], 'color20-2')).to.equal(true);
        });
    });
});