var DSLReader = function (ast) {

    this.W = 1600;
    this.H = 1000;

    $("#chart-container").css({
        width: this.W,
        height: this.H
    });

    this.container = d3
            .select("#chart-container")
            .append("svg")
            .attr("width", this.W)
            .attr("height", this.H);

    this.ast = ast;
};

DSLReader.prototype = {

    process: function (rawData) {

        var unit = this.ast.unit;

        var unitIterator = function (sUnit, options) {
            sUnit.options = options;
            sUnit.data = (sUnit.filter) ? sUnit.filter(rawData) : rawData;
            UNITS_MAP[sUnit.type](sUnit, unitIterator);

            unitIterator(
                unit,
                {
                    container: this.container,
                    width: this.W,
                    height: this.H,
                    top: 0,
                    left: 0
                });
        }
    },

    traverse: function (rawData) {

        var unit = this.ast.unit;

        var buildLogicalGraphRecursively = function(unitRef, srcData) {
            return TUnitVisitorFactory(unitRef.type)(unitRef, srcData, buildLogicalGraphRecursively);
        };

        var refUnit = buildLogicalGraphRecursively(unit, rawData);

        var renderLogicalGraphRecursively = function(unitRef, srcData) {
            return TNodeVisitorFactory(unitRef.type)(unitRef, _(srcData).filter(unitRef.$filter), renderLogicalGraphRecursively);
        };

        refUnit.options = {
            container: this.container,
            width: this.W,
            height: this.H,
            top: 0,
            left: 0
        };

        renderLogicalGraphRecursively(refUnit, rawData);
    }
};
