/**
 * @name Scene
 * @extends Base3D
 */
class Scene extends Base3D {
    constructor() {
        super();
        this.autoUpdate = true;
        this.toRender = [[], []];
        this._displayNeedsUpdate = true;
        this.isScene = true;
        this.changes = [];
    }

    set displayNeedsUpdate(v) {
        if (v === true) this.changes.forEach(cb => cb());
        this._displayNeedsUpdate = v;
    }

    get displayNeedsUpdate() {
        return this._displayNeedsUpdate;
    }

    bindSceneChange(cb) {
        this.changes.push(cb);
    }
}