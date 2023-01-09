/**
 * @name CubeCamera
 * @extends Base3D
 * @param near
 * @param far
 * @param cubeResolution
 */
class CubeCamera extends Base3D {
    constructor(near = 0.1, far = 1000, cubeResolution = 512) {
        super();
        const fov = 90;
        const aspect = 1;

        this.px = new PerspectiveCamera(fov, aspect, near, far);
        this.px.up.set(0, -1, 0);
        this.px.lookAt(new Vector3(1, 0, 0));
        this.add(this.px);

        this.nx = new PerspectiveCamera(fov, aspect, near, far);
        this.nx.up.set(0, -1, 0);
        this.nx.lookAt(new Vector3(-1, 0, 0));
        this.add(this.nx);

        this.py = new PerspectiveCamera(fov, aspect, near, far);
        this.py.up.set(0, 0, 1);
        this.py.lookAt(new Vector3(0, 1, 0));
        this.add(this.py);

        this.ny = new PerspectiveCamera(fov, aspect, near, far);
        this.ny.up.set(0, 0, -1);
        this.ny.lookAt(new Vector3(0, -1, 0));
        this.add(this.ny);

        this.pz = new PerspectiveCamera(fov, aspect, near, far);
        this.pz.up.set(0, -1, 0);
        this.pz.lookAt(new Vector3(0, 0, 1));
        this.add(this.pz);

        this.nz = new PerspectiveCamera(fov, aspect, near, far);
        this.nz.up.set(0, -1, 0);
        this.nz.lookAt(new Vector3(0, 0, -1));
        this.add(this.nz);

        this.rt = new CubeRenderTarget(cubeResolution, cubeResolution);
    }

    /**
     * @name this.render
     * @memberof CubeCamera
     *
     * @function
     * @param scene
     * @param renderer
    */
    render(scene = World.SCENE, renderer = World.RENDERER) {
        let rt = this.rt;

        this.updateMatrixWorld(true);

        this.beforeRender && this.beforeRender(this.px);
        rt.activeFace = 0;
        renderer.render(scene, this.px, rt);
        this.afterRender && this.afterRender(rt);

        this.beforeRender && this.beforeRender(this.nx);
        rt.activeFace = 1;
        renderer.render(scene, this.nx, rt);
        this.afterRender && this.afterRender(rt);

        this.beforeRender && this.beforeRender(this.py);
        rt.activeFace = 2;
        renderer.render(scene, this.py, rt);
        this.afterRender && this.afterRender(rt);

        this.beforeRender && this.beforeRender(this.ny);
        rt.activeFace = 3;
        renderer.render(scene, this.ny, rt);
        this.afterRender && this.afterRender(rt);

        this.beforeRender && this.beforeRender(this.pz);
        rt.activeFace = 4;
        renderer.render(scene, this.pz, rt);
        this.afterRender && this.afterRender(rt);

        this.beforeRender && this.beforeRender(this.nz);
        rt.activeFace = 5;
        renderer.render(scene, this.nz, rt);
        this.afterRender && this.afterRender(rt);
    }
}
