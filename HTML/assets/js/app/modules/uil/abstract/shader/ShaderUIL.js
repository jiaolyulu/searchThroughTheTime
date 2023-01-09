Class(function ShaderUIL() {
    this.exists = {};
    this.UPDATE = 'shader_update';
    this.TEXTURE_UPDATE = 'shader_texture_update';
    this.SHADER_UPDATE = 'shader_shader_update';

    //*** Public methods
    this.add = function(shader, group) {
        return new ShaderUILConfig(shader.shader || shader, group === null ? null : group || UIL.global);
    }

    this.createOverride = function(prefix, obj, group, shaderOnly) {
        let uniforms = {};
        if (Array.isArray(obj)) {
            obj.forEach(o => {
                o = o.uniforms || o;
                for (let key in o) {
                    if (!o[key].ignoreUIL) uniforms[key] = o[key];
                }
            });
        } else {
            uniforms = obj.uniforms || obj;
        }
        let shader = Utils3D.getTestShader();
        shader.vetexShader = shader.fragmentShader = '';
        for (let key in uniforms) shader.uniforms[key] = uniforms[key];
        shader.UILPrefix = prefix;
        if (shaderOnly === null) return shader;
        else return this.add(shader, group);
    }

    this.createDecorator = function(shader, prefix, obj, group) {
        let uniforms = {};
        for (let key in obj) {
            uniforms[key] = shader.uniforms[key];
        }

        let nShader = Utils3D.getTestShader();
        nShader.vetexShader = shader.fragmentShader = '';
        nShader.uniforms = uniforms;
        nShader.UILPrefix = prefix;
        return this.add(nShader, group);
    }

    this.createClone = function(prefix, obj) {
        let uniforms = obj.uniforms || obj;
        let shader = Utils3D.getTestShader();
        for (let key in uniforms) {
            let value = uniforms[key].value;
            let ignoreUIL = uniforms[key].ignoreUIL || value === null;
            if (!ignoreUIL && !!value.clone) value = value.clone();
            shader.uniforms[key] = {value, ignoreUIL};
        }
        shader.UILPrefix = prefix;
        return shader;
    }

    this.lerpShader = function(from, to, alpha, hz, uniformsFilter) {
        from = from.uniforms || from;
        to = to.uniforms || to;

        for (let key in from) {
            let f = from[key];
            let t = to[key];

            if (!f || !t) continue;
            if (uniformsFilter && uniformsFilter.indexOf(key) === -1) continue;

            if (typeof t.value === 'number') {
                f.value = Math.lerp(t.value, f.value, alpha, hz);
            } else if (f.type === 'c') {
                f.value.r = Math.lerp(t.value.r, f.value.r, alpha, hz);
                f.value.g = Math.lerp(t.value.g, f.value.g, alpha, hz);
                f.value.b = Math.lerp(t.value.b, f.value.b, alpha, hz);
            } else if (f.type === 'v3') {
                f.value.x = Math.lerp(t.value.x, f.value.x, alpha, hz);
                f.value.y = Math.lerp(t.value.y, f.value.y, alpha, hz);
                f.value.z = Math.lerp(t.value.z, f.value.z, alpha, hz);
            }
        }
    }
}, 'static');