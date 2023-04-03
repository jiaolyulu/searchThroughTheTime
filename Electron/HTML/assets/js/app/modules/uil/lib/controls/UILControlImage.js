/**
 * Image input control
 * @param {Object} [_opts.value] Initial value {src, relative, prefix, filename}
 * @param {String} [_opts.label=id] Text Label.
 * @param {String} [_opts.relative] Realtive path.
 * @param {String} [_opts.prefix="assets/images"] Prefix.
 */
Class(function UILControlImage(_id, _opts = { value: {} }) {
    Inherit(this, UILControl);
    const _this = this;
    let $view;
    let $picker;
    let $preview, $img, $copy, $filename, $input, $check, $compress, $delete, $progress;
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
            prefix: _opts.prefix || `assets/images`,
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

        $compress = $view.create('compress');
        $compress.text('Compress').bg('#fff').css({ top: 3, width: 70, height: 15, textAlign: 'center', borderRadius: 5, position: 'relative', 'float': 'left', paddingTop: 2 }).fontStyle('sans-serif', 11, `#000`);

        $check = $view.create('#compressed', 'input');
        $check.attr('type', 'checkbox');
        $check.size(20, 20);
        $check.css({ boxSizing: `border-box`, position: `relative` });
        $check.div.checked = !!_this.value.compressed;

        let $label = $view.create('compressed-label', 'label');
        $label.attr('for', 'compressed');
        $label.text('Use Compressed').fontStyle('sans-serif', 9, `#9B9C9B`).css({ top: -6, position: 'relative' });

        $preview = $view.create(`preview`);
        $preview.size(`100%`, 60);
        $preview.css({ boxSizing: `border-box`, position: `relative`, display: `flex`, alignItems: `center`, justifyContent: `center`, overflow: `hidden` });

        $img = $preview.create(`img`);
        $img.size(`100%`);
        $img.css({ position: `absolute`, top: 0, right: 0, bottom: 0, left: 0, backgroundSize: `cover`, backgroundRepeat: `no-repeat`, backgroundPosition: `center`, border: `1px dotted #2e2e2e`, boxSizing: `border-box` });

        $picker = $preview.create(`picker`, `input`);
        $picker.attr(`type`, `file`);
        $picker.attr(`accept`, `image/*`);
        $picker.css({ opacity: 0, position: `absolute`, top: 0, right: 0, bottom: 0, left: 0 });

        $progress = $preview.create('progress');
        $progress.css({
            "position": 'absolute',
            "bottom": 0,
            'height': 10,
            "left": 0,
            'background': '#9B9C9B'
        });

        $delete = $preview.create('delete', 'button');
        $delete.size(18, 18)
            .css({
                border: 'none',
                padding: 0,
                position: 'absolute',
                top: 8,
                right: 8,
                borderRadius: '50%',
                background: '#1D1D1D',
                color: '#9B9C9B',
                textAlign: 'center'
            })
            .html(`<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path stroke-width="2" stroke-linecap="round" d="M2 2l6 6M2 8l6-6"/></svg>`);
        $delete.hide();

        let copy = $preview.create(`copy`);
        copy.html(`Drag image here<br><small>or Click to Select</small>`);
        copy.fontStyle('sans-serif', 11, `#9B9C9B`).css({ textAlign: `center` });

        if (_this.value.src) {
            $img.css({ backgroundImage: `url('${Assets.getPath(_this.value.src)}')` });
            $picker.attr('title', _this.value.src);
            $delete.show();
        }

        _this.view = $view;
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

    function imageExists(url) {
        if (url.includes('http')) return true;
        url = Assets.getPath(url);
        return fetch(url).then(e => e.status != 404)
            .catch(e => console.warn(`UILControlImage image url validation failed`, e));
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

        $delete.div.onclick = deleteImage;
        $compress.div.onclick = compressClick;
        $check.div.onchange = checkChange;
    }

    async function compressClick() {
        if (!_value.src || _this.flag('compressPending')) return;
        _this.flag('compressPending', true);
        $compress.bg('#f4ee42').text('---');

        try {
            let data = await Dev.execUILScript('compressktx', { src: _value.src.split('?')[0] });
            if (data == 'Error') $compress.bg('#f44141').html('Failed');
            else $compress.bg('#46f441').html('Success');
        } catch (e) {
            $compress.bg('#f44141').html('Failed');
            console.error(e);
        }

        _this.flag('compressPending', false);
    }

    function checkChange() {
        _this.value.compressed = _value.compressed = !!$check.div.checked;
        _this.finish(false);
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
        _value.compressed = !!$check.div.checked;

        if (await imageExists(_value.src)) {
            _this.value = Object.assign({}, _value);

            $picker.div.value = ``;
            $picker.attr(`title`, _value.src);
            $img.css({ backgroundImage: `url(${Assets.getPath(_value.src)})` });
            $delete.show();

            _this.finish();
        } else {
            $picker.div.value = ``;
            console.warn(`UIL: Could not find image`, _value);
            alert(`"${_value.src}" not found!\nMake sure "relative path" is correct.`);
        }
    }

    function deleteImage() {
        _value = {
            src: ``,
            relative: ``,
            prefix: `assets/images`,
            filename: ``,
        };

        $input.div.value = ``;
        $picker.div.value = ``;
        $picker.attr(`title`, null);
        $img.css({ backgroundImage: `` });
        $delete.hide();

        _this.value = Object.assign({}, _value);
        _this.finish();
    }

    function focus() {
        $img.css({ border: `1px solid #37a1ef` });
    }

    function blur() {
        $img.css({ border: `1px dotted #2e2e2e` });
    }

    function inputChange() {
        _value.relative = $input.div.value;
    }

    //*** Public methods

    this.force = function (value, isClipboard) {
        _value = Object.assign({}, value);
        if (isClipboard === true) _this.value = _value;

        $input.div.value = _value.relative;
        $picker.div.value = ``;
        $picker.attr(`title`, _value.src);

        $img.css({ backgroundImage: `url('${Assets.getPath(_value.src)}')` });
        $check.div.checked = _value.compressed;
    }

    this.onDestroy = function () {
        $picker.div.removeEventListener('change', change, false);
        $picker.div.removeEventListener('focus', focus, false);
        $picker.div.removeEventListener('blur', blur, false);
        $input.div.removeEventListener('change', inputChange, false);
    }
});
