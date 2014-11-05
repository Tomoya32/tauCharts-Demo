import {utils} from './utils/utils';
import {utilsDraw} from './utils/utils-draw';
import {TMatrix} from './matrix';

var fnDefaultLayoutEngine = (rootNode, domainMixin) => {

    var fnTraverseLayout = (rawNode) => {

        var node = utilsDraw.applyNodeDefaults(rawNode);

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

    return fnTraverseLayout(rootNode);
};

var LayoutEngineTypeMap = {

    'DEFAULT': fnDefaultLayoutEngine,

    'SHARE-AXES': (rootNode, domainMixin) => {

        var traverse = ((node, level, wrapper) => {

            node.$matrix.iterate((r, c, subNodes) => {

                if (r === 0 || c === 0) {

                    let subNode = utilsDraw.applyNodeDefaults(subNodes[0]);
                    if (subNode.$matrix) {

                        let subAxis = _.extend(utils.clone(_.omit(subNode, '$matrix')), {type: 'WRAP.AXIS'});

                        if (r === 0) {
                            wrapper.x[level] = wrapper.x[level] || [];
                            wrapper.x[level].push(subAxis);
                        }

                        if (c === 0) {
                            wrapper.y[level] = wrapper.y[level] || [];
                            wrapper.y[level].push(subAxis);
                        }

                        traverse(subNode, level + 1, wrapper);
                    }
                }
            });

            return node;
        });

        var wrapperNode = utilsDraw.applyNodeDefaults({
            type: 'WRAPPER.SHARED.AXES',
            options: utils.clone(rootNode.options),
            x: [],
            y: [],
            $matrix: new TMatrix([[[rootNode]]])
        });

        return traverse(domainMixin.mix(wrapperNode), 0, wrapperNode);
    },

    'EXTRACT-AXES': (rootNode, domainMixin) => {

        var fnExtractAxesTransformation = ((root) => {

            var traverse = ((rootNode, wrapperNode) => {

                var node = utilsDraw.applyNodeDefaults(rootNode);

                _.each([node.guide.x || {}, node.guide.y || {}], (a) => a.hide = true);

                var nRows = node.$matrix.sizeR();
                var nCols = node.$matrix.sizeC();

                wrapperNode.$axes = new TMatrix(nRows, nCols);

                node.$matrix.iterate((r, c, subNodes) => {

                    var axesMap = [];
                    wrapperNode.$axes.setRC(r, c, axesMap);

                    var isHeadCol = (c === 0);
                    var isTailRow = (r === (nRows - 1));

                    subNodes.forEach((subNode) => {
                        var node = utilsDraw.applyNodeDefaults(subNode);
                        if (node.$matrix) {
                            var axis = _.extend(utils.clone(_.omit(node, '$matrix')), { type: 'WRAP.AXIS' });
                            axesMap.push(axis);

                            node.guide.padding.l = 0;
                            node.guide.padding.b = 0;

                            axis.guide.padding.l = (isHeadCol ? axis.guide.padding.l : 0);
                            axis.guide.padding.b = (isTailRow ? axis.guide.padding.b : 0);

                            traverse(node, axis);
                        }
                    });
                });

                return node;
            });

            var wrapperNode = utilsDraw.applyNodeDefaults({
                type: 'WRAP.MULTI_AXES',
                options: utils.clone(root.options),
                x: {},
                y: {},
                $matrix: new TMatrix([[[root]]])
            });

            traverse(domainMixin.mix(wrapperNode), wrapperNode);

            wrapperNode.$matrix = new TMatrix([
                [
                    [
                        utilsDraw.applyNodeDefaults({
                            type: 'WRAP.MULTI_GRID',
                            x: {},
                            y: {},
                            $matrix: new TMatrix([[[root]]])
                        })
                    ]
                ]
            ]);

            return wrapperNode;
        });

        var fnTraverseExtAxesLayout = (wrapperNode) => {

            var multiAxisDecorator = (node) => {

                var options = node.options;
                var padding = node.guide.padding;

                var innerW = options.width - (padding.l + padding.r);
                var innerH = options.height - (padding.t + padding.b);

                var nR = node.$axes.sizeR();
                var nC = node.$axes.sizeC();

                var leftBottomItem = utilsDraw.applyNodeDefaults(node.$axes.getRC(nR - 1, 0)[0] || {});
                var lPadding = leftBottomItem.guide.padding.l;
                var bPadding = leftBottomItem.guide.padding.b;

                var sharedWidth = (innerW - lPadding);
                var sharedHeight = (innerH - bPadding);

                var cellW = sharedWidth / nC;
                var cellH = sharedHeight / nR;

                node.$axes.iterate((iRow, iCol, subNodes) => {

                    var isHeadCol = (iCol === 0);
                    var isTailRow = (iRow === (nR - 1));

                    if (isHeadCol || isTailRow) {

                        subNodes.forEach((node) => {
                            node.options = {
                                showX: isTailRow,
                                showY: isHeadCol,

                                width : cellW + (isHeadCol ? lPadding: 0),
                                height: cellH + (isTailRow ? bPadding: 0),

                                top : iRow * cellH,
                                left: iCol * cellW + (isHeadCol ? 0 : lPadding)
                            };

                            if (node.$axes) {
                                multiAxisDecorator(node);
                            }
                        });
                    }
                });

                return node;
            };

            multiAxisDecorator(wrapperNode);

            var gridL = 0;
            var gridB = 0;
            var axisOffsetTraverser = (node) => {
                var padding = node.guide.padding;
                var nR = node.$axes.sizeR();
                node.$axes.iterate((iRow, iCol, subNodes) => {
                    if (iCol === 0 && (iRow === (nR - 1))) {
                        gridL += padding.l;
                        gridB += padding.b;
                        subNodes.forEach((node) => axisOffsetTraverser(node));
                    }
                });

                return node;
            };

            axisOffsetTraverser(wrapperNode);

            var gridW = wrapperNode.options.width - gridL;
            var gridH = wrapperNode.options.height - gridB;

            var refRoot = wrapperNode.$matrix.getRC(0, 0)[0];
            refRoot.options = {
                top: 0,
                left: gridL,
                width: gridW,
                height: gridH
            };

            fnDefaultLayoutEngine(refRoot, domainMixin);

            return wrapperNode;
        };

        return (fnTraverseExtAxesLayout(fnExtractAxesTransformation(rootNode)));
    }
};

var LayoutEngineFactory = {

    get: (typeName) => {
        return (LayoutEngineTypeMap[typeName] || LayoutEngineTypeMap.DEFAULT).bind(this);
    }

};

export {LayoutEngineFactory};