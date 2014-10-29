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

    'year': d3.time.format('%Y')
};

var FormatterRegistry = {

    get: (formatAlias) => (FORMATS_MAP[formatAlias] || d3.format(formatAlias)),

    add: (formatAlias, formatter) => {
        FORMATS_MAP[formatAlias] = formatter;
    }
};

export {FormatterRegistry};