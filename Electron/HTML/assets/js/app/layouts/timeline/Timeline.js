Class(function Timeline() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);

    const _this = this;
    const _milestones = [];
    const _horizontal = [];
    const _vertical = [];
    let _batching;

    //*** Constructor
    (function () {
        _this.layout = _this.initClass(SceneLayout, 'Timeline');

        initMilestones();
        collectPositions();
        initDetectYear();

        if (Global.PLAYGROUND === 'Timeline') {
            _this.group.position.x -= 6.0;
        }

        _batching = _this.initClass(TimelineBatching, _this, _milestones);
        const _mouseMilestones = _this.initClass(MouseMilestones, _milestones);

        _this.bind(GlobalStore, 'vertical', updatePosition);
        _this.bind(MainStore, 'bounds', updateProgress);
        _this.flag('isReady', true);
    })();

    function initMilestones() {
        const match = {
            'google-inc-launches': GoogleIncLaunchesCustom,
            'images': ImagesCustom,
            'shopping-products': ProductsCustom,
            'autocomplete': AutocompleteCustom,
            'mobile-web-search': MobileWebSearchCustom,
            'universal-search': UniversalSearchCustom,
            'voice-search': VoiceSearchCustom,
            'search-by-image': SearchByImageCustom,
            'knowledge-graph': KnowledgeGraphCustom,
            'google-my-business': GoogleMyBusinessCustom,
            'discover': DiscoverCustom,
            'google-lens': GoogleLensCustom,
            'flood-forecasting': FloodForecastingCustom,
            'bert': BertCustom,
            'wildfire-information': WildfireInformationCustom,
            'multi-modal-search-with-mum': MumCustom,
            'lens-ar-translate': LensARCustom
        };

        DataModel.MILESTONES.forEach((data, index) => {
            let instance;
            let classInstance = Milestone;
            const customClassName = `${data.metadata.id}Custom`;

            if (customClassName in window) {
                classInstance = window[customClassName];
            }

            if (match[data.id]) {
                classInstance = match[data.id];
            }

            instance = _this.initClass(classInstance, data);
            _milestones.push(instance);
        });
    }

    function initDetectYear() {
        _this.initClass(DetectYear, _milestones);
    }

    function collectPositions() {
        const dataHorizontal = Assets.JSON['data/google/timeline/milestones_horizontal'];
        const dataVertical = Assets.JSON['data/google/timeline/milestones_vertical'];

        if (!dataHorizontal) {
            console.log('Missing milestones horizontal data');
        }

        if (!dataVertical) {
            console.log('Missing milestones vertical data');
        }

        const horizontalOffset = dataHorizontal.offset.buffer;
        const horizontalBbox = dataHorizontal.bbox.buffer;
        const verticalOffset = dataVertical.offset.buffer;
        const verticalBbox = dataVertical.bbox.buffer;

        const itemsHorizontalOffset = horizontalOffset.length / 3;
        const itemsHorizontalBbox = horizontalBbox.length / 2;
        const itemsVerticalOffset = verticalOffset.length / 3;
        const itemsVerticalBbox = verticalBbox.length / 2;

        if (itemsHorizontalOffset !== itemsHorizontalBbox) {
            console.log('Mismatch between offset and bbox on horizontal');
        }

        if (itemsVerticalOffset !== itemsVerticalBbox) {
            console.log('Mismatch between offset and bbox on vertical');
        }

        if (itemsHorizontalOffset !== itemsVerticalOffset) {
            console.log('Mismatch between horizontal and vertical');
        }

        if (_milestones.length !== itemsHorizontalOffset) {
            console.log(`Mismatch number of Milestones (${_milestones.length}) from the CMS and number of spots in the JSON (${itemsHorizontalOffset})`);
        }

        let i2 = 0;
        for (let i = 0; i < horizontalOffset.length; i += 3) {
            _horizontal.push({
                position: new Vector3(horizontalOffset[i], horizontalOffset[i + 1], horizontalOffset[i + 2]),
                bbox: new Vector2(horizontalBbox[i2], horizontalBbox[i2 + 1])
            });

            i2 += 2;
        }

        i2 = 0;
        for (i = 0; i < verticalOffset.length; i += 3) {
            _vertical.push({
                position: new Vector3(verticalOffset[i], verticalOffset[i + 1], verticalOffset[i + 2]),
                bbox: new Vector2(verticalBbox[i2], verticalBbox[i2 + 1])
            });

            i2 += 2;
        }

        // order based on position
        _horizontal.sort((a, b) => {
            if (a.position.x < b.position.x) {
                return -1;
            }

            return 1;
        });

        _vertical.sort((a, b) => {
            if (a.position.y > b.position.y) {
                return -1;
            }

            return 1;
        });
    }

    function getHorizontal(index) {
        if (_horizontal[index]) {
            return _horizontal[index];
        }

        // Fix for missing spots.
        const last = _horizontal.last();
        const diff = index - (_horizontal.length - 1);
        const x = last.position.x + (diff * 2.0); // 3 unit space between each missing spot.

        return {
            position: new Vector3(x, 0, 0),
            bbox: new Vector2(0.5, 0.5)
        };
    }

    function getVertical(index) {
        if (_vertical[index]) {
            return _vertical[index];
        }

        // Fix for missing spots.
        const last = _vertical.last();
        const diff = index - (_vertical.length - 1);
        const y = last.position.y - (diff * 2.0); // 3 unit space between each missing spot.

        return {
            position: new Vector3(0, y, 0),
            bbox: new Vector2(0.5, 0.5)
        };
    }

    // { x: 0, y: 0, width: 0, height: 0 }
    function parseMilestoneModifier(str) {
        if (!str) return;

        try {
            // add "" to json keys
            const correctJson = str.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ');
            const json = JSON.parse(correctJson);

            return json;
        } catch (e) {
            console.warn('impossible to parse milestone modifier', str);
            console.warn(e);
            return false;
        }
    }

    function updatePosition(isVertical) {
        _milestones.forEach((milestone, index) => {
            const horizontal = getHorizontal(index);
            const vertical = getVertical(index);

            let position = horizontal.position;
            let bbox = horizontal.bbox;

            if (isVertical) {
                position = vertical.position;
                bbox = vertical.bbox;
            }

            // { x: 0, y: 0, width: 0, height: 0 }
            const horizontalModifier = milestone.data?.metadata?.horizontalModifier;
            const verticalModifier = milestone.data?.metadata?.verticalModifier;
            const modifier = isVertical ? verticalModifier : horizontalModifier;

            if (modifier) {
                const json = parseMilestoneModifier(modifier);

                if (json && json?.x) position.x += parseFloat(json.x);
                if (json && json?.y) position.y += parseFloat(json.y);
                if (json && json?.width) bbox.x += parseFloat(json.width);
                if (json && json?.height) bbox.y += parseFloat(json.height);
            }

            milestone.setPosition(position);
            milestone.setBBox(bbox);
        });
    }

    function updateProgress(bounds) {
        const isVertical = GlobalStore.get('vertical');

        _milestones.forEach((milestone, index) => {
            const horizontal = getHorizontal(index);
            const vertical = getVertical(index);
            let progress = 0;

            if (isVertical) {
                const position = vertical.position;
                progress = Math.map(-position.y, bounds.vertical[0], bounds.vertical[1], 0, 1, true);
            } else {
                const position = horizontal.position;
                progress = Math.map(position.x, bounds.horizontal[0], bounds.horizontal[1], 0, 1, true);
            }

            milestone.progress = progress;
        });
    }

    //*** Event handlers

    //*** Public methods
    this.get('milestones', _ => _milestones);
    this.get('batching', _ => _batching);
    this.ready = () => _this.wait('isReady');

    this.focusToNearest = function(milestone) {
        // When returning from deep-dive or overview,
        // focus the nearest gla11y element, otherwise pressing tab would start from the beginning.
        const debug = false;

        if (milestone.cta) {
            const ariaLabel = milestone?.cta?.seoText;
            const a11yelement = document.querySelector(`.GLA11y [aria-label="${ariaLabel}"]`);

            if (a11yelement) {
                if (debug) console.log('focus el', a11yelement);

                // Focus without triggering any side-effect.
                const oldonfocus = a11yelement.onfocus;
                a11yelement.onfocus = () => {};
                a11yelement.focus();
                a11yelement.onfocus = oldonfocus;
            }

            return;
        }

        if (milestone.plus) {
            const ariaLabel = milestone?.plus?.seoText;
            const a11yelement = document.querySelector(`.GLA11y [aria-label="${ariaLabel}"]`);

            if (a11yelement) {
                if (debug) console.log('focus el', a11yelement);

                a11yelement.focus();
            }

            return;
        }

        const index = _this.milestones.indexOf(milestone);
        const prevIndex = index - 1;

        if (index <= 0) {
            return;
        }

        const prevMilestone = _this.milestones[prevIndex];
        _this.focusToNearest(prevMilestone);

        if (debug) {
            console.log('No focusable element found');
            console.log('try previous milestone.');
        }
    };

    this.getMilestoneById = id => {
        let match = _milestones.find(milestone => (milestone.id === id || milestone.data.metadata.id === id));
        return match;
    };
});
