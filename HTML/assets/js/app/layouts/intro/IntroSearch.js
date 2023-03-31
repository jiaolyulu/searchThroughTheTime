Class(function IntroSearch() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    var $obj, $container, $lookingGlassIcon, $lookingGlassGlass, $lookingGlassHandle;
    var _lookingGlassGlassPathLen, _lookingGlassHandlePathLen;

    var scaleX = 0.13;
    var scaleY = 0.13;

    var scaleXVertical = 0.169;
    var scaleYVertical = 0.169;

    var _useGLUI = Intro.USE_GLUI;

    //*** Constructor
    (function () {
        const width = 70;
        const height = 71;
        const image = _useGLUI ? Assets.getPath('assets/images/intro/search.png') : null;
        $obj = $gl(width / height, 1, image);
        $obj.enable3D();

        _this.bind(GlobalStore, 'vertical', applyLayout);

        // GLUI.Scene.add($obj);
        _this.add($obj);

        if (!_useGLUI) {
            initHTML();
            initStyles();
        }
    })();

    function applyLayout(isVertical) {
        $obj.scaleX = _useGLUI ? 0.0 : scaleX;
        $obj.scaleY = _useGLUI ? 0.0 : scaleY;
        $obj.x = -1.15;
        $obj.y = 0;
        $obj.z = 0.1 * Intro.DEPTH_MUL;

        if (isVertical) {
            $obj.scaleX = _useGLUI ? 0.0 : scaleXVertical;
            $obj.scaleY = _useGLUI ? 0.0 : scaleYVertical;
            $obj.x = -1.05;
            $obj.y = -0.44;
            $obj.z = 0.1 * Intro.DEPTH_MUL;
        }
    }

    async function initHTML() {
        $container = $('container');
        $lookingGlassIcon = $container.create('looking-glass-icon');
        $lookingGlassIcon.html(IntroSearch.icon);
        $lookingGlassIcon.dom3DCustomVisibility = () => $obj.mesh._drawing;
        DOM3D.add($container, $obj, { domScale: Config.DOM3DScale });

        $lookingGlassGlass = $(document.querySelector('.looking-glass-icon-glass'));
        $lookingGlassHandle = $(document.querySelector('.looking-glass-icon-handle'));

        //await tick saves the day again...
        await _this.wait(1);

        _lookingGlassGlassPathLen = $lookingGlassGlass.div.getTotalLength() + 1;
        _lookingGlassHandlePathLen = $lookingGlassHandle.div.getTotalLength() + 1;

        $lookingGlassGlass.css({ 'stroke-dasharray': `${_lookingGlassGlassPathLen}` });
        $lookingGlassGlass.css({ 'stroke-dashoffset': `${_lookingGlassGlassPathLen}` });

        $lookingGlassHandle.css({ 'stroke-dasharray': `${_lookingGlassHandlePathLen}` });
        $lookingGlassHandle.css({ 'stroke-dashoffset': `${_lookingGlassHandlePathLen}` });
    }

    function initStyles() {
        GoobCache.apply('IntroSearch', $container, /* scss */ `

        & {
          
        }

        .looking-glass-icon {
          position: relative !important;
          width: 100%;
          height: 100%;

          >svg {
            width: 100%;
            height: 100%;
            stroke-linecap: square;
          }
        }

        .looking-glass-icon-glass {

        }

        .looking-glass-icon-handle {

        }

        `);
    }

    function show({ delay = 0, immediate = false, applyFade = false } = {}) {
        if (_useGLUI) {
            if (immediate) {
                $obj.scaleX = scaleX;
                $obj.scaleY = scaleY;
                return;
            }

            $obj.scaleX = 0;
            $obj.scaleY = 0;
            tween($obj, { scaleX, scaleY }, 800, 'easeOutExpo', delay);
            return;
        }
        const animPhaseGlass = { value: _lookingGlassGlassPathLen };
        const animPhaseHandle = { value: _lookingGlassHandlePathLen };
        if (immediate) {
            $lookingGlassGlass.css({ 'stroke-dashoffset': `${animPhaseGlass.value}` });
            $lookingGlassHandle.css({ 'stroke-dashoffset': `${animPhaseHandle.value}` });
            return;
        }

        if (applyFade) {
            $lookingGlassGlass.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            $lookingGlassHandle.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }


        tween(animPhaseGlass, { value: 0 }, 1100, 'easeOutExpo', delay).onUpdate(_ => {
            $lookingGlassGlass.css({ 'stroke-dashoffset': `${animPhaseGlass.value}` });
        });
        tween(animPhaseHandle, { value: 0 }, 1200, 'easeOutExpo', delay + 150).onUpdate(_ => {
            $lookingGlassHandle.css({ 'stroke-dashoffset': `${animPhaseHandle.value}` });
        });
    }
    function immediateHide() {

        $lookingGlassGlass.css({ 'stroke-dasharray': `${_lookingGlassGlassPathLen}` });
        $lookingGlassGlass.css({ 'stroke-dashoffset': `${_lookingGlassGlassPathLen}` });

        $lookingGlassHandle.css({ 'stroke-dasharray': `${_lookingGlassHandlePathLen}` });
        $lookingGlassHandle.css({ 'stroke-dashoffset': `${_lookingGlassHandlePathLen}` });
    }

    function hide({ immediate = false, applyFade = false } = {}) {
        if (_useGLUI) return;
        if (immediate) {
            $lookingGlassGlass.css({ 'stroke-dashoffset': `${0}` });
            $lookingGlassHandle.css({ 'stroke-dashoffset': `${0}` });
            return;
        }

        if (applyFade) {
            $lookingGlassGlass.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            $lookingGlassHandle.tween({ opacity: 0.0 }, 500, 'easeOutCubic');

        }

        const animPhaseGlass = { value: 0 };
        const animPhaseHandle = { value: 0 };
        tween(animPhaseGlass, { value: 0 }, 800, 'easeOutExpo').onUpdate(_ => {
            $lookingGlassGlass.css({ 'stroke-dashoffset': `${animPhaseGlass.value}` });
        });
        tween(animPhaseHandle, { value: 0 }, 800, 'easeOutExpo', 200).onUpdate(_ => {
            $lookingGlassHandle.css({ 'stroke-dashoffset': `${animPhaseHandle.value}` });
        });
    }

    //*** Event handlers

    //*** Public methods
    this.show = show;
    this.hide = hide;
    this.immediateHide = immediateHide;
}, _ => {
    IntroSearch.icon = `
        <svg width="35" height="36" viewBox="0 0 35 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class = "looking-glass-icon-glass" cx="15.0209" cy="15.6855" r="10.9168" transform="rotate(-45 15.0209 15.6855)" stroke="#202124" stroke-width="3"/>
            <path class = "looking-glass-icon-handle" d="M23.125 23.7899L33.9311 34.596" stroke="#202124" stroke-width="3"/>
         </svg>
    `;
});
