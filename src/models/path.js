export class PathModel {

    constructor(model = {}) {
        var createFunc = ((x) => (() => x));
        this.scaleX = model.scaleX || null;
        this.scaleY = model.scaleY || null;
        this.scaleSize = model.scaleSize || null;
        this.scaleColor = model.scaleColor || null;

        this.yi = model.yi || createFunc(0);
        this.xi = model.xi || createFunc(0);
        this.size = model.size || createFunc(1);
        this.color = model.color || createFunc('');
        this.group = model.group || createFunc('');
    }

    static compose(prev, updates = {}) {
        return (Object
            .keys(updates)
            .reduce((memo, propName) => {
                memo[propName] = updates[propName];
                return memo;
            },
            (new PathModel(prev))));
    }

    static decorator_identity(model) {
        return PathModel.compose(model);
    }

    static decorator_orientation(model, {isHorizontal = false}) {

        var baseScale = (isHorizontal ? model.scaleY : model.scaleX);
        var valsScale = (isHorizontal ? model.scaleX : model.scaleY);

        return PathModel.compose(model, {
            scaleX: baseScale,
            scaleY: valsScale,
            yi: ((d) => (valsScale.value(d[valsScale.dim]))),
            xi: ((d) => (baseScale.value(d[baseScale.dim])))
        });
    }

    static decorator_size(model, {}) {
        return PathModel.compose(model, {
            size: ((d) => (model.scaleSize.value(d[model.scaleSize.dim])))
        });
    }

    static decorator_color(model, {}) {
        return PathModel.compose(model, {
            color: ((d) => model.scaleColor.value(d[model.scaleColor.dim]))
        });
    }

    static decorator_group(model, {}) {
        return PathModel.compose(model, {
            group: ((d) => (d[model.scaleColor.dim]))
        });
    }
}