Class(function SceneLayoutPreloader(_name) {
    Inherit(this, Component);
    const _this = this;

    //NOTE: Have to enable assets/geometry && assets/images in Tools/asset.js for this to work

    function findMatch(src) {
        if (!src) return false;
        src = src.trim();
        for (let i = ASSETS.length-1; i > -1; i--) {
            if (ASSETS[i].includes(src)) return true;
        }
        return false;
    }

    //*** Public methods
    this.load = function(name) {
        let promise = Promise.create();
        let array = [];
        let settings = {dxt: !!Renderer.extensions.s3tc, etc: !!Renderer.extensions.etc1, pvrtc: !!Renderer.extensions.pvrtc, astc: !!Renderer.extensions.astc};
        let ext;
        if (settings.dxt) ext = 'dxt';
        else if (settings.etc) ext = 'astc';
        else if (settings.pvrtc) ext = 'pvrtc';
        else if (settings.astc) ext = 'astc';

        let keys = UILStorage.getKeys();
        let i = 0;
        let worker = new Render.Worker(_ => {
            let key = keys[i];
            if (!key) {
                worker.stop();
                Promise.all(array).then(promise.resolve);
                return;
            }

            if (key.includes(name)) {
                let val = UILStorage.get(key);
                if (!val || !val.includes) return i++;

                if (key.includes('geometry')) {
                    if (val.charAt(0) == '{') val = JSON.parse(val).src;
                    if (!val.includes('.json')) val += '.json';
                    if (!val.includes('assets/')) val = 'assets/geometry/' + val;
                    array.push(GeomThread.loadGeometry(Assets.getPath(val), null, true));
                }

                if (val.includes('.json')) {
                    if (!val.includes('assets/')) val = 'assets/geometry/' + val;
                    if (findMatch(val.split('assets/')[1])) array.push(fetch(Assets.getPath(val)).catch(e => {}));
                } else if (val.includes('src')) {
                    let obj = JSON.parse(val);
                    let src = obj.src;
                    if (obj.compressed) {
                        let src0 = src.split('.')[0];
                        let src1 = src0.split('/');
                        src = src0 + '/' + src1[src1.length-1] + '-' + ext + '.ktx';
                    }
                    if (findMatch(src.split('assets/')[1])) {
                        array.push(fetch(Assets.getPath(src)).catch(e => {}));
                    }
                }
            }
            i++;
        }, 1);

        return promise;
    }
}, 'static');