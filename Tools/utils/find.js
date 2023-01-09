function find(needle, haystack) {
    let re = new RegExp(needle, 'gi');
    let results = [];
    while (re.exec(haystack)) {
        results.push(re.lastIndex);
    }
    return results;
}

module.exports = find;
