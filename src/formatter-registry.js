/* jshint ignore:start */
import * as d3 from 'd3';
/* jshint ignore:end */
var FORMATS_MAP = {

    'day': d3.time.format('%d-%b-%Y'),

    'week': d3.time.format('%d-%b-%Y'),

    'week-range': (x) => {
        var sWeek = new Date(x);
        var clone = new Date(x);
        var eWeek = new Date(clone.setDate(clone.getDate() + 7));
        var format = d3.time.format('%d-%b-%Y');
        return format(sWeek) + ' - ' + format(eWeek);
    },

    'month': (x) => {
        var d = new Date(x);
        var m = d.getMonth();
        var formatSpec = (m === 0) ? '%B, %Y' : '%B';
        return d3.time.format(formatSpec)(x);
    },

    'month-year': d3.time.format('%B, %Y'),

    'quarter': (x) => {
        var d = new Date(x);
        var m = d.getMonth();
        var q = (m - (m % 3)) / 3;
        return 'Q' + (q + 1) + ' ' + d.getFullYear();
    },

    'year': d3.time.format('%Y'),

    'x-time-auto': d3.time.format.multi([
        [".%L", function(d) { return d.getMilliseconds(); }],
        [":%S", function(d) { return d.getSeconds(); }],
        ["%I:%M", function(d) { return d.getMinutes(); }],
        ["%I %p", function(d) { return d.getHours(); }],
        ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
        ["%b %d", function(d) { return d.getDate() != 1; }],
        ["%B", function(d) { return d.getMonth(); }],
        ["%Y", function() { return true; }]
    ])
};

var FormatterRegistry = {

    get: (formatAlias, tickFormatLimit) => {

        var cut = (str) => {
            var limit = tickFormatLimit || 1000;
            return (str.length <= limit) ?
                (str) :
                (str.substr(0, limit - 1) + '...');
        };

        var formatter = (formatAlias === null) ? ((x) => x.toString()) : FORMATS_MAP[formatAlias];
        if (!formatter) {
            formatter = (v) => {
                var f = _.isDate(v) ? d3.time.format(formatAlias) : d3.format(formatAlias);
                return f(v);
            };
        }
        return (str) => (cut(formatter(str)));
    },

    add: (formatAlias, formatter) => {
        FORMATS_MAP[formatAlias] = formatter;
    }
};

export {FormatterRegistry};