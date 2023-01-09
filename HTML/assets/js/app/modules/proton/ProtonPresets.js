Class(function ProtonPresets() {
    const _this = this;

    const LIST = [
        {label: 'Custom Code', value: 'custom'},
        {label: 'Curl Noise', value: 'curl'},
        {label: 'Sine Move', value: 'sine'},
        {label: 'Plane Shape', value: 'planeshape'},
        {label: '3D Shape', value: '3dshape'},
        {label: 'Point Cloud', value: 'pointcloud'},
        {label: 'Force', value: 'force'},
        {label: 'Follow', value: 'follow'},
        {label: 'Mouse Fluid', value: 'fluid'}
    ];

    const CALLBACKS = {
        'custom': customCode,
        'curl': curlNoise,
        'sine': sineMove,
        'planeshape': planeShape,
        '3dshape': shape3D,
        'pointcloud': pointCloud,
        'force': force,
        'follow': follow,
        'fluid': fluid,
    };

    function customCode(input) {
        input.setValue('name', 'Custom Code');
        input.setLabel('Custom Code');
    }

    function sineMove(input) {
        input.setValue('name', 'Sine Move');
        input.setLabel('Sine Move');

        let uniforms = `
        uSinSpeed: 1
        uSinMovement: 0
        `;

        let code = `pos = origin;
pos.x += sin(time*uSinSpeed + radians(360.0 * random.x)) * 0.03 * random.z * uSinMovement;
pos.y += sin(time*uSinSpeed + radians(360.0 * random.y)) * 0.03 * random.w * uSinMovement;
pos.z += sin(time*uSinSpeed + radians(360.0 * random.w)) * 0.03 * random.x * uSinMovement;`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'uSinSpeed');
    }

    function curlNoise(input) {
        input.setValue('name', 'Curl Noise');
        input.setLabel('Curl Noise');

        let uniforms = `
        uCurlNoiseScale: 1
        uCurlTimeScale: 0
        uCurlNoiseSpeed: 0
        `;

        let code = `#require(curl.glsl)

vec3 curl = curlNoise(pos * uCurlNoiseScale*0.1 + (time * uCurlTimeScale * 0.1));
pos += curl * uCurlNoiseSpeed * 0.01 * HZ;`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'uCurlNoise');
    }

    function fluid(input) {
        input.setValue('name', 'Mouse Fluid');
        input.setLabel('Mouse Fluid');

        let code = `#require(glscreenprojection.glsl)

vec3 mpos = vec3(uModelMatrix * vec4(pos, 1.0));
vec2 screenUV = getProjection(mpos, uProjMatrix);
vec3 flow = vec3(texture2D(tFluid, screenUV).xy, 0.0);
applyNormal(flow, uProjNormalMatrix);
pos += flow * 0.0001 * uMouseStrength * texture2D(tFluidMask, screenUV).r;`;

        let uniforms = `
        uProjMatrix: Cmat4
        uProjNormalMatrix: Cmat4
        uModelMatrix: Cmat4
        tFluidMask: Csampler2D
        tFluid: Csampler2D
        uMouseStrength: 1
        `;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'glscreenprojection');

        let findCamera = proton => {
            let camera = World.CAMERA;
            let p = proton.group._parent;
            while (p) {
                if (p instanceof Scene) {
                    if (p.nuke) camera = p.nuke.camera;
                }
                p = p._parent;
            }
            return camera;
        };

        input.customPresetCallback = async proton => {
            if (!('MouseFluid' in window)) {
                alert(`'mousefluid' module not found. To use Mouse Fluid preset, import module, load the MouseFluid \
class, and add a layer named 'fluid' with customCLass FluidLayer.`)
                return;
            }

            let camera = findCamera(proton);
            let projection = proton.initClass(GLScreenProjection, camera);
            projection.start();
            proton.projection = projection;

            if (Global.PLAYGROUND) {
                Render.start(_ => {
                    let newCamera = findCamera(proton);
                    if (newCamera != camera) {
                        camera = newCamera;
                        projection.camera = camera;
                    }
                }, 10);
            }

            proton.wait('behavior').then(_ => {
                proton.behavior.addUniforms({
                    uProjMatrix: projection.uniforms.projMatrix,
                    uModelMatrix: projection.uniforms.modelMatrix,
                    uProjNormalMatrix: projection.uniforms.normalMatrix,
                });

                MouseFluid.instance().applyTo(proton.behavior);
            });
        };
    }

    function planeShape(input) {
        input.setValue('name', 'Plane Shape');
        input.setLabel('Plane Shape');

        let uniforms = `
        uTakePlaneShape: 1
        uPlaneScale: 1
        tPlaneTexture: Csampler2D
        `;

        let code = `vec2 planeLookup = texture2D(tPlaneTexture, uv).xy;
vec3 plane;
plane.x = uPlaneScale * 0.5 * range(planeLookup.x, 0.0, 1.0, -1.0, 1.0);
plane.y = uPlaneScale * 0.5 * -range(planeLookup.y, 0.0, 1.0, -1.0, 1.0);
if (uTakePlaneShape > 0.5) pos = plane;`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'uPlaneScale');

        input.customPresetCallback = proton => {
            proton.behavior.addUniforms({
                tPlaneTexture: {value: null}
            });
        };
    }

    function shape3D(input) {
        input.setValue('name', '3D Shape');
        input.setLabel('3D Shape');

        input.add('geometry');
        let geometry = input.get('geometry');

        let uniforms = `
        tShape3D: Csampler2D
        `;
        let code = `vec3 shape3d = texture2D(tShape3D, uv).xyz;`

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'tShape3D');

        input.customPresetCallback = proton => {
            let create = async g => {
                let geom = await GeomThread.loadGeometry(g);
                let distribution = await ParticleDistributor.generate(geom, proton.antimatter.particleCount);
                let attribute = new AntimatterAttribute(distribution, 3);
                proton.behavior.addInput('tShape3D', attribute);
            };

            if (geometry) create(geometry);
            proton.set3DShape = create;
        };
    }

    function pointCloud(input) {
        input.setValue('name', 'Point Cloud');
        input.setLabel('Point Cloud');

        input.add('file');
        let file = input.get('file');

        let uniforms = `
        tPointCloud: Csampler2D
        `;
        let code = `vec3 pointShape = texture2D(tPointCloud, uv).xyz;`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'tPointCloud');

        input.customPresetCallback = proton => {
            let create = async filePath => {
                let data;
                if (typeof filePath === 'string') {
                    filePath += '-' +  proton.antimatter.powerOf2;
                    data = await ParticleDistributor.generatePointCloud(filePath, proton.antimatter.textureSize);
                } else {
                    data = filePath;
                }

                if (proton.behavior.shader.uniforms.tPointCloud) {
                    proton.behavior.shader.uniforms.tPointCloud.value.destroy();
                    proton.shader.uniforms.tPointColor.value.destroy();
                }

                proton.behavior.addInput('tPointCloud', data.positions);
                proton.shader.addUniforms({
                    tPointColor: { value: data.colors },
                });
            };

            if (!file) file = proton.parent.data ? proton.parent.data.pointCloudFile : undefined;
            if (file) create(file);
            proton.setPointCloud = create;
        };
    }

    function force(input) {
        input.setValue('name', 'Force');
        input.setLabel('Force');

        let uniforms = `
        uForceDir: [0, 1, 0]
        uForceScale: 1
        `;

        let code = `vec3 force = normalize(uForceDir) * uForceScale * 0.1;
pos += force * HZ;`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'uForceDir');
    }

    function follow(input) {
        input.setValue('name', 'Follow');
        input.setLabel('Follow');

        let uniforms = `
        uFollowPos: [0, 0, 0]
        uFollowRadius: 2
        uFollowLerp: 0.7
        `;

        let code = `float speed = range(random.x, 0.0, 1.0, 0.5, 1.5);
vec3 followPos = uFollowPos;
followPos.x += range(random.y, 0.0, 1.0, -1.0, 1.0) * uFollowRadius;
followPos.y += range(random.z, 0.0, 1.0, -1.0, 1.0) * uFollowRadius;
followPos.z += range(random.w, 0.0, 1.0, -1.0, 1.0) * uFollowRadius;
pos += (followPos - pos) * (uFollowLerp*0.1*speed*HZ);`;

        input.setValue('uniforms', uniforms);
        setPresetCodeIfRequired(input, code, 'followPos');
    }

    function setPresetCodeIfRequired(input, presetCode, keyShaderComponentString) {
        const editorCode = input.get('code');
        if (!editorCode || !editorCode.includes(keyShaderComponentString)) {
            input.setValue('code', presetCode);
        }
    }

    //*** Event handlers

    //*** Public methods
    this.register = function(name, callback) {
        let key = name.replace(/ /g, '').toLowerCase();
        LIST.push({label: name, value: key});
        CALLBACKS[key] = callback;
    }

    this.bind = function(input) {
        input.add('code', 'hidden');

        let editCode = _ => {
            let editor = new UILExternalEditor(input.get('name') || 'Code', 300);
            editor.setCode(input.get('code'), 'c');
            editor.onSave = value => {
                input.setValue('code', value);
                _this.onCodeEdit?.();
            };
            UIL.add(editor);
        };

        input.add('uniforms', 'hidden');

        input.addSelect('preset', LIST);

        let callback = CALLBACKS[input.get('preset')];
        if (callback) callback(input);

        input.addButton('btn', {actions: [{title:'Edit Code', callback: editCode}], hideLabel:true});
    }
}, 'static');