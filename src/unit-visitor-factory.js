import {utils} from './utils/utils';
import {TMatrix} from './matrix';

var TUnitVisitorFactory = (function () {

    var FacetAlgebra = {

        'CROSS': function (root, dimX, dimY) {

            var domainX = root.domain(dimX);
            var domainY = root.domain(dimY).reverse();

            return _(domainY).map((rowVal) => {
                return _(domainX).map((colVal) => {

                    var r = {};

                    if (dimX) {
                        r[dimX] = colVal;
                    }

                    if (dimY) {
                        r[dimY] = rowVal;
                    }

                    return r;
                });
            });
        }
    };

    var TFuncMap = (opName) => FacetAlgebra[opName] || (() => [[{}]]);

    var inheritRootProps = (unit, root) => {
        var r = _.defaults(utils.clone(unit), {x: root.x, y: root.y, guide: {}});
        r.guide = _.extend(utils.clone(root.guide || {}), r.guide);
        return r;
    };

    var TUnitMap = {

        'COORDS.RECT': function (unit, continueTraverse) {

            var root = _.defaults(unit, {$where: {}});

            var isFacet = _.any(root.unit, (n) => (n.type.indexOf('COORDS.') === 0));
            var unitFunc = TFuncMap(isFacet ? 'CROSS' : '');

            var matrixOfPrFilters = new TMatrix(unitFunc(root, root.x, root.y));
            var matrixOfUnitNodes = new TMatrix(matrixOfPrFilters.sizeR(), matrixOfPrFilters.sizeC());

            matrixOfPrFilters.iterate((row, col, $whereRC) => {
                var cellWhere = _.extend({}, root.$where, $whereRC);
                var cellNodes = _(root.unit).map((sUnit) => {
                    return _.extend(inheritRootProps(sUnit, root), {$where: cellWhere});
                });
                matrixOfUnitNodes.setRC(row, col, cellNodes);
            });

            root.$matrix = matrixOfUnitNodes;

            matrixOfUnitNodes.iterate((r, c, cellNodes) => {
                _.each(cellNodes, (refSubNode) => continueTraverse(refSubNode));
            });

            return root;
        }
    };

    return function (unitType) {
        return TUnitMap[unitType] || ((unit) => unit);
    };

})();

export {TUnitVisitorFactory};