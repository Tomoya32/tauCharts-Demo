import {utilsDraw} from '../utils/utils-draw';
var line = function (node) {

    var options = node.options || {};
    options.xScale = node.scaleTo(node.x, [0, options.width]);
    options.yScale = node.scaleTo(node.y, [options.height, 0]);
    var categories = d3.nest()
        .key(function(d){
            return node.color && d[node.color];
        })
        .entries(node.partition());
    var color = utilsDraw.generateColor(node);
    var updateLines = function () {
        this.attr('class', function(d){
            return 'line ' + color(d);
        });
        var paths = this.selectAll('path').data(function (d) {
            return [d.values];
        });
        paths.call(updatePaths);
        paths.enter().append('path').call(updatePaths);
        paths.exit().remove();
    };

    var line = d3.svg.line()
        .x((d) => options.xScale(d[node.x]))
        .y((d) => options.yScale(d[node.y]));

    var updatePaths = function () {
        this.attr('d', line);
    };



    var lines = options.container.selectAll('.line').data(categories);
    lines.call(updateLines);
    lines.enter().append('g').call(updateLines);
    lines.exit().remove();

};
export {line};