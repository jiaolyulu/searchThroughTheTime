class InterleavedBuffer {
    constructor(array, stride) {
        this.array = array;
        this.stride = stride;
        this.count = !!array ? array.length / stride : 0;
        this.isInterleaved = true;
        this.needsUpdate = false;
        this.dynamic = false;
        this.updateRange = { offset: 0, count: - 1 };
    }
}

class InterleavedGeometryAttribute {
    constructor(interleavedBuffer, itemSize, offset) {
        this.data = interleavedBuffer;
        this.itemSize = itemSize;
        this.offset = offset;
        this.isInterleaved = true;
    }
}