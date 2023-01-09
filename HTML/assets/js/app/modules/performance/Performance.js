Class(function Performance() {
    Inherit(this, Component);
    const _this = this;

    var _overrides = Storage.get('performance_override') || {};

    (async function() {
        if ((Utils.query('performance') && Utils.query('edit')) || Utils.query('custom')) {
            await Hydra.ready();
            for (let key in _overrides) {
                Tests[key] = _ => _overrides[key];
            }
        }
    })();

    function save(key, value) {
        _overrides[key] = value;
        Storage.set('performance_override', _overrides);
    }

    function convert(tier) {
        if (GPU.BLACKLIST) return 'F';
        switch (tier) {
            case 5: return 'A++'; break;
            case 4: return 'A+'; break;
            case 3: return 'A'; break;
            case 2: return 'B'; break;
            case 1: return 'C'; break;
            case 0: return 'D'; break;
        }
    }

    //*** Event handlers

    //*** Public methods
    this.displayResults = async function() {
        let editing = Utils.query('edit');

        await GPU.ready();
        __body.bg('#000');

        let $results = __body.create('PerformanceResults');
        __body.css({overflowY: 'scroll', background: '#000' });
        $results.fontStyle('Arial', 16, '#fff').css({marginLeft: 50, marginRight: 50, 'user-select': 'auto'});

        Mobile.allowNativeScroll();

        HydraCSS.style('.PerformanceResults *', {position: 'relative', 'user-select': 'auto'});

        let code = Tests.constructor.toString();
        let tests = '';
        for (let key in Tests) {
            let result = Tests[key]();
            tests += `<p><b>${key}:</b> `;

            if (editing) {
                if (typeof result === 'number') {
                    tests += `<input class="${key}" value="${result.toString()}" /></p>`;
                }

                if (typeof result === 'boolean') {
                    tests += `<input class="${key}" type="checkbox" ${result ? 'checked' : ''}/></p>`;
                }
            } else {
                tests += result + '</p>';
            }
        }

        let html = `<h1>Performance Results</h1>
                    <p><b>GPU:</b> ${Device.graphics.webgl ? Device.graphics.webgl.gpu : 'WEBGL UNAVAILABLE'}</p>
                    <p><b>WebGL Version:</b> ${Device.graphics.webgl ? Device.graphics.webgl.version : 'WEBGL UNAVAILABLE'}</p>
                    <p><b>GPU Tier:</b> ${Device.mobile ? convert(GPU.M_TIER) : convert(GPU.TIER)} [${Device.mobile ? GPU.M_TIER : GPU.TIER}]</p>
                    <p><b>Mobile:</b> ${Device.mobile ? Object.keys(Device.mobile).filter(key => Device.mobile[key]) : 'false'} </p>
                    <p><b>User Agent:</b> ${Device.agent}</p>
                    <p><b>OS:</b> ${Device.system.os}</p>
                    <p><b>DPR:</b> ${Device.pixelRatio}</p>
                    <p><b>Screen Size:</b> ${screen.width} x ${screen.height}</p>
                    <p><b>Stage Size:</b> ${Stage.width} x ${Stage.height}</p>
                    
                    <h2>Project-Specific Tests</h2>
                    ${editing ? '<button class="resetBtn">Reset All</button>' : ''}
                    ${tests}
        `;

        $results.html(html);

        if (editing) {
            await defer();

            let btn = document.querySelector('.resetBtn');
            btn.onclick = _ => {
                Storage.set('performance_override', null);
                location.reload();
            };

            for (let key in Tests) {
                let div = document.querySelector(`.${key}`);
                (function(div, key) {
                    div.onchange = _ => {
                        let value = div.value;
                        if (isNaN(value)) {
                            value = div.checked;
                        } else {
                            value = Number(value);
                        }

                        save(key, value);
                    }
                })(div, key);
            }
        }
    }
}, 'static');