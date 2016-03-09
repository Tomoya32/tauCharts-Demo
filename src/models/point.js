export class PointModel {

    constructor(model = {}) {
        var createFunc = ((x) => (() => x));
        this.scaleX = model.scaleX || null;
        this.scaleY = model.scaleY || null;
        this.yi = model.yi || createFunc(0);
        this.xi = model.xi || createFunc(0);
        this.size = model.size || createFunc(1);
        this.color = model.color || createFunc('');
    }

    static compose(prev, updates = {}) {
        return (Object
            .keys(updates)
            .reduce((memo, propName) => {
                memo[propName] = updates[propName];
                return memo;
            },
            (new PointModel(prev))));
    }

    static decorator_identity(model) {
        return PointModel.compose(model);
    }

    static decorator_orientation(model, {xScale, yScale, isHorizontal = false}) {

        var baseScale = (isHorizontal ? yScale : xScale);
        var valsScale = (isHorizontal ? xScale : yScale);

        return PointModel.compose(model, {
            scaleX: baseScale,
            scaleY: valsScale,
            yi: ((d) => (valsScale(d[valsScale.dim]))),
            xi: ((d) => (baseScale(d[baseScale.dim])))
        });
    }

    static decorator_size(model, {sizeScale}) {
        return PointModel.compose(model, {
            size: ((d) => (sizeScale(d[sizeScale.dim])))
        });
    }

    static decorator_color(model, {colorScale}) {
        return PointModel.compose(model, {
            color: ((d) => colorScale(d[colorScale.dim]))
        });
    }
}