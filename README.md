tauCharts [![Build Status](https://travis-ci.org/TargetProcess/tauCharts.png?branch=master)](https://travis-ci.org/TargetProcess/tauCharts) [![Coverage Status](https://img.shields.io/coveralls/TargetProcess/tauCharts.svg)](https://coveralls.io/r/TargetProcess/tauCharts)

[![Build Status](https://www.gitbook.io/button/status/book/mdubakov/taucharts-guide)](https://www.gitbook.io/book/mdubakov/taucharts-guide/activity)
=========

tauCharts is a JavaScript charting library based on D3. Designed with passion.

Official website: [www.taucharts.com](http://www.taucharts.com)

Licensing: [Creative Common Attribution-NonCommercial 3.0](http://creativecommons.org/licenses/by-nc/3.0/)

Have a questions? [Contact us](mailto:michael@targetprocess.com)

=========

Dev:

Use grunt to build everything. Maybe 'bower install' is required

[Live prototype](https://targetprocess.github.io/tauCharts/)

How it looks right now

![ScreenShot](http://www.taucharts.com/images/charts.png)

Usage:

see [prototype](https://github.com/TargetProcess/tauCharts/tree/master/prototype) for examples of usage

##Custom colors for encoding color value
You can set custom colors for encoding color value or use bundles some fantastic categorical color scales by [Cynthia Brewer](http://colorbrewer2.org/).
If you want use colorbrewer, you should include following code in your pages
```HTML
 <link href="path_to_tauCharts/css/colorbrewer.css" rel="stylesheet"/>
 <script src="path_to_tauCharts/src/addons/color-brewer.js"></script>
```
and for define color should use
```javascript
var spec = {
  unit:[{
       type: 'ELEMENT.INTERVAL',
       x: 'month',
       y: 'count',
       color: {dimension:'team', brewer:tauBrewer(YlGnBu,9)}
   }]
};
```
if you want use custom bandles you can define following method
```javascript
var spec = {
  unit:[{
       type: 'ELEMENT.INTERVAL',
       x: 'month',
       y: 'count',
       color: {dimension:'team', brewer:['myColorCssClass1','myColorCssClass2','myColorCssClass3']}
   }]
};
```
or if you want have mapping from your domain
```javascript
var spec = {
  unit:[{
       type: 'ELEMENT.INTERVAL',
       x: 'month',
       y: 'count',
       color: {dimension:'team', brewer:{
        NewTeam:'myColorCssClass1',
        Alaska:'myColorCssClass2',
        oldTeam:'myColorCssClass3'
       }
       }
   }]
};
```
