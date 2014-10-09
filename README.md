tauCharts [![Build Status](https://travis-ci.org/TargetProcess/tauCharts.png?branch=master)](https://travis-ci.org/TargetProcess/tauCharts) [![Coverage Status](https://img.shields.io/coveralls/TargetProcess/tauCharts.svg)](https://coveralls.io/r/TargetProcess/tauCharts)
=========

Dev: 

Use grunt to build everything. Maybe 'bower install' is required

[Live prototype](https://targetprocess.github.io/tauCharts/)

How it looks right now

![ScreenShot](http://www.taucharts.com/images/charts.png)

Usage:

see [prototype](https://github.com/TargetProcess/tauCharts/tree/master/prototype) for examples of usage

example
scatterplot
```javascript
 var scatter = {
        container: '#simple-container',
        W: 800,
        H: 800,
        dimensions: {
            project: { scaleType: 'ordinal' },
            team: { scaleType: 'ordinal' },
            cycleTime: { scaleType: 'linear' },
            effort: { scaleType: 'linear' }
        },
        unit: {
            type: 'COORDS.RECT',
            showGridLines: 'xy',
            padding: { L:36, B:36, R:8, T:8 },
            axes: [
                {
                    scaleDim: 'cycleTime',
                    scaleType: 'linear',
                    label: '<h4>cycle time</h4>',
                    padding: 8,
                    bubble: true
                },
                {
                    scaleDim: 'effort',
                    scaleType: 'linear',
                    label: '<h4>effort</h4>',
                    padding: 8,
                    bubble: true
                }
            ],
            unit: [
                {
                    type: 'ELEMENT.POINT',
                    x: 'cycleTime',
                    y: 'effort',
                    color: 'effort',
                    size: 'cycleTime',
                    shape: null
                }
            ]
        }
    };
    var chart = new tauChart.Chart({data: data, spec: scatter, plugins: [tau.plugins.tooltip('team', 'count', 'month'), tau.plugins.highlighter()]});
```
or alias
```javascript
     var chart = new m.tauChart.Scatterplot({
                    container: '#chart-container',
                    width: 600,
                    height: 600,
                    data: JSON.parse($data.val()),
                    plugins: [tau.plugins.tooltip('team', 'effort', 'team','count'), tau.plugins.highlighter()],
                    x: getFieldData($x),
                    y: getFieldData($y),
                    color: getFieldData($color),
                    size: getFieldData($size)
                });
```
