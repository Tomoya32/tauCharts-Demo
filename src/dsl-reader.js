import {TMatrix} from './matrix';
import {TUnitVisitorFactory} from './unit-visitor-factory';
import {TNodeVisitorFactory} from './node-visitor-factory';
import {UnitDomainMixin} from './unit-domain-mixin';

var cloneObject = (obj) => JSON.parse(JSON.stringify(obj));

export class DSLReader {

    constructor (spec, data) {
        this.spec = cloneObject(spec);
        this.domain = new UnitDomainMixin(this.spec.dimensions, data);
    }

    buildGraph() {
        var buildRecursively = (unit) => TUnitVisitorFactory(unit.type)(this.domain.mix(unit), buildRecursively);
        return buildRecursively(this.spec.unit);
    }

    calcLayout(graph, layoutEngine, size) {

        graph.options = {
            top: 0,
            left: 0,
            width: size.width,
            height: size.height
        };

        return layoutEngine(graph, this.domain);
    }

    renderGraph(styledGraph, target) {

        styledGraph.options.container = target;

        var renderRecursively = (unit) => TNodeVisitorFactory(unit.type)(this.domain.mix(unit), renderRecursively);

        renderRecursively(styledGraph);
        return styledGraph.options.container;
    }
}
