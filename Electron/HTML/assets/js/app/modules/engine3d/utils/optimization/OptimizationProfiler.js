Class(function OptimizationProfiler() {
    Inherit(this, Component);
    const _this = this;
    var _shaders, _count;

    this.active = Utils.query('optimizationProfiler') || location.hash?.includes('optimizationProfiler');

    //*** Constructor
    (function () {
        if (!_this.active) return;
        _shaders = [];
        _count = Number(Utils.query('optimizationProfiler') || location.hash.split('optimizationProfiler=')[1]?.split('&')[0]);
        if (isNaN(_count)) _count = null;
    })();

    function getFSDefintions() {
        return `
        #define TEXEL_DENSITY_EPSILON 10e-10
        uniform float texDimensions;
        uniform float texelsPerMeter;
        in vec3 vDensityPos;
 
float MipLevel(vec2 uv)
{
  vec2 dx = dFdx(uv);
  vec2 dy = dFdy(uv);
  float d = max( dot(dx, dx), dot(dy, dy) );
 
  float maxRange = pow(2., (10.0 - 1.) * 2.);
  d = clamp(d, 1., maxRange);
 
  float mipLevel = 0.5 * log2(d);
  return floor(mipLevel);
}

vec3 getDensityColor() {
    vec2 uv = vUv.xy;
    
    float texWidth = texDimensions;
    float texHeight = texDimensions;

    vec2 ddxUV  = dFdx(uv * texWidth  / texelsPerMeter);
    vec2 ddyUV  = dFdy(uv * texHeight / texelsPerMeter);
    vec3 ddxPos = dFdx(vDensityPos);
    vec3 ddyPos = dFdy(vDensityPos);
\t
\t// NOTE(jserrano): check LOD ?
\t//float mipLevel = MipLevel(uv * texDimensions);
    //float mipSize  = pow(2., mipLevel);
    
    //ddxUV /= mipSize;
    //ddyUV /= mipSize;

    float uvArea   = length( cross(vec3(ddxUV,0), vec3(ddyUV,0)) );
    float faceArea = length( cross(ddxPos, ddyPos) );
\tfloat density  = uvArea / max(10e-10, faceArea);
    
    const float lowRatioLimit  = 0.8;
    const float midRatio       = 1.0;
    const float highRatioLimit = 1.2;
    
    vec3 finalColor = vec3(0);
    
\tif (density > lowRatioLimit && density < highRatioLimit)
\t{
        vec3 lowDensityColor  = vec3( 1., 1., 1. );
        vec3 midDensityColor  = vec3( 0., 1., 0. );
        vec3 highDensityColor = vec3( 0., 0., 0. );
        
        vec3 lowColorStep = mix( lowDensityColor, midDensityColor, smoothstep(lowRatioLimit, midRatio, density) );
        finalColor = mix( lowColorStep, highDensityColor, smoothstep(midRatio, highRatioLimit, density) );
\t}
    else if (density > highRatioLimit)
    {
        vec3 lowDensityColor  = vec3( 1., 1., 0. );
        vec3 highDensityColor = vec3( 1., 0., 0. );
        
        float ratio = smoothstep(highRatioLimit, 2., density);
        finalColor = mix( lowDensityColor, highDensityColor, ratio );
    }
    else
    {
        vec3 lowDensityColor  = vec3( 0., 0., 1. );
        vec3 highDensityColor = vec3( 0., 1., 1. );
        
        float ratio = smoothstep(0., lowRatioLimit, density);
        finalColor = mix( lowDensityColor, highDensityColor, ratio );
    }

    return finalColor;
}
        `;
    }

    function getVSDefinitions() {
        return `
        out vec3 vDensityPos;
        `;
    }

    //*** Event handlers

    //*** Public methods
    this.setupShader = function(shader) {
        shader.addUniforms({
            texDimensions: {value: 0},
            texelsPerMeter: {value: _count}
        });

        const parse = _ => {
            for (let key in shader.uniforms) {
                let value = shader.uniforms?.[key]?.value;
                if (value instanceof Texture) {
                    if (!value.data) {
                        if (!value.dimensions) value.promise?.then(parse);
                        else {
                            shader.uniforms.texDimensions.value = Math.max(shader.uniforms.texDimensions.value, Math.max(value.dimensions.width, value.dimensions.height));
                        }
                    }
                }
            }
        };

        _shaders.push(shader);

        parse();
    }

    this.override = function(shader, vsCode, fsCode) {
        if (!_count) return [vsCode, fsCode];
        if (shader?.mesh instanceof Mesh && fsCode.includes('vUv')) {
            try {

                let vs = vsCode;
                let fs = fsCode;

                (function() {
                    vs = vs.slice(0, -(vs.length - vs.lastIndexOf('}')));
                    vs += `vDensityPos = ${vs.includes('vec3 pos ') ? 'pos' : 'position'};\n`;
                    vs += '}';

                    let split = vs.split('void main');
                    split[0] += getVSDefinitions();

                    vs = split.join('void main');
                })();


                (function() {
                    fs = fs.slice(0, -(fs.length - fs.lastIndexOf('}')));
                    fs += `FragColor = vec4(getDensityColor(), 1.0);\n`
                    fs += '}';

                    let split = fs.split('void main');
                    split[0] += getFSDefintions();

                    fs = split.join('void main');
                })();

                return [vs, fs];
            } catch(e) {
                return [vsCode, fsCode];
            }
        } else {
            return [vsCode, fsCode];
        }
    }

    this.logTextures = function() {
        if (!this.active) {
            console.log('Add optimizationProfiler in the URL!');
        }

        _shaders?.forEach(shader => {
            let found = false;
            for (let key in shader.uniforms) {
                let value = shader.uniforms?.[key]?.value;
                if (value instanceof Texture) {
                    if (!value.data && value.dimensions) {
                        if (!found) {
                            console.group(shader.mesh?.uilName || shader.fsName);
                            found = true;
                        }

                        let size = Math.max(value.dimensions.width, value.dimensions.height);
                        let bgColor = (function() {
                            if (size <= 512) return '#00ff00';
                            if (size <= 1024) return '#ffff00';
                            return '#ff0000';
                        })();
                        console.log(`%c ${key}: ${size}`, `background-color: ${bgColor}; color: #000000;`, `Compressed: ${value.compressed ? '✔️' : '❌'}`);
                    }
                }
            }
            if (found) console.groupEnd();
        });
    }

    this.logVertices = function(sort = false) {
        if (!_shaders || !_shaders.length) return;

        let total = 0;
        let shaders = _shaders
            .filter(shader => Boolean(shader?.mesh?.geometry) && !(shader?.mesh instanceof Points))
            .map(shader => ({
                shader,
                count: shader.mesh.geometry.isInstanced ? 
                        shader.mesh.geometry.attributes.position.count * shader.mesh.geometry.maxInstancedCount :
                        shader.mesh.geometry.attributes.position.count
                
            }));

        if (sort) shaders = shaders.sort((a, b) => b.count - a.count);

        function bgColor(count) {
            if (count <= 15000) return '#00ff00';
            if (count <= 30000) return '#ffff00';
            return '#ff0000';
        };

        shaders.forEach(({shader, count}) => {
            total += count;
            console.group(shader.mesh.uilName || shader.fsName);
            if (!shader.mesh.uilName) console.log(shader.mesh);
            console.log(`%c ${shader.mesh.geometry.isInstanced ? 'Instanced' : ''} Vertices ${count}`, `background-color: ${bgColor(count)}; color: #000000;`);
            console.groupEnd();
        });

        console.log('%c TOTAL VERTICES '+total, `background-color: #ff00ff; color: #000000;`);
    }
}, 'static');
