Class(function TimelineUILModel(_id) {
    const _this = this;
    var _items, _config;

    var _data = [];
    var _map = {};

    //*** Constructor
    (function () {
        initItems();
        initData();
    })();

    function initItems() {
        _config = JSON.parse(UILStorage.get(`${_id}_config`) || '{}');
        _items = JSON.parse(UILStorage.get(`${_id}_list_items`) || '[]');
    }

    function initData() {
        _items.forEach((item, i) => {
            let input = InputUIL.create(`${item}_folder`, null, null, !!UIL.global);

            let data = {};
            data.label = input.get('label') || 'Item';
            data.value = input.getNumber('percent') || 0;
            data.arbitrary = input.get('arbitrary');

            _data.push(data);
            _map[data.label] = data;

            if (UIL.global) {
                Render.start(_ => {
                    data.label = input.get('label') || 'Item';
                    data.value = input.getNumber('percent') || 0;
                }, 10);
            }
        });
    }

    //*** Event handlers

    //*** Public methods
    this.setState = function(array) {
        for (let i = 0; i < array.length; i++) {
            if (!_items[i]) _items.push(`${_id}_${Utils.timestamp()}`);
        }

        if (_items.length > array.length) _items = _items.slice(0, array.length);

        _items.forEach((item, i) => {
            let data = array[i];
            let input = InputUIL.create(`${item}_folder`, null);
            input.setValue('label', data.label);
            if (data.percent) input.setValue('percent', data.percent);
            if (data.arbitrary) input.setValue('percent', data.arbitrary);
        });

        UILStorage.set(`${_id}_list_items`, JSON.stringify(_items));
    }

    this.lock = function() {
        if (_config.lock) return this;
        _config.lock = true;
        if (UIL.global) UILStorage.set(`${_id}_config`, JSON.stringify(_config));
        return this;
    }

    this.rails = function() {
        if (_config.rails) return this;
        _config.rails = true;
        if (UIL.global) UILStorage.set(`${_id}_config`, JSON.stringify(_config));
        return this;
    }

    this.getData = function() {
        return _data;
    }

    this.get = function(key) {
        return _map[key];
    }
});