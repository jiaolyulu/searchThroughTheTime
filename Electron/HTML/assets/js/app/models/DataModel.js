Class(function DataModel() {
    Inherit(this, Model);
    const _this = this;
    let _fetchRetries = 0;
    let _localeConfig;

    /*
        year: 1999, // mandatory, int year
        type: '', // mandatory, string [innovation, tech-milestone, google-milestone, innovation-deepdive] (this will define color + filtering in the overview mode)
        display: '', // mandatory, string [small-top, small-bottom, medium-top, medium-bottom, dive-top, dive-bottom, custom]
        title: '', // mandatory, string
        id: '', // mandatory, string (to be used for url routing for deepdive #!/detail/:id)
        border: true, // mandatory, boolean (if image has border or it's transparent png)
        icon: 'URL', // mandatory, png icon 64x64 (to be used in overview)
        subtitle: '', // optional, string
        image: 'URL', // optional, string
        imageWidth: 512, // optional, integer (not sure if it's possible, but would be handy to get picture width/height so that i can set size even before the image is loaded.)
        imageHeight: 300, // optional, integer
        tooltip: {}, // optional, info for tooltip
    */

    //*** Constructor
    (async function () {
        await loadData();

        if (Utils.query('debugFill')) {
            const number = parseInt(Utils.query('debugFill')) || 36;
            debugFill(number);
        }

        // else {
        //     debugFill(79);
        // }

        // if (Hydra.LOCAL) {
        //     checkSanity();
        // }

        _this.dataReady = true;
    })();

    // function checkSanity() {
    // for (const id in _this.MILESTONES) {
    //     const milestone = _this.MILESTONES[id];
    //     JSON.stringify(milestone).match(/[]);
    //     console.log(milestone);
    // }
    // }

    function debugFill(total) {
        const debugPool = [].concat(_this.MILESTONES);

        for (let i = _this.MILESTONES.length; i < total; i++) {
            debugPool.push(_this.MILESTONES.random());
        }

        const diff = debugPool.length - _this.MILESTONES.length;

        console.log(`${diff} random milestone added in the timeline to fill the spots`);

        _this.MILESTONES = debugPool;
    }

    //*** Event handlers
    function isDeepDive({ timeline, deepdive }) {
        return timeline?.timelinemetadata['deep-dive'].length &&
            deepdive[timeline?.timelinemetadata['deep-dive']];
    }

    function isTooltip({ timeline }) {
        return timeline?.timelinetooltip;
    }

    function validateCurrentLocale(data) {
        const { locale } = data;
        const locales = Object.values(locale);
        const currentLocale = locales.find((_locale) => _locale.code === Config.LANGUAGE);
        if (currentLocale) {
            _localeConfig = currentLocale;
            if (!currentLocale.active) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }


    async function loadData() {
        let data;
        try {
            data = await fetch(`${Config.CMS}?${window._CACHE_ ? window._CACHE_ : Date.now()}`).then((r) => r.json());
        } catch (e) {
            //an error occurred fetching the json data.
            _fetchRetries++;
            if (_fetchRetries > 1) {
                if (Hydra.LOCAL) {
                    console.log('Try using ?remoteAssets or run node Utils/fetchCmsAssetsLocal.js');
                }

                throw new Error('An error occurred fetching the i18n data.  Please check the path exists for the data being requested');
            }
            //if an error fetching the json data happened, lets switch to en.json and try again.
            Config.setDefaultLanguage();
            return loadData();
        }

        let valid = validateCurrentLocale(data);
        if (!valid) {
            //if the locale isn't active or no match found.
            //set back to default and load again
            throw new Error('This locale is not active.  Please activate it to continue.');
        }

        const { timeline, timelineOrder, deepdive, filter, generic } = data;
        const timelineOrderArr = Object.values(timelineOrder);

        _this.FILTERS = Object.keys(filter).map(key => filter[key]);
console.log(timelineOrderArr);
        _this.MILESTONES = timelineOrderArr.filter(a => timeline[a.key].timelinemetadata.active)
            .map((v) => {
                let _timeline = timeline[v.key];

                let value = { id: v.key, order: v.order };
                value.metadata = _timeline.timelinemetadata;
                if (isTooltip({ timeline: _timeline })) value.tooltip = _timeline.timelinetooltip.find(Boolean);
                if (isDeepDive({ timeline: _timeline, deepdive })) {
                    let deepDive = deepdive[_timeline?.timelinemetadata['deep-dive']];
                    value.deepDive = deepDive;
                    // value.deepDive = {
                    //     metadata: deepDive?.deepdivemetadata,
                    //     content: deepDive?.deepdivecontent
                    // };
                }

                return value;
            });

        _this.GENERIC = {};
        for (var _key in generic) {
            if (_key !== '_order' && _key !== '_temp') {
                let _val = generic[_key];
                if (_val.key) {
                    let defaultValue = null;
                    if (_val._type) {
                        switch (_val._type) {
                            case "genericfile":
                            case "genericfilelocalized":
                                defaultValue = null;
                                break;
                            default:
                                defaultValue = "";
                                break;
                        }
                    }
                    _this.GENERIC[_val.key] = _val.value || defaultValue;
                } else {
                    console.error('found a generic object without a key', _key);
                }
            }
        }
    }

    //*** Public methods

    this.getMilestonById = function (id) {
        return _this.data.milestones.find(milestone => milestone.id === id);
    };

    this.get = function (key) {
        const str = _this.GENERIC[key];

        if (!str) {
            console.log(`${key} not found in generic`);
        }

        return str || '$MISSING$';
    };
}, 'static');
