Class(function UILFile(_offline, _path) {
    Inherit(this, Component);
    const _this = this;

    this.load = async function() {
        let path = window.UIL_STATIC_PATH || 'assets/data/uil.json';
        try {
            let data = await get(path);

            // detect merge conflicts
            // data is string when invalid json
            if (typeof data === 'string') {
                if (Hydra.LOCAL) {
                    return null;
                }

                return {};
            }

            return data;
        } catch(e) {
            return {};
        }
    }

    this.save = async function(sessionData, data) {
        Dev.writeFile(window.UIL_STATIC_PATH || 'assets/data/uil.json', data);
        if (_offline) {
            let partial = {};
            try {
                partial = await get('assets/data/uil-partial.json', data);
                for (let key in sessionData) {
                    partial[key] = sessionData[key];
                }
            } catch(e) {
                partial = sessionData;
            }
            Dev.writeFile('assets/data/uil-partial.json', partial);
            Storage.set('uil_update_partial', true);
        }
    }

});