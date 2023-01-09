/**
 * @name BaseLight
 * @param {Color} color
 * @param {Number} intensity
 * @param {Number} distance
 */
class BaseLight extends Base3D {
    constructor(color = 0xffffff, intensity = 1, distance = 9999) {
        super();
        this.color = new Color(color);
        this.data = new Vector4();
        this.data2 = new Vector4();
        this.data3 = new Vector4();
        this.properties = new Vector4(intensity, distance, 0, 0);
    }

    destroy() {
        if (this.shadow) {
            Lighting.removeFromShadowGroup(this);
            this.shadow.destroy();
        }
    }

    prepareRender() {
        this.shadow.camera.position.copy(this.position);
        this.shadow.camera.lookAt(this.shadow.target);
    }

    /**
     * @name castShadow
     * @memberof GeometryAttribute
     *
     * @property
     */
    set castShadow(bool) {
        if (!this.shadow && !bool) return;
        if (!this.shadow) this.shadow = new Shadow(this);
        this.shadow.enabled = bool;

        if (!this.silentShadow) {
            if (bool) Lighting.addToShadowGroup(this);
            else Lighting.removeFromShadowGroup(this);
        }
    }

    set intensity(v) {
        this.properties.x = v;
    }

    get intensity() {
        return this.properties.x;
    }

    set distance(v) {
        this.properties.y = v;
    }

    get distance() {
        return this.properties.y;
    }

    set bounce(v) {
        this.properties.z = v;
    }

    get bounce() {
        return this.properties.z;
    }


}