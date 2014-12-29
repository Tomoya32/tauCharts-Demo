export class DSLReader {

    constructor(domainMixin, UnitsRegistry) {
        this.domain = domainMixin;
        this.UnitsRegistry = UnitsRegistry;
    }

    buildGraph(spec) {
        var buildRecursively = (unit) => this.UnitsRegistry.get(unit.type).walk(this.domain.mix(unit), buildRecursively);
        return buildRecursively(spec.unit);
    }

    calcLayout(graph, size) {

        graph.options = {top: 0, left: 0, width: size.width, height: size.height};

        var fnTraverseLayout = (node) => {

            if (!node.$matrix) {
                return node;
            }

            var options = node.options;
            var padding = node.guide.padding;

            var innerW = options.width - (padding.l + padding.r);
            var innerH = options.height - (padding.t + padding.b);

            var nRows = node.$matrix.sizeR();
            var nCols = node.$matrix.sizeC();

            var cellW = innerW / nCols;
            var cellH = innerH / nRows;

            var calcLayoutStrategy;
            if (node.guide.split) {
                calcLayoutStrategy = {
                    calcHeight: ((cellHeight, rowIndex, elIndex, lenIndex) => cellHeight / lenIndex),
                    calcTop: ((cellHeight, rowIndex, elIndex, lenIndex) => (rowIndex + 1) * (cellHeight / lenIndex) * elIndex)
                };
            }
            else {
                calcLayoutStrategy = {
                    calcHeight: ((cellHeight, rowIndex, elIndex, lenIndex) => cellHeight),
                    calcTop: ((cellHeight, rowIndex, elIndex, lenIndex) => rowIndex * cellH)
                };
            }

            node.$matrix.iterate((iRow, iCol, subNodes) => {

                var len = subNodes.length;

                _.each(
                    subNodes,
                    (node, i) => {
                        node.options = {
                            width: cellW,
                            left: iCol * cellW,
                            height: calcLayoutStrategy.calcHeight(cellH, iRow, i, len),
                            top: calcLayoutStrategy.calcTop(cellH, iRow, i, len)
                        };
                        fnTraverseLayout(node);
                    });
            });

            return node;
        };

        return fnTraverseLayout(graph);
    }

    renderGraph(styledGraph, target, xIterator) {
        var iterator = xIterator || ((x) => x);
        styledGraph.options.container = target;
        var renderRecursively = (unit) => {
            var unitMeta = this.domain.mix(unit);
            this.UnitsRegistry
                .get(unit.type)
                .draw(unitMeta, (childUnit) => {
                    childUnit.parentUnit = unit;
                    renderRecursively(childUnit);
                });

            iterator(unitMeta);
        };
        styledGraph.parentUnit = null;
        renderRecursively(styledGraph);
        return styledGraph.options.container;
    }
}
