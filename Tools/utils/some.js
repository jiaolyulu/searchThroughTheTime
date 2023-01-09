function some(src, path) {
    return src.filter((p) => path.includes(p)).length;
}

module.exports = some;
