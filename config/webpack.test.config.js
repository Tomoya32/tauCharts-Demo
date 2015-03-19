var webpack = require('webpack');
var path = require('path');
module.exports = {
    resolve: {
        root: [
            path.resolve('.')
        ],
        modulesDirectories: [
            'bower_components',
            'node_modules'
        ],
        alias: {
            'schemes': 'test/utils/schemes.js',
            'testUtils': 'test/utils/utils.js',
            'es5-shim': 'libs/es5-shim.js',
            'brewer': 'src/addons/color-brewer.js',
            'tauCharts': 'src/tau.charts.js',
            'print.style.css': 'plugins/print.style.css',
            'rgbcolor': 'bower_components/canvg/rgbcolor.js',
            'stackblur': 'bower_components/canvg/StackBlur.js',
            'canvg': 'bower_components/canvg/canvg.js',
            'FileSaver': 'test/utils/saveAs.js',
            'fetch': 'bower_components/fetch/fetch.js',
            'promise': 'bower_components/es6-promise/promise.js'
        },
        extensions: ['', '.js', '.json']
    },
    devtool: 'inline-source-map',
    module: {
        loaders: [
            {test: /\.css$/, loader: 'css-loader'},
            {
                test: /modernizer[\\\/]modernizr\.js$/,
                loader: 'imports?this=>window!exports?window.Modernizr'
            },
            {
                test: /\.js$/,
                exclude: /node_modules|libs|bower_components/,
                loader: 'babel-loader'
            }
        ],
        postLoaders: [{ // << add subject as webpack's postloader
            test: /\.js$/,
            exclude: /test|addons|plugins|node_modules|bower_components|libs\//,
            loader: 'istanbul-instrumenter'
        }]
    },
    externals: {
        _: 'underscore'
    },

    plugins: [
        new webpack.ProvidePlugin({
            d3: 'd3',
            _: 'underscore'
        })
    ],
    debug: false,
    stats: {
        colors: true,
        reasons: true
    },
    progress: true
};