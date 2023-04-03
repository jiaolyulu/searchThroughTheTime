Module(function ShaderCode() {
    function removeUBO(code, name) {
        let uniforms = code.split(`uniform ${name} {`)[1];
        uniforms = uniforms.split('};')[0];

        uniforms = uniforms.split('\n');
        uniforms.forEach(u => {
            u = u.trim();
            if (!u.length) return;
            code = code.replace(u, 'uniform '+u);
        });

        let split = code.split(`uniform ${name} {`);
        split[1] = split[1].replace('};', '');
        code = split.join('');
        code = code.replace(`uniform ${name} {`, '');
        return code;
    }

    function convertWebGL1(code) {
        code = code.replace('#version 300 es', '');
        code = code.replace(/textureLod\(/g, 'texture2DLodEXT(');
        code = code.replace(/texture\(/g, 'texture2D(');
        code = code.replace('out vec4 FragColor;', '');

        if (code.includes('samplerExternalOES')) code = code.replace('samplerExternalOES', 'sampler2D');
        if (code.includes('uniform global {')) code = removeUBO(code, 'global');
        if (code.includes('uniform ubo {')) code = removeUBO(code, 'ubo');
        if (code.includes('uniform lights {')) code = removeUBO(code, 'lights');
        return code;
    }

    function convertWebGL2(code, type) {
        code = code.replace(/texture2DLodEXT/g, 'textureLod');
        code = code.replace(/texture2D/g, 'texture');

        if (type == 'vs') {
            code = code.replace(/attribute/g, 'in');
            code = code.replace(/varying/g, 'out');
        } else {
            code = code.replace(/varying/g, 'in');
            code = code.replace(/textureCube/g, 'texture');
        }

        if (code.includes('samplerExternalOES') && !(Device.system.os == 'android' && window.AURA)) code = code.replace('samplerExternalOES', 'sampler2D');

        if (!Renderer.UBO) {
            if (code.includes('uniform global {')) code = removeUBO(code, 'global');
            if (code.includes('uniform ubo {')) code = removeUBO(code, 'ubo');
            if (code.includes('uniform lights {')) code = removeUBO(code, 'lights');
        } else {
            if (code.includes('uniform global {')) code = code.replace('uniform global', 'layout(std140) uniform global');
            if (code.includes('uniform ubo {')) code = code.replace('uniform ubo', 'layout(std140) uniform ubo');
            if (Lighting.UBO) {
                if (code.includes('uniform lights {')) code = code.replace('uniform lights', 'layout(std140) uniform lights');
            } else {
                if (code.includes('uniform lights {')) code = removeUBO(code, 'lights');
            }
        }

        return code;
    }

    this.exports = {convertWebGL1, convertWebGL2};
});