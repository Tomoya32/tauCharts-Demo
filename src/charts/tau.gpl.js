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

        var root = {
            allocateRect: () => ({
                slot: (() => d3Target.select('.frame-root')),
                frameId: 'root',
                left: 0,
                top: 0,
                width: size.width,
                containerWidth: size.width,
                height: size.height,
                containerHeight: size.height
            })
        };

        this._flattenDrawScenario(root, (parentInstance, unit, rootFrame) => {
            // Rule to cancel parent frame inheritance
            var frame = (unit.expression.inherit === false) ? null : rootFrame;
            var scalesFactoryMethod = this._createFrameScalesFactoryMethod(frame);
            var UnitClass = this.unitSet.get(unit.type);

            var rect = parentInstance.allocateRect(rootFrame.key);
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
            return instance;
        });

        Object
            .keys(this.scales)
            .forEach((k) => this.scalesHub.createScaleInfo(this.scales[k]).commit());

        var drawScenario = this._flattenDrawScenario(root, (parentInstance, unit, rootFrame) => {
            var frame = (unit.expression.inherit === false) ? null : rootFrame;
            var scalesFactoryMethod = this._createFrameScalesFactoryMethod(frame);
            var UnitClass = this.unitSet.get(unit.type);

            var rect = parentInstance.allocateRect(rootFrame.key);
            var instance = new UnitClass(
                _.extend(
                    {fnCreateScale: scalesFactoryMethod},
                    unit,
                    {options: rect}
                ));

            instance.parentUnit = parentInstance;

            instance.walkFrames(unit.frames, (x) => x);
            return instance;
        });

        drawScenario.forEach((item) => {
            item.config.options.container = item.config.options.slot(item.config.uid);
            item.drawFrames(item.config.frames, (x) => x);
            if (this.onUnitDraw) {
                this.onUnitDraw(item);
            }
        });
    }

    _flattenDrawScenario(root, iterator) {

        var uid = 0;
        var scenario = [];

        var stack = [root];

        var put = ((x) => stack.unshift(x));
        var pop = (() => stack.shift());
        var top = (() => stack[0]);

        GPL.traverseSpec(
            {unit: this.root},
            // enter
            (unit, parentUnit, currFrame) => {

                unit.uid = ++uid;
                unit.guide = utils.clone(unit.guide);

                var instance = iterator(top(), unit, currFrame);

                scenario.push(instance);

                if (unit.type.indexOf('COORDS.') === 0) {
                    put(instance);
                }
            },
            // exit
            (unit) => {
                if (unit.type.indexOf('COORDS.') === 0) {
                    pop();
                }
            },
            null,
            this._datify({
                source: this.root.expression.source,
                pipe: []
            }));

        return scenario;
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