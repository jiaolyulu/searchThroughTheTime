/**
 * Image input control
 * @param {Object} [_opts.value] Initial value {src, relative, prefix, filename}
 * @param {String} [_opts.label=id] Text Label.
 * @param {String} [_opts.relative] Realtive path.
 * @param {String} [_opts.prefix="assets/images"] Prefix.
 */
Class(function UILControlFile(_id, _opts = { value: {} }) {
    Inherit(this, UILControl);
    const _this = this;
    let $view;
    let $picker;
    let $preview, $img, $copy, $filename, $input, $$copy, $progress;
    let _value;

    //*** Constructor
    (function () {
        init();
        initView();
        addHandlers();
    })();

    function init() {
        _opts.value = Object.assign({
            src: ``,
            relative: _opts.relative || ``,
            prefix: _opts.prefix,
            filename: ``,
        }, _opts.value);
        _value = Object.assign({}, _opts.value);
        _this.init(_id, _opts);
    }

    function initView() {
        $view = $(`view`);
        $view.css({ position: `relative`, padding: 5 });

        $input = $view.create(`path`, `input`);
        $input.size('100%').bg(`#1D1D1D`);
        $input.css({ boxSizing: 'border-box', border: `1px solid #2E2E2E`, color: `#37A1EF`, marginBottom: 5 });
        if (_this.value.relative) $input.div.value = _this.value.relative;
        else $input.attr(`placeholder`, `Relative Path`);

        $preview = $view.create(`preview`);
        $preview.size(`100%`, 60);
        $preview.css({ boxSizing: `border-box`, position: `relative`, display: `flex`, alignItems: `center`, justifyContent: `center`, overflow: `hidden` });

        $img = $preview.create(`img`);
        $img.size(`100%`);
        $img.css({ position: `absolute`, top: 0, right: 0, bottom: 0, left: 0, backgroundSize: `cover`, backgroundRepeat: `no-repeat`, backgroundPosition: `center`, border: `1px dotted #2e2e2e`, boxSizing: `border-box` });

        $picker = $preview.create(`picker`, `input`);
        $picker.attr(`type`, `file`);
        $picker.css({ opacity: 0, position: `absolute`, top: 0, right: 0, bottom: 0, left: 0 });

        $progress = $preview.create('progress');
        $progress.css({
            "position": 'absolute',
            "bottom": 0,
            'height': 10,
            "left": 0,
            'background': '#9B9C9B'
        });

        $$copy = $preview.create(`copy`);
        $$copy.html(`Drag file here<br><small>or Click to Select</small>`);
        $$copy.fontStyle('sans-serif', 11, `#9B9C9B`).css({ textAlign: `center` });

        _this.view = $view;

        if (_value.src) {
            $img.attr(`title`, _value.src);
            $$copy.text(_value.filename);
        }
    }

    function getRelative() {
        if (_value.filename.includes('http')) return '';
        if (_value.relative.includes(_value.prefix))
            return _value.relative.replace(`${_value.prefix}`, ``);
        return _value.relative;
    }

    function getSrc() {
        if (_value.filename.includes('http')) return _value.filename;
        let p = _value.prefix ? _value.prefix + `/` : ``;
        let r = _value.relative ? _value.relative + `/` : ``;
        return `${p}${r}${_value.filename}`;
    }

    function fileExists(url) {
        if (url.includes('http')) return true;
        return fetch(Assets.getPath(url)).then(e => e.status != 404)
            .catch(e => console.warn(`UILControlFile image url validation failed`, e));
    }

    function makePreview(file) {
        let reader = new FileReader();
        reader.onload = e => $img.css({ backgroundImage: `url(${e.target.result})` });
        reader.readAsDataURL(file);
    }

    //*** Event handlers

    function addHandlers() {
        $picker.div.addEventListener('change', change, false);
        $picker.div.addEventListener('focus', focus, false);
        $picker.div.addEventListener('blur', blur, false);
        $input.div.addEventListener(`change`, inputChange, false);
    }

    async function change(e) {
        let file = $picker.div.files[0];
        if (!file) return;

        let name = file.name;
        if (window.UIL_REMOTE) {
            const { customMetadata } = await UILStorage.uploadFileToRemoteBucket({ file, progress: $progress });
            name = customMetadata.path;
        }

        _value.filename = name;
        _value.relative = getRelative();
        _value.src = getSrc();
        if (await fileExists(_value.src)) {
            _this.value = Object.assign({}, _value);
            $img.attr(`title`, _value.src);
            $$copy.text(_value.filename);
            _this.finish();
        } else {
            $picker.div.value = ``;
            console.warn(`UIL: Could not find file`, _value);
            alert(`"${_value.src}" not found!\nMake sure "relative path" is correct.`);
        }
    }

    function focus() {
        $img.css({ border: `1px solid #37a1ef` });
    }

    function blur() {
        $img.css({ border: `1px dotted #2e2e2e` });
    }

    function inputChange() {
        _value.relative = $input.div.value;
        if (_value.relative.includes('.')) {
            _this.value = Object.assign({}, _value);
            _this.finish();
        }
    }

    //*** Public methods

    this.force = function (value) {
        _value = Object.assign({}, value);
        $input.div.value = _value.relative;
        $img.attr(`title`, _value.src);
        $$copy.text(_value.filename);
    }

    this.onDestroy = function () {
        $picker.div.removeEventListener('change', change, false);
        $picker.div.removeEventListener('focus', focus, false);
        $picker.div.removeEventListener('blur', blur, false);
        $input.div.removeEventListener('change', inputChange, false);
    }
});
