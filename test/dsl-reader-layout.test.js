define(function (require) {
    var expect = require('chai').expect;
    var schemes = require('schemes');
    var tauChart = require('tau_modules/tau.newCharts').tauChart;
    describe("DSL reader calcLayout() / renderGraph()", function () {

        var data = [
            {"cycleTime": 10, "effort": 1.0000, "name": "Report", "team": "Exploited", "project": "TP3"},
            {"cycleTime": 22, "effort": 0.0000, "name": "Follow", "team": "Alaska", "project": "TP2"},
            {"cycleTime": 95, "effort": 2.0000, "name": "Errors", "team": "Exploited", "project": "TP2"}
        ];

        var div;

        beforeEach(function () {
            div = document.createElement('div');
            document.body.appendChild(div);
        });

        afterEach(function () {
            div.parentNode.removeChild(div);
        });

        it("should fail on build unknown unit type appearance", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'cycleTime',
                        y: 'effort',
                        guide: {
                            showGridLines: 'xy'
                        },
                        unit: [
                            {
                                type: 'ELEMENT.UNKNOWN'
                            }
                        ]
                    }
                },
                data);

            expect(function () {
                reader.buildGraph()
            })
                .to
                .throw("Unknown unit type: ELEMENT.UNKNOWN");
        });

        it("should render axes correctly (x:category, y:category)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'project',
                        y: 'team',
                        guide: {
                            showGridLines: 'xy'
                        },
                        unit: [
                            {
                                type: 'ELEMENT.POINT'
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var layoutCanvas = reader.renderGraph(layoutGraph, d3.select(div).append("svg"));

            var xAxisTickLines = layoutCanvas.selectAll('.cell .x.axis .tick line')[0];
            expect(xAxisTickLines.length).to.equal(2);
            xAxisTickLines.forEach(function (el) {
                var expectedXCoord = '50';
                expect(el.getAttribute('x1')).to.equal(expectedXCoord);
                expect(el.getAttribute('x2')).to.equal(expectedXCoord);
            });

            var yAxisTickLines = layoutCanvas.selectAll('.cell .y.axis .tick line')[0];
            expect(yAxisTickLines.length).to.equal(2);
            yAxisTickLines.forEach(function (el) {
                var expectedYCoord = '-25';
                expect(el.getAttribute('y1')).to.equal(expectedYCoord);
                expect(el.getAttribute('y2')).to.equal(expectedYCoord);
            });

            var xGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-x .tick line')[0];
            expect(xGridTickLines.length).to.equal(2);
            xGridTickLines.forEach(function (el) {
                var expectedXCoords = '50';
                expect(el.getAttribute('x1')).to.equal(expectedXCoords);
                expect(el.getAttribute('x2')).to.equal(expectedXCoords);

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal('100');
            });

            var yGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-y .tick line')[0];
            expect(yGridTickLines.length).to.equal(2);
            yGridTickLines.forEach(function (el) {
                var expectedYCoords = '-25';

                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal('200');

                expect(el.getAttribute('y1')).to.equal(expectedYCoords);
                expect(el.getAttribute('y2')).to.equal(expectedYCoords);
            });
        });

        it("should render axes correctly (x:measure, y:category)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'effort',
                        y: 'team',
                        guide: {
                            showGridLines: 'xy',
                            x: {density: 40}
                        },
                        unit: [
                            {
                                type: 'ELEMENT.POINT'
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var layoutCanvas = reader.renderGraph(layoutGraph, d3.select(div).append("svg"));

            var xAxisTickLines = layoutCanvas.selectAll('.cell .x.axis .tick line')[0];
            expect(xAxisTickLines.length).to.equal(5);
            xAxisTickLines.forEach(function (el) {
                var expectedXCoord = '0';
                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal(expectedXCoord);
            });

            var yAxisTickLines = layoutCanvas.selectAll('.cell .y.axis .tick line')[0];
            expect(yAxisTickLines.length).to.equal(2);
            yAxisTickLines.forEach(function (el) {
                var expectedYCoord = '-25';
                expect(el.getAttribute('y1')).to.equal(expectedYCoord);
                expect(el.getAttribute('y2')).to.equal(expectedYCoord);
            });

            var xGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-x .tick line')[0];
            expect(xGridTickLines.length).to.equal(5);
            xGridTickLines.forEach(function (el) {
                var expectedXCoords = '0';
                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal(expectedXCoords);

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal('100');
            });

            var yGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-y .tick line')[0];
            expect(yGridTickLines.length).to.equal(2);
            yGridTickLines.forEach(function (el) {
                var expectedYCoords = '-25';

                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal('200');

                expect(el.getAttribute('y1')).to.equal(expectedYCoords);
                expect(el.getAttribute('y2')).to.equal(expectedYCoords);
            });
        });

        it("should render axes correctly (x:category, y:measure)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'team',
                        y: 'effort',
                        guide: {
                            showGridLines: 'xy',
                            y: {density: 20}
                        },
                        unit: [
                            {
                                type: 'ELEMENT.POINT'
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var layoutCanvas = reader.renderGraph(layoutGraph, d3.select(div).append("svg"));

            var xAxisTickLines = layoutCanvas.selectAll('.cell .x.axis .tick line')[0];
            expect(xAxisTickLines.length).to.equal(2);
            xAxisTickLines.forEach(function (el) {
                var expectedXCoord = '50';
                expect(el.getAttribute('x1')).to.equal(expectedXCoord);
                expect(el.getAttribute('x2')).to.equal(expectedXCoord);
            });

            var yAxisTickLines = layoutCanvas.selectAll('.cell .y.axis .tick line')[0];
            expect(yAxisTickLines.length).to.equal(5);
            yAxisTickLines.forEach(function (el) {
                var expectedYCoord = '0';
                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal(expectedYCoord);
            });

            var xGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-x .tick line')[0];
            expect(xGridTickLines.length).to.equal(2);
            xGridTickLines.forEach(function (el) {
                var expectedXCoords = '50';
                expect(el.getAttribute('x1')).to.equal(expectedXCoords);
                expect(el.getAttribute('x2')).to.equal(expectedXCoords);

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal('100');
            });

            var yGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-y .tick line')[0];
            expect(yGridTickLines.length).to.equal(5);
            yGridTickLines.forEach(function (el) {
                var expectedYCoords = '0';

                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal('200');

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal(expectedYCoords);
            });
        });

        it("should render axes correctly (x:measure, y:measure)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'cycleTime',
                        y: 'effort',
                        guide: {
                            showGridLines: 'xy',
                            x: {density: 100, tickFormat: 's', autoScale: false},
                            y: {density: 50, tickFormat: 's', autoScale: false}
                        },
                        unit: [
                            {
                                type: 'ELEMENT.POINT'
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var layoutCanvas = reader.renderGraph(layoutGraph, d3.select(div).append("svg"));

            var ticksCountX = 4;
            var ticksCountY = 5;

            var xAxisTickLines = layoutCanvas.selectAll('.cell .x.axis .tick line')[0];
            expect(xAxisTickLines.length).to.equal(ticksCountX);
            xAxisTickLines.forEach(function (el) {
                var expectedXCoord = '0';
                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal(expectedXCoord);
            });

            var yAxisTickLines = layoutCanvas.selectAll('.cell .y.axis .tick line')[0];
            expect(yAxisTickLines.length).to.equal(ticksCountY);
            yAxisTickLines.forEach(function (el) {
                var expectedYCoord = '0';
                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal(expectedYCoord);
            });

            var xGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-x .tick line')[0];
            expect(xGridTickLines.length).to.equal(ticksCountX);
            xGridTickLines.forEach(function (el) {
                var expectedXCoords = '0';
                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal(expectedXCoords);

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal('100');
            });

            var yGridTickLines = layoutCanvas.selectAll('.cell .grid .grid-lines .grid-lines-y .tick line')[0];
            expect(yGridTickLines.length).to.equal(ticksCountY);
            yGridTickLines.forEach(function (el) {
                var expectedYCoords = '0';

                expect(el.getAttribute('x1')).to.equal(null);
                expect(el.getAttribute('x2')).to.equal('200');

                expect(el.getAttribute('y1')).to.equal(null);
                expect(el.getAttribute('y2')).to.equal(expectedYCoords);
            });
        });

        it("should calc layout for logical graph (- split)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'project',
                        y: 'team',
                        unit: [
                            {
                                type: 'COORDS.RECT',
                                x: 'cycleTime',
                                y: 'effort',
                                guide: {
                                    showGridLines: 'xy',
                                    split: false
                                },
                                unit: [
                                    {
                                        type: 'ELEMENT.POINT'
                                    },
                                    {
                                        type: 'ELEMENT.LINE'
                                    }
                                ]
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var checkFacetCells = function ($matrix, facet) {
                $matrix.iterate(function (r, c, cell) {
                    var rect = cell[0];
                    expect(rect.options.width).to.equal(facet[r][c].w);
                    expect(rect.options.height).to.equal(facet[r][c].h);

                    expect(rect.options.top).to.equal(facet[r][c].t);
                    expect(rect.options.left).to.equal(facet[r][c].l);
                });
            };

            var checkFacetUnits = function (unitsArr, expectedUnits) {
                _.each(unitsArr, function (unit, i) {
                    expect(unit.options.width).to.equal(expectedUnits[i].w);
                    expect(unit.options.height).to.equal(expectedUnits[i].h);
                    expect(unit.options.top).to.equal(expectedUnits[i].t);
                    expect(unit.options.left).to.equal(expectedUnits[i].l);
                });
            };

            expect(layoutGraph.$matrix.sizeR()).to.equal(2);
            expect(layoutGraph.$matrix.sizeC()).to.equal(2);

            checkFacetCells(layoutGraph.$matrix, [
                [{w: 100, h: 50, t: 0, l: 0}, {w: 100, h: 50, t: 0, l: 100}],
                [{w: 100, h: 50, t: 50, l: 0}, {w: 100, h: 50, t: 50, l: 100}]
            ]);

            var cellR0C0 = layoutGraph.$matrix.getRC(0, 0)[0];
            checkFacetUnits(cellR0C0.$matrix.getRC(0, 0), [
                {w: 100, h: 50, t: 0, l: 0},
                {w: 100, h: 50, t: 0, l: 0}
            ]);
        });

        it("should calc layout for logical graph (+ split)", function () {

            var api = tauChart.__api__;
            var reader = new api.DSLReader(
                {
                    dimensions: {
                        project: {type: 'category', scale: 'ordinal'},
                        team: {type: 'category', scale: 'ordinal'},
                        effort: {type: 'measure', scale: 'linear'},
                        cycleTime: {type: 'measure', scale: 'linear'}
                    },
                    unit: {
                        type: 'COORDS.RECT',
                        x: 'project',
                        y: 'team',
                        unit: [
                            {
                                type: 'COORDS.RECT',
                                x: 'cycleTime',
                                y: 'effort',
                                guide: {
                                    showGridLines: 'xy',
                                    split: true
                                },
                                unit: [
                                    {
                                        type: 'ELEMENT.POINT'
                                    },
                                    {
                                        type: 'ELEMENT.LINE'
                                    }
                                ]
                            }
                        ]
                    }
                },
                data);

            var logicXGraph = reader.buildGraph();
            var layoutGraph = reader.calcLayout(
                logicXGraph,
                api.LayoutEngineFactory.get('DEFAULT'),
                {
                    width: 200,
                    height: 100
                });

            var checkFacetCells = function ($matrix, facet) {
                $matrix.iterate(function (r, c, cell) {
                    var rect = cell[0];
                    expect(rect.options.width).to.equal(facet[r][c].w);
                    expect(rect.options.height).to.equal(facet[r][c].h);

                    expect(rect.options.top).to.equal(facet[r][c].t);
                    expect(rect.options.left).to.equal(facet[r][c].l);
                });
            };

            var checkFacetUnits = function (unitsArr, expectedUnits) {
                _.each(unitsArr, function (unit, i) {
                    expect(unit.options.width).to.equal(expectedUnits[i].w);
                    expect(unit.options.height).to.equal(expectedUnits[i].h);
                    expect(unit.options.top).to.equal(expectedUnits[i].t);
                    expect(unit.options.left).to.equal(expectedUnits[i].l);
                });
            };

            expect(layoutGraph.$matrix.sizeR()).to.equal(2);
            expect(layoutGraph.$matrix.sizeC()).to.equal(2);

            checkFacetCells(layoutGraph.$matrix, [
                [{w: 100, h: 50, t: 0, l: 0}, {w: 100, h: 50, t: 0, l: 100}],
                [{w: 100, h: 50, t: 50, l: 0}, {w: 100, h: 50, t: 50, l: 100}]
            ]);

            var cellR0C0 = layoutGraph.$matrix.getRC(0, 0)[0];
            checkFacetUnits(cellR0C0.$matrix.getRC(0, 0), [
                {w: 100, h: 25, t: 0, l: 0},
                {w: 100, h: 25, t: 25, l: 0}
            ]);
        });
    });

    describe("Layout for extracting axes", function() {

        var data = [
            {"team": "Alpha", "project": "TP2", "effort": 1, "cycle": 10},
            {"team": "Sigma", "project": "TP3", "effort": 2, "cycle": 20}
        ];

        var div;

        beforeEach(function () {
            div = document.createElement('div');
            document.body.appendChild(div);
        });

        afterEach(function () {
            div.parentNode.removeChild(div);
        });

        it("should calc layout for 2 levels facet", function () {

            var spec = {
                dimensions: {
                    project : {type: 'category', scale: 'ordinal'},
                    team    : {type: 'category', scale: 'ordinal'},
                    effort  : {type: 'measure', scale: 'linear'},
                    cycle   : {type: 'measure', scale: 'linear'}
                },
                unit: {
                    type: 'COORDS.RECT',
                    x: 'project',
                    y: 'team',
                    unit: [
                        {
                            type: 'COORDS.RECT',
                            x: 'effort',
                            y: 'cycle',
                            unit: [
                                {
                                    type: 'ELEMENT.POINT'
                                }
                            ]
                        }
                    ]
                }
            };

            var api = tauChart.__api__;
            var reader = new api.DSLReader(spec, data);

            var logicalGraph = reader.buildGraph();
            var layoutXGraph = reader.calcLayout(
                logicalGraph,
                api.LayoutEngineFactory.get('SHARE-AXES'),
                {
                    width : 1000,
                    height: 1000
                });

            expect(layoutXGraph.type).to.equal('WRAPPER.SHARED.AXES');



            expect(layoutXGraph.x.length).to.equal(2);
            expect(layoutXGraph.x[0].project.length).to.equal(1);
            expect(layoutXGraph.x[1].effort.length).to.equal(2);

            expect(layoutXGraph.y.length).to.equal(2);
            expect(layoutXGraph.y[0].team.length).to.equal(1);
            expect(layoutXGraph.y[1].cycle.length).to.equal(2);


            var elementType = 'WRAP.AXIS';

            var xLevel0 = layoutXGraph.x[0].project;
            expect(xLevel0[0].type).to.equal(elementType);
            expect(xLevel0[0].x).to.equal('project');

            var xLevel1 = layoutXGraph.x[1].effort;
            expect(xLevel1[0].type).to.equal(elementType);
            expect(xLevel1[0].x).to.equal('effort');
            expect(xLevel1[1].type).to.equal(elementType);
            expect(xLevel1[1].x).to.equal('effort');


            var yLevel0 = layoutXGraph.y[0].team;
            expect(yLevel0[0].type).to.equal(elementType);
            expect(yLevel0[0].y).to.equal('team');

            var yLevel1 = layoutXGraph.y[1].cycle;
            expect(yLevel1[0].type).to.equal(elementType);
            expect(yLevel1[0].y).to.equal('cycle');
            expect(yLevel1[1].type).to.equal(elementType);
            expect(yLevel1[1].y).to.equal('cycle');
        });
    });
});