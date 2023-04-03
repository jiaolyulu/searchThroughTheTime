Class(function ParticleDistributor() {
    Inherit(this, Component);
    const _this = this;

    function init() {
        if (!_this.flag('initGenerate')) {
            _this.flag('initGenerate', true);
            Thread.upload(distributeParticles);
            Thread.upload(generatePointCloud);
            Thread.upload(generatePointGrid);
        }
    }

    function distributeParticles(e, id) {
        let { position, count, normal, uv, skinIndex, skinWeight, offset, scale, orientation } = e;
        let vertices = position.length / 3;
        let v3 = new Vector3();
        let v32 = new Vector3();
        let v33 = new Vector3();
        let q = new Quaternion();
        let outputPosition = new Float32Array(count * 3);
        let outputNormal = normal ? new Float32Array(count * 3) : null;
        let outputUV = uv ? new Float32Array(count * 3) : null;
        let outputSkinIndex = skinIndex ? new Float32Array(count * 4) : null;
        let outputSkinWeight = skinWeight ? new Float32Array(count * 4) : null;

        for (let i = 0; i < count; i++) {
            let j = Math.random(0, vertices / 3) * 3;

            v3.set(Math.random(0, 100), Math.random(0, 100), Math.random(0, 100));
            let m = 1 / (v3.x + v3.y + v3.z);
            v3.set(v3.x * m, v3.y * m, v3.z * m);

            outputPosition[i * 3 + 0] = position[j * 3 + 0] * v3.x + position[j * 3 + 3] * v3.y + position[j * 3 + 6] * v3.z;
            outputPosition[i * 3 + 1] = position[j * 3 + 1] * v3.x + position[j * 3 + 4] * v3.y + position[j * 3 + 7] * v3.z;
            outputPosition[i * 3 + 2] = position[j * 3 + 2] * v3.x + position[j * 3 + 5] * v3.y + position[j * 3 + 8] * v3.z;

            if (offset) {
                let randomInstance = Math.random(0, (offset.length / 3)-1);
                v32.fromArray(outputPosition, i * 3);
                v33.fromArray(scale, randomInstance * 3);
                v32.multiplyScalar(v33);

                q.fromArray(orientation, randomInstance * 4);
                v32.applyQuaternion(q);

                v33.fromArray(offset, randomInstance * 3);
                v32.add(v33);

                v32.toArray(outputPosition, i * 3);
            }

            if (outputNormal) {
                outputNormal[i * 3 + 0] = normal[j * 3 + 0] * v3.x + normal[j * 3 + 3] * v3.y + normal[j * 3 + 6] * v3.z;
                outputNormal[i * 3 + 1] = normal[j * 3 + 1] * v3.x + normal[j * 3 + 4] * v3.y + normal[j * 3 + 7] * v3.z;
                outputNormal[i * 3 + 2] = normal[j * 3 + 2] * v3.x + normal[j * 3 + 5] * v3.y + normal[j * 3 + 8] * v3.z;
            }

            if (outputUV) {
                outputUV[i * 3 + 0] = uv[j * 2 + 0] * v3.x + uv[j * 2 + 2] * v3.y + uv[j * 2 + 4] * v3.z;
                outputUV[i * 3 + 1] = uv[j * 2 + 1] * v3.x + uv[j * 2 + 3] * v3.y + uv[j * 2 + 5] * v3.z;
            }

            if (outputSkinIndex) {
                let skinCluster1 = {};
                skinCluster1[skinIndex[j * 4 + 0]] = skinWeight[j * 4 + 0];
                skinCluster1[skinIndex[j * 4 + 1]] = skinWeight[j * 4 + 1];
                skinCluster1[skinIndex[j * 4 + 2]] = skinWeight[j * 4 + 2];
                skinCluster1[skinIndex[j * 4 + 3]] = skinWeight[j * 4 + 3];

                let skinCluster2 = {};
                skinCluster2[skinIndex[j * 4 + 4]] = skinWeight[j * 4 + 4];
                skinCluster2[skinIndex[j * 4 + 5]] = skinWeight[j * 4 + 5];
                skinCluster2[skinIndex[j * 4 + 6]] = skinWeight[j * 4 + 6];
                skinCluster2[skinIndex[j * 4 + 7]] = skinWeight[j * 4 + 7];

                let skinCluster3 = {};
                skinCluster3[skinIndex[j * 4 + 8]] = skinWeight[j * 4 + 8];
                skinCluster3[skinIndex[j * 4 + 9]] = skinWeight[j * 4 + 9];
                skinCluster3[skinIndex[j * 4 + 10]] = skinWeight[j * 4 + 10];
                skinCluster3[skinIndex[j * 4 + 11]] = skinWeight[j * 4 + 11];

                let indices = [];
                for (let k = 0; k < 12; k++) {
                    let index = skinIndex[j * 4 + k];
                    if (indices.indexOf(index) === -1) indices.push(index);
                }

                let clusters = [];
                for (let k = 0; k < indices.length; k++) {
                    let index = indices[k];
                    clusters.push([index, (skinCluster1[index] || 0) * v3.x + (skinCluster2[index] || 0) * v3.y + (skinCluster3[index] || 0) * v3.z]);
                }

                clusters.sort(function (a, b) {
                    return b[1] - a[1];
                });

                for (let l = clusters.length - 1; l < 4; l++) {
                    clusters.push([0, 0]);
                }

                let sum = clusters[0][1] + clusters[1][1] + clusters[2][1] + clusters[3][1];

                outputSkinIndex[i * 4 + 0] = clusters[0][0];
                outputSkinIndex[i * 4 + 1] = clusters[1][0];
                outputSkinIndex[i * 4 + 2] = clusters[2][0];
                outputSkinIndex[i * 4 + 3] = clusters[3][0];

                outputSkinWeight[i * 4 + 0] = clusters[0][1] * (1 / sum);
                outputSkinWeight[i * 4 + 1] = clusters[1][1] * (1 / sum);
                outputSkinWeight[i * 4 + 2] = clusters[2][1] * (1 / sum);
                outputSkinWeight[i * 4 + 3] = clusters[3][1] * (1 / sum);
            }
        }

        let output = {};
        let buffer = [];

        output.position = outputPosition;
        buffer.push(outputPosition.buffer);

        if (outputNormal) {
            output.normal = outputNormal;
            buffer.push(outputNormal.buffer);
        }

        if (outputUV) {
            output.uv = outputUV;
            buffer.push(outputUV.buffer);
        }

        if (outputSkinIndex) {
            output.skinIndex = outputSkinIndex;
            output.skinWeight = outputSkinWeight;

            buffer.push(outputSkinIndex.buffer);
            buffer.push(outputSkinWeight.buffer);
        }

        resolve(output, id, buffer);
    }

    function generatePointCloud({ path, textureSize }, id) {
        (async function () {
            try {
                let data = await get(path);
                let totalParticles = textureSize * textureSize;

                let positions = new Float32Array(totalParticles * 3);
                let colors = new Float32Array(totalParticles * 3);
                for (let i = 0; i < totalParticles; i++) {
                    positions[i * 3 + 0] = data.positions[i * 3 + 0];
                    positions[i * 3 + 1] = data.positions[i * 3 + 1];
                    positions[i * 3 + 2] = data.positions[i * 3 + 2];

                    let hex = Math.floor(Number('0x' + data.colors[i]));
                    let r = (hex >> 16 & 255) / 255;
                    let g = (hex >> 8 & 255) / 255;
                    let b = (hex & 255) / 255;
                    colors[i * 3 + 0] = r;
                    colors[i * 3 + 1] = g;
                    colors[i * 3 + 2] = b;
                }

                data.positions = positions;
                data.colors = colors;

                resolve(data, id, [data.positions.buffer, data.colors.buffer]);
            } catch (e) {
                console.log(e);
                throw `Could not load Point Cloud for ${path}`;
            }
        })();
    }

    function generatePointGrid({ path, particleCount }, id) {
        let split = path.split('generateGrid-')[1].split('-');
        let dir = split[0];
        let scale = Number(split[1]);
        let s0 = Number(split[2]) || 1;

        let textureSize = Number(split[split.length-1].split('.')[0]);
        let totalParticles = particleCount;
        let positions = new Float32Array(totalParticles * 3);
        let colors = new Float32Array(totalParticles * 3);
        for (let i = 0; i < totalParticles; i++) {
            let p0 = i / textureSize;
            let y = Math.floor(p0);
            let x = p0 - y;
            y /= textureSize;

            x = Math.range(x, 0, 1, -scale/2, scale/2);
            y = Math.range(y, 0, 1, -scale/2, scale/2);

            if (dir == 'xz') {
                positions[i * 3 + 0] = x;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = y;
            } else {
                positions[i * 3 + 0] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = 0;
            }

            colors[i * 3 + 0] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        resolve({colors, positions}, id, [colors.buffer, positions.buffer]);
    }

    //*** Event handlers

    //*** Public methods
    this.generate = async function (geom, count) {
        init();

        let position = new Float32Array(geom.attributes.position.array);

        let data = await Thread.shared().distributeParticles({ position, count }, [position.buffer]);
        return data.position;
    }

    this.generateInstanced = async function (geom, count) {
        init();

        let position = new Float32Array(geom.attributes.position.array);
        let offset = new Float32Array(geom.attributes.offset.array);
        let scale = new Float32Array(geom.attributes.scale.array);
        let orientation = new Float32Array(geom.attributes.orientation.array);

        let data = await Thread.shared().distributeParticles({ position, offset, scale, orientation, count }, [position.buffer, offset.buffer, scale.buffer, orientation.buffer]);
        return data.position;
    }

    this.generateAll = async function (geom, count) {
        init();

        let position = new Float32Array(geom.attributes.position.array);
        let normal = new Float32Array(geom.attributes.normal.array);
        let uv = new Float32Array(geom.attributes.uv.array);

        let data = await Thread.shared().distributeParticles({ position, normal, uv, count }, [position.buffer, normal.buffer, uv.buffer]);
        return data;
    }

    this.generateSkinned = async function (geom, count) {
        init();

        let position = new Float32Array(geom.attributes.position.array);
        let normal = new Float32Array(geom.attributes.normal.array);
        let uv = new Float32Array(geom.attributes.uv.array);
        let skinIndex = new Float32Array(geom.attributes.skinIndex.array);
        let skinWeight = new Float32Array(geom.attributes.skinWeight.array);

        let data = await Thread.shared().distributeParticles({ position, normal, uv, skinIndex, skinWeight, count }, [position.buffer, normal.buffer, uv.buffer, skinIndex.buffer, skinWeight.buffer]);
        return data;
    }

    this.generatePointCloud = async function (path, textureSize) {
        if (!path.includes('assets/geometry')) path = 'assets/geometry/' + path;
        if (!path.includes('.json')) path += '.json';

        path = Assets.getPath(path); //needed for sites who are served out of a non root dir.
        init();

        let fn = path.includes('generateGrid') ? Thread.shared().generatePointGrid : Thread.shared().generatePointCloud;
        let data = await fn({ path: Thread.absolutePath(path), textureSize });
        let positions = new AntimatterAttribute(data.positions, 3);
        let colors = new AntimatterAttribute(data.colors, 3);
        return { positions, colors };
    }
}, 'static');
