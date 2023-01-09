Class(function ViewController() {
    Inherit(this, Component);
    Inherit(this, Router, true); // Force hashing on prod.

    const _this = this;
    const _views = {};
    let _routeParams = {};

    //*** Constructor
    (function () {
        createViews();
        register();
    })();

    async function createViews() {
        Global.views = _views;
        _views.global = _this.initClass(GlobalView);
        World.SCENE.add(_views.global.group);

        _views.main = _this.initClass(MainView);
        _views.main.visible = false;
        World.SCENE.add(_views.main.group);

        _views.detail = _this.initClass(DetailView);
        _views.detail.visible = false;
        World.SCENE.add(_views.detail.group);

        _views.overview = _this.initClass(OverviewView);
        _views.overview.visible = false;
        World.SCENE.add(_views.overview.group);

        await Promise.all([
            _views.global.ready(),
            _views.main.ready(),
            _views.detail.ready(),
            _views.overview.ready()
        ]);
    }

    function register() {
        if (window.location.hash) {
            window.location.hash = '';
        }

        _this.registerRoutes(onRouteChange, [
            { path: '', name: 'main', view: _views.main },
            { path: '404', name: '404', view: _views.main },
            { path: 'detail/:id', name: 'detail', view: _views.detail },
            { path: 'overview', name: 'overview', view: _views.overview }
        ]);
    }

    async function onRouteChange(from, to, path, params, route) {
        _routeParams = params;

        if (from === to) {
            return;
        }

        if (GlobalStore.get('transitioning')) {
            return;
        }
        await SceneTransition.instance().transition(from, to);
        if (typeof (Analytics) !== 'undefined') Analytics.trackPageView(path, route.name);
    }

    this.navigate = async function(path) {
        if (Hydra.LOCAL && (Config.RESTORE || UIL.loaded)) {
            console.log('Dev navigation disabled');
            return;
        }

        const transitioning = GlobalStore.get('transitioning');

        if (transitioning) {
            await SceneTransition.instance().promise;
            await _this.wait(100);
        }

        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        _this.setState(path);
    };

    this.get('views', _ => _views);
    this.get('routeParams', _ => _routeParams);
}, 'singleton');
