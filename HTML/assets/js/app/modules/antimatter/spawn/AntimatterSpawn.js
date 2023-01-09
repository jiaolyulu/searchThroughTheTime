Class(function AntimatterSpawn(_proton, _group, _input) {
    Inherit(this, Component);
    const _this = this;
    var _life, _pass, _velocity, _color;

    var _index = -1;
    var _total = _proton.particleCount;

    var _releasedA = [];
    var _releasedB = [];
    var _temp0 = [];
    var _temp1 = [];
    var _temp2 = [];
    var _vec = new Vector3();

    //*** Constructor
    (async function () {
        await initPass();
        _this.startRender(loop);
    })();

    function loop() {
        let count = _releasedA.length;
        for (let i = count-1; i > -1; i--) {
            let index = _releasedA[i];
            _life.buffer[index * 4 + 0] = 0;
        }

        _releasedA.length = 0;

        if (count) _life.needsUpdate = true;

        let hold = _releasedA;
        _releasedA = _releasedB;
        _releasedB = hold;
    }

    async function initPass() {
        let [lifeBuffer, velocityBuffer] = await Promise.all([_proton.antimatter.createFloatArrayAsync(4, true), _proton.antimatter.createFloatArrayAsync(3, true)]);
        _life = _this.initClass(AntimatterAttribute, lifeBuffer, 4);
        _velocity = _this.initClass(AntimatterAttribute, velocityBuffer, 3);

        _pass = _this.initClass(AntimatterPass, 'AntimatterSpawn', {
            unique: _input.prefix,
            uMaxCount: _proton.behavior.uniforms.uMaxCount,
            tAttribs: _proton.behavior.uniforms.tAttribs,
            tLife: {value: _life, ignoreUIL: true},
            uSetup: {value: 1, ignoreUIL: true},
            decay: {value: 1},
            HZ: {value: Render.HZ_MULTIPLIER, ignoreUIL: true},
            decayRandom: {value: new Vector2(1, 1)}
        });

        ShaderUIL.add(_pass, _group).setLabel('Life Shader');

        _pass.onInit = _ => {
            _pass.setUniform('uSetup', 0);
            _this.canEmit = true;
        };

        _proton.behavior.addInput('tSpawn', _pass);
        _proton.behavior.addInput('tVelocity', _velocity);
        _proton.shader.addUniforms({
            tLife: {value: _pass.output}
        });

        _proton.antimatter.addPass(_pass, 0);
        _this.lifeOutput = _pass.output;
    }

    //*** Event handlers

    //*** Public methods
    this.emit = function(position, velocity, color) {
        if (!_this.canEmit) return;
        if (velocity && position.length != velocity.length) throw 'Position and velocity need to be the same length';
        if (color && position.length != color.length) throw 'Position and color need to be the same length';

        let count = position.length/3;
        for (let i = 0; i < count; i++) {
            let index = ++_index;
            if (_index >= _total) _index = -1;

            _life.buffer[index * 4 + 0] = 1;
            _life.buffer[index * 4 + 1] = position[i * 3 + 0];
            _life.buffer[index * 4 + 2] = position[i * 3 + 1];
            _life.buffer[index * 4 + 3] = position[i * 3 + 2];

            if (velocity) {
                _velocity.buffer[index * 3 + 0] = velocity[i * 3 + 0];
                _velocity.buffer[index * 3 + 1] = velocity[i * 3 + 1];
                _velocity.buffer[index * 3 + 2] = velocity[i * 3 + 2];
            }

            if (color && _color) {
                _color.buffer[index * 3 + 0] = color[i * 3 + 0];
                _color.buffer[index * 3 + 1] = color[i * 3 + 1];
                _color.buffer[index * 3 + 2] = color[i * 3 + 2];
            }

            _releasedB.push(index);
        }

        _life.needsUpdate = true;
        if (velocity) _velocity.needsUpdate = true;
        if (color && _color) _color.needsUpdate = true;
    }

    this.release = function(pos, count = 1, radius = 0, velocity, color) {
        if (!_this.canEmit) return;
        let positions = _temp0;
        let velocities = velocity ? _temp1 : null;
        let colors = color ? _temp2 : null;
        let radX = Array.isArray(radius) ? radius[0] : radius;
        let radY = Array.isArray(radius) ? radius[1] : radius;
        let radZ = Array.isArray(radius) ? radius[2] : radius;

        for (let i = 0; i < count; i++) {
            if (pos.spherical) {
                _vec.set(Math.random(-1, 1, 4), Math.random(-1, 1, 4), Math.random(-1, 1, 4)).normalize().multiplyScalar(radX);
                positions[i * 3 + 0] = pos.x + _vec.x;
                positions[i * 3 + 1] = pos.y + _vec.y;
                positions[i * 3 + 2] = pos.z + _vec.z;
            } else {
                positions[i * 3 + 0] = pos.x + (Math.random(-1, 1, 4) * radX);
                positions[i * 3 + 1] = pos.y + (Math.random(-1, 1, 4) * radY);
                positions[i * 3 + 2] = pos.z + (Math.random(-1, 1, 4) * radZ);
            }

            if (velocities) {
                velocities[i * 3 + 0] = velocity.x;
                velocities[i * 3 + 1] = velocity.y;
                velocities[i * 3 + 2] = velocity.z;
            }

            if (colors) {
                colors[i * 3 + 0] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
        }
        _this.emit(positions, velocities, colors);

        _temp0.length = 0;
        _temp1.length = 0;
        _temp2.length = 0;
    }

    this.upload = async function() {
        await _life?.uploadAsync();
        await _velocity?.uploadAsync();
    }

    this.useColor = async function(shader) {
        let colorBuffer = await _proton.antimatter.createFloatArrayAsync(3, true);
        _color = _this.initClass(AntimatterAttribute, colorBuffer, 3);

        if (!shader) shader = _proton.shader;
        shader.addUniforms({
            tColor: {value: _color}
        });

        _proton.behavior.addInput('tColor', _color);
    }

    this.applyToShader = function(shader) {
        shader.uniforms.tLife = _proton.shader.uniforms.tLife;
        if (_velocity) shader.uniforms.tVelocity = {value: _velocity};
        if (_color) shader.uniforms.tColor = {value: _color};
    }

    this.ready = function() {
        return this.wait('canEmit');
    }

    this.get('total', _ => _total);
    this.get('index', _ => _index);
    this.set('index', i => _index = i);
});