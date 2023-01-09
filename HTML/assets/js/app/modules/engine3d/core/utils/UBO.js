class UBO {
    constructor(location, gl = Renderer.context) {
        this.gl = gl;

        this.arrays = [];
        for (let i = 0; i < 30; i++) this.arrays.push([]);
        this.arrayIndex = 0;

        this.objects = [];
        this.location = location;
        this.data = null;
        this.lastUpdate = 0;
    }

    _getSize(uniform) {
        let obj = uniform.value;
        if (Array.isArray(obj)) {
            if (uniform.components) return (obj.length/uniform.components) * 16;
            return obj.length * 16;
        }
        if (obj instanceof Vector2) return 8;
        if (obj instanceof Vector3) return 16;
        if (obj instanceof Vector4) return 16;
        if (obj instanceof Color) return 16;
        if (obj instanceof Matrix4) return 16*4;
        if (obj instanceof Matrix3) return 16*3;
        if (obj instanceof Quaternion) return 16;
        return 4;
    }

    _getValues(uniform) {
        let obj = uniform.value;
        if (Array.isArray(obj)) return obj;
        if (obj instanceof Vector2) return this._array(obj.x, obj.y);
        if (obj instanceof Vector3) return this._array(obj.x, obj.y, obj.z);
        if (obj instanceof Matrix4) return obj.elements;
        if (obj instanceof Matrix3) return obj.elements;
        if (obj instanceof Color) return this._array(obj.r, obj.g, obj.b);
        if (obj instanceof Quaternion) return this._array(obj.x, obj.y, obj.z, obj.w);
        return this._array(obj);
    }

    _array() {
        if (this.arrayIndex++ >= this.arrays.length-1) this.arrayIndex = 0;
        let array = this.arrays[this.arrayIndex];
        array.length = 0;
        array.push.apply(array, arguments);
        return array;
    }

    clear() {
        for (let i = 0; i < this.arrays.length; i++) this.arrays[i].length = 0;
    }

    calculate() {
        let len = this.objects.length;

        let chunk = 16;
        let tsize = 0;
        let offset = 0;
        let size = 0;

        for (let i = 0; i < len; i++) {
            let obj = this.objects[i];
            size = this._getSize(obj);

            tsize = chunk - size;

            if (tsize < 0 && chunk < 16) {
                offset += chunk;
                if (i > 0) this.objects[i-1].chunkLen += chunk;
                chunk = 16;
            } else if (tsize < 0 && chunk == 16) {

            } else if (tsize == 0) {
                chunk = 16;
            } else {
                chunk -= size;
            }

            obj.offset = offset / 4;
            obj.chunkLen = size / 4;
            obj.dataLen = size / 4;

            offset += size;
        }

        if (offset % 16 != 0) {
            this.objects[this.objects.length-1].chunkLen += chunk / 4;
            offset += chunk;
        }

        return offset / 4;
    }

    compileData() {
        let array = this._array();
        let len = this.calculate();

        let i;

        for (i = 0; i < len; i++) array[i] = 0;

        for (i = 0; i < this.objects.length; i++) {
            let obj = this.objects[i];
            let values = this._getValues(obj);

            for (let j = 0; j < values.length; j++) {
                array[obj.offset + j] = values[j];
            }
        }

        return array;
    }

    upload() {
        if (this.data) return;
        let gl = Renderer.context;

        let array = this.compileData();
        if (!array.length) return;

        this.data = new Float32Array(array);

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferData(gl.UNIFORM_BUFFER, this.data, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.location, this.buffer);
    }

    bind(program, name) {
        if (!this.data) this.upload();
        if (this.needsUpdate) this.update();
        let gl = Renderer.context;

        let location;
        if (program == this.lastProgram && name == this.lastName && this.lastLocation !== undefined) {
            location = this.lastLocation;
        } else {
            location = gl.getUniformBlockIndex(program, name);
        }

        if (location > 99999 || location == -1) return;
        gl.uniformBlockBinding(program, location, this.location);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, this.location, this.buffer);

        this.lastProgram = program;
        this.lastName = name;
        this.lastLocation = location;
    }

    update() {
        if (!this.data) this.upload();
        if (!this.data) return;

        let gl = Renderer.context;
        let array = this.compileData();

        if (array.length != this.data.length) {
            this.data = new Float32Array(array);
            this.upload();
        }
        this.data.set(array);
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, this.data);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        this.needsUpdate = false;
    }

    unbind() {
        // let gl = this.gl;
        // gl.bindBufferBase(gl.UNIFORM_BUFFER, null);
    }

    push() {
        if (this.data) throw `Can't modify UBO after initial upload!`;
        for (let i = 0; i < arguments.length; i++) this.objects.push(arguments[i]);
    }

    destroy() {
        let gl = this.gl;
        gl.deleteBuffer(this.buffer);
    }
}