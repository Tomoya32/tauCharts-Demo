import {Emitter} from '../event';
import {utils} from '../utils/utils';
import {utilsDom} from '../utils/utils-dom';
import {CSS_PREFIX} from '../const';
import {FramesAlgebra} from '../algebra';
import {DataFrame} from '../data-frame';
import {default as _} from 'underscore';
import {default as d3} from 'd3';
var cast = (v) => (_.isDate(v) ? v.getTime() : v);

export class GPL extends Emitter {

    constructor(config, scalesRegistryInstance, unitsRegistry) {

        super();

        // jscs:disable
        _.defaults(config.scales, {
            'split_null': {type: 'value', source: '?'},
            'label_null': {type: 'value', source: '?'},
            'identity_null': {type: 'identity', source: '?'},
            'split:default': {type: 'value', source: '?'},
            'label:default': {type: 'value', source: '?'},
            'identity:default': {type: 'identity', source: '?'}
        });
        // jscs:enable

        config.settings = (config.settings || {});

        this.config = config;
        this.sources = config.sources;
        this.scales = config.scales;
        this.unitSet = unitsRegistry;
        this.scalesHub = scalesRegistryInstance;

        this.transformations = _.extend(
            config.transformations || {},
            {
                where(data, tuple) {
                    var predicates = _.map(tuple, (v, k) => {
                        return (row) => (cast(row[k]) === v);
                    });
                    return _(data).filter((row) => {
                        return _.every(predicates, (p) => p(row));
                    });
                }
            });

        this.onUnitDraw = config.onUnitDraw;
        this.onUnitsStructureExpanded = config.onUnitsStructureExpanded || ((x) => (x));
    }

    static destroyNodes (nodes) {
        nodes.forEach((node) => node.destroy());
        return [];
    }

    static traverseSpec(spec, enter, exit, rootNode = null, rootFrame = null) {

        var traverse = (node, enter, exit, parentNode, currFrame) => {

            enter(node, parentNode, currFrame);

            if (node.frames) {
                node.frames.forEach((frame) => {
                    (frame.units || []).map((subNode) => traverse(subNode, enter, exit, node, frame));
                });
            }

            exit(node, parentNode, currFrame);
        };

        traverse(spec.unit, enter, exit, rootNode, rootFrame);
    }

    renderTo(target, xSize) {

        var d3Target = d3.select(target);

        this.config.settings.size = xSize || _.defaults(utilsDom.getContainerSize(d3Target.node()));

        this.root = this._expandUnitsStructure(this.config.unit);

        this.onUnitsStructureExpanded(this.config);

        var xSvg = d3Target.selectAll('svg').data([1]);

        var size = this.config.settings.size;

        var attr = {
            class: (`${CSS_PREFIX}svg`),
            width: size.width,
            height: size.height
        };

        xSvg.attr(attr);

        xSvg.enter()
            .append('svg')
            .attr(attr)
            .append('g')
            .attr('class', `${CSS_PREFIX}cell cell frame-root`);

        // remove from root container
        // make an abstraction over it
        this.root.options = {
            container: d3Target.select('.frame-root'),
            frameId: 'root',
            left: 0,
            top: 0,
            width: size.width,
            height: size.height
        };

        var stack = [{
            allocateRect: () => ({
                container: d3Target.select('.frame-root'),
                frameId: 'root',
                left: 0,
                top: 0,
                width: size.width,
                height: size.height
            })
        }];

        var put = ((x) => stack.unshift(x));
        var pop = (() => stack.shift());
        var top = (() => stack[0]);
        var scenario = [];
        GPL.traverseSpec(
            {unit: this.root},
            // enter
            (unit, parentUnit, currFrame) => {

                var passFrame = (unit.expression.inherit === false) ? null : currFrame;
                var scalesFactoryMethod = this._createFrameScalesFactoryMethod(passFrame);
                var UnitClass = this.unitSet.get(unit.type);

                var rect = top().allocateRect(currFrame.key);
                scenario.push({
                    unit: unit, // without frames. configuration only
                    rect: rect,
                    data: [] // save / unpack frames
                });

                var instance = new UnitClass(
                    _.extend(
                        {
                            adjustPhase: true,
                            fnCreateScale: scalesFactoryMethod
                        },
                        unit,
                        {options: rect}
                    ));

                // TODO: move to constructor / rename
                instance.walkFrames(unit.frames, (x) => x);

                if (unit.units) {
                    // go deep
                    put(instance);
                }
            },
            // exit
            (unit) => {
                if (unit.units) {
                    pop();
                }
            },
            null,
            this._datify({
                source: this.root.expression.source,
                pipe: []
            }));

        Object
            .keys(this.scales)
            .forEach((k) => this.scalesHub.createScaleInfo(this.scales[k]).commit());

        this._drawUnitsStructure(
            this.root,
            this._datify({
                source: this.root.expression.source,
                pipe: []
            }));
    }

    _expandUnitsStructure(root, parentPipe = []) {

        var self = this;

        if (root.expression.operator === false) {

            root.frames = root.frames.map((f) => self._datify(f));

        } else {

            var expr = this._parseExpression(root.expression, parentPipe);

            root.transformation = root.transformation || [];

            root.frames = expr.exec().map((tuple) => {

                var flow = (expr.inherit ? parentPipe : []);
                var pipe = (flow)
                    .concat([{type: 'where', args: tuple}])
                    .concat(root.transformation);

                return self._datify({
                    key: tuple,
                    pipe: pipe,
                    source: expr.source,
                    units: (root.units) ?
                        root.units.map((unit) => {
                            var clone = utils.clone(unit);
                            // pass guide by reference
                            clone.guide = unit.guide;
                            return clone;
                        }) :
                        []
                });
            });
        }

        root.frames.forEach(
            (f) => (f.units.forEach(
                (unit) => this._expandUnitsStructure(unit, f.pipe)
            ))
        );

        return root;
    }

    _createFrameScalesFactoryMethod(passFrame) {
        var self = this;
        return ((type, alias, dynamicProps) => {
            var key = (alias || `${type}:default`);
            return self
                .scalesHub
                .createScaleInfo(self.scales[key], passFrame)
                .create(dynamicProps);
        });
    }

    _drawUnitsStructure(unitConfig, rootFrame, rootUnit = null) {

        var self = this;

        // Rule to cancel parent frame inheritance
        var passFrame = (unitConfig.expression.inherit === false) ? null : rootFrame;
        var scalesFactoryMethod = this._createFrameScalesFactoryMethod(passFrame);

        var UnitClass = self.unitSet.get(unitConfig.type);
        var node = new UnitClass(_.extend(
            {
                fnCreateScale: scalesFactoryMethod
            },
            unitConfig
        ));
        node.parentUnit = rootUnit;
        node.drawFrames(
            (unitConfig.frames),
            (function (rootUnit) {
                return function (rootConf, rootFrame) {
                    self._drawUnitsStructure.bind(self)(rootConf, rootFrame, rootUnit);
                };
            }(node)));

        if (self.onUnitDraw) {
            self.onUnitDraw(node);
        }

        return unitConfig;
    }

    _datify(frame) {
        return new DataFrame(frame, this.sources[frame.source].data, this.transformations);
    }

    _parseExpression(expr, parentPipe) {

        var funcName = expr.operator || 'none';
        var srcAlias = expr.source;
        var bInherit = expr.inherit !== false; // true by default
        var funcArgs = expr.params;

        var frameConfig = {
            source: srcAlias,
            pipe: bInherit ? parentPipe : []
        };

        var dataFn = () => this._datify(frameConfig).part();

        var func = FramesAlgebra[funcName];

        if (!func) {
            throw new Error(`${funcName} operator is not supported`);
        }

        return {
            source: srcAlias,
            inherit: bInherit,
            func: func,
            args: funcArgs,
            exec: () => func.apply(null, [dataFn].concat(funcArgs))
        };
    }
}