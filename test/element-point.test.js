var testData = [
    {x: 1, y: 1, color: 'red', size: 6},
    {x: 0.5, y: 0.5, color: 'green', size: 6},
    {x: 2, y: 2, color: 'green', size: 8}
];

describe("Point element with all params", function () {
    var element;
    var chart;
    beforeEach(function () {
        element = document.createElement('div');
        document.body.appendChild(element);
        chart = new tauChart.Plot({
            spec: {
                unit: {
                    guide:{},
                    type: 'COORDS.RECT',
                    x: 'x',
                    y: 'y',
                    unit: [
                        {
                            type: 'ELEMENT.POINT',
                            x: 'x',
                            y: 'y',
                            color: 'color',
                            size: 'size'
                        }
                    ]
                }
            },
            data: testData
        });
        chart.renderTo(element, {width: 800, height: 800});


    });
    afterEach(function () {
        element.parentNode.removeChild(element);
    });
    it("should right spec", function () {
        assert.ok(schemes.scatterplot(chart.config.spec), 'spec is right');
    });
    it("should render point with right cord", function () {
        var dots = getDots();
        expect(dots.length).to.equal(3);
        expect(position(dots[1])).to.deep.equal({x: '50', y: '750'});
        expect(position(dots[2])).to.deep.equal({x: '800', y: '0'});
    });
    it("should render point with right size", function () {
        var dots = getDots();
        var size1 = attrib(dots[0], 'r');
        var size2 = attrib(dots[1], 'r');
        var size3 = attrib(dots[2], 'r');
        assert.equal(size1, size2, 'size should same');
        assert.notEqual(size1, size3, 'size shouldn\'t same');
    });
    it("should render point with right color", function () {
        var dots = getDots();
        var size1 = attrib(dots[0], 'class');
        var size2 = attrib(dots[1], 'class');
        var size3 = attrib(dots[2], 'class');
        assert.equal(size2, size3, 'size should same');
        assert.notEqual(size1, size2, 'size shouldn\'t same');
    });
});
describe("Point element without color and size params", function () {
    var element;
    beforeEach(function () {
        element = document.createElement('div');
        document.body.appendChild(element);
        new tauChart.Plot({
            spec: {
                unit: {
                    type: 'COORDS.RECT',
                    x: 'x',
                    y: 'y',
                    unit: [
                        {
                            type: 'ELEMENT.POINT',
                            x: 'x',
                            y: 'y'
                        }
                    ]
                }
            },
            data: testData
        }).renderTo(element, {width: 800, height: 800});
    });
    afterEach(function () {
        element.parentNode.removeChild(element);
    });

    it("should render point with right cord", function () {
        var dots = getDots();
        expect(dots.length).to.equal(3);
        expect(position(dots[1])).to.deep.equal({x: '50', y: '750'});
        expect(position(dots[2])).to.deep.equal({x: '800', y: '0'});
    });
    it("should render point with right size", function () {
        var dots = getDots();
        var size1 = attrib(dots[0], 'r');
        var size2 = attrib(dots[1], 'r');
        var size3 = attrib(dots[2], 'r');
        assert.equal(size1, size2, 'size should same');
        assert.equal(size1, size3, 'size should same');
    });
    it("should render point with right color", function () {
        var dots = getDots();
        var size1 = attrib(dots[0], 'class');
        var size2 = attrib(dots[1], 'class');
        var size3 = attrib(dots[2], 'class');
        assert.equal(size2, size3, 'size should same');
        assert.equal(size1, size2, 'size should same');
    });
});

describe("Point element color was presented  with brewer as object", function () {
    var element;
    beforeEach(function () {
        element = document.createElement('div');
        document.body.appendChild(element);
        new tauChart.Plot({
            spec: {
                unit: {
                    type: 'COORDS.RECT',
                    x: 'x',
                    y: 'y',
                    unit: [
                        {
                            type: 'ELEMENT.POINT',
                            x: 'x',
                            y: 'y',
                            color: {
                                dimension: 'color',
                                brewer: {
                                    red: 'red',
                                    green: 'green',
                                    blue: 'blue'
                                }
                            }
                        }
                    ]
                }
            },
            data: testData.concat({x: 3, y: 3, color: 'blue', size: 8})
        }).renderTo(element, {width: 800, height: 800});
    });
    afterEach(function () {
        element.parentNode.removeChild(element);
    });

    it("should render point with right color", function () {
        var dots = getDots();
        assert.ok(hasClass(dots[0], 'red'), 'has red class');
        assert.ok(hasClass(dots[1], 'green'), 'has green class');
        assert.ok(hasClass(dots[2], 'green'), 'has green class');
        assert.ok(hasClass(dots[3], 'blue'), 'has blue class');
    });
});

describe("Point element color was presented  with brewer as array", function () {
    var element;
    beforeEach(function () {
        element = document.createElement('div');
        document.body.appendChild(element);
        new tauChart.Plot({
            spec: {
                unit: {
                    type: 'COORDS.RECT',
                    x: 'x',
                    y: 'y',
                    unit: [
                        {
                            type: 'ELEMENT.POINT',
                            x: 'x',
                            y: 'y',
                            color: {
                                dimension: 'color',
                                brewer: tauBrewer('YlGn', 3)
                            }
                        }
                    ]
                }
            },
            data: testData.concat({x: 3, y: 3, color: 'blue', size: 8})
        }).renderTo(element, {width: 800, height: 800});
    });
    afterEach(function () {
        element.parentNode.removeChild(element);
    });

    it("should render point with right color", function () {
        var dots = getDots();
        assert.ok(hasClass(dots[0], 'YlGn q0-3'), 'has brewer class');
        assert.ok(hasClass(dots[1], 'YlGn q1-3'), 'has brewer class');
        assert.ok(hasClass(dots[2], 'YlGn q1-3'), 'has brewer class');
        assert.ok(hasClass(dots[3], 'YlGn q2-3'), 'has brewer class');
    });
});