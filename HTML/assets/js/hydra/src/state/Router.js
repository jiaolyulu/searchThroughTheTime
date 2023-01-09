/**
 * @name Router
 * @example https://www.notion.so/activetheory/Router-640a48eeef824aecad4d56e4822347e5
 */

Class(function Router(_isHash, _rootPath) {
  Inherit(this, PushState, _isHash);
  const _this = this;
  var _debounce, _prevView, _nextView;

  var _routes = [];
  var _404Route;

  _this.currentRoute = null;
  _this.fireChangeWhenSet = true;

  //*** Constructor
  (function () {
    setRootPath();
    initEvents();
  })();

  function initEvents() {
    _this.events.sub(_this, Events.UPDATE, handleState);
  }

  function matchRoute(path) {
    let matchedRoute = null;

    _routes.forEach(routesList => {
      const match = routesList.list.find(route => {
        // match on the route root
        if (route.root === path[0]) {

          if((route.pathSplit.length === path.length) && route.pathSplit[path.length - 1] === '*') {
            // the route we're at is a wildcard
            return true;
          }
          if (!path[1] && !route.params) {
            // route has no params
            return true;
          } else if (path[1] && route.params && !((route.children && route.children.length > 0) || path[2])) {
            // route has param without nesting
            return true;
          } else if (path[1] && (route.children && route.children.length > 0)) {
            // route has param with nesting
            route.children.forEach(c => {
              c.active = c.path === path[2]
            });
            return true;
          } else if (path[1] && route.pathSplit.length === path.length) {
            // if a static route like /test/child, and we found a match this will get hit.
            let didMatchAll = true;
            route.pathSplit.forEach((pathSplitPath, index) => {
              if(pathSplitPath !== path[index]) {
                didMatchAll = false;
              }
            });

            if(didMatchAll) {
              return true;
            }
          }
        }

        return false;
      })

      if (match) {
        matchedRoute = match;
      }
    })

    return matchedRoute;
  }

  function handleState(e) {
    let value = e?.value;
    let split = e?.split;

    if (!value) {
      value = _this.getState();
      split = value.split('/');
    }
    
    let route = null;
    let cb = null;

    _this.lock();

    _routes.forEach(({ callback, list }) => {
      if (route) {
        return
      }
      route = matchRoute(split);
      cb = callback;
    });

    if(route && route.redirect) {
      let redirectedRoute = matchRoute(route.redirect.split('/'));
      if(redirectedRoute) {
        if(route.updateURL) {
          //if we need to update the URL, lets set the appstate, which will re-hit this handleState function.
          _this.unlock();
          _this.setState(route.redirect);
          return;
        }
        //else, lets set the route to the one we've chosen to go to.
        route = redirectedRoute;
      }
    }

    if (!route) {
      route = _404Route;
    }

    doRoute(route, split, cb)
  }

  async function doRoute(route, split, callback) {
    _nextView = route.view;

    let params = null;

    if (route.params) {
      params = {
        [Object.keys(route.params)[0]]: split?.[1]
      }
    } else {
      params = split?.[1]
    }

    await callback(_prevView, _nextView, split.join('/'), params, route);
    await _nextView?.onRouteChange?.({ params, path: split.join('/'), name: route.name, children: route.children, meta: route.meta });

    _prevView = _nextView;
    _this.currentRoute = {...route, params};
    _this.unlock();
  }

  function setRootPath(val) {
    let rootPath;
    if (typeof _rootPath === 'string') {
      //if this has manually been set in the constructor
      rootPath = _rootPath;
    } else {
      rootPath = Hydra.LOCAL ? '' : '/'; //without this, no routes get picked up on prod.
    }
    _this.setRoot(rootPath); //on PushState.js
  }

  //*** Public methods
  /**
   * @name this.registerRoutes
   * @memberof Router
   *
   * @function
   * @param callback
   * @param list
  */
  this.registerRoutes = function (callback, list) {
    // check routes with params and append params to a seperate object
    list.forEach(element => {
      const split = element.path.split('/');
      if(element.path.startsWith('/')) {
        throw new Error('router paths should not start with /');
      }
      element.root = split[0];
      element.pathSplit = split;

      if(element.path === '404') {
        _404Route = element;
      }
      split.forEach(s => {
        if (s[0] === ':') {
          element.params = {
            [`${s.substring(1)}`]: ''
          }
          return;
        }
      })
    });

    if(!_404Route) {
      throw new Error('Error: no 404 route defined.  Please define a route whos path is "404" ')
    }

    _routes.push({ callback, list });
    clearTimeout(_debounce);
    _debounce = _this.delayedCall(handleState, 1);
  }

  /**
   * @name this.navigate
   * @memberof Router
   * - navigates to a new URL
   * @function
   * @param path - a path to navigate to.
  */
  this.navigate = function(path) {
    if(path.startsWith('/')) {
      path = path.substring(1);
    }
    _this.setState(path);
  }

  /**
   * @name this.navigate
   * @memberof Router
   * - updates the URL only.
   * @function
   * @param path - a path to navigate to.
  */
  this.replace = function(path) {
    if(path.startsWith('/')) {
      path = path.substring(1);
    }
    _this.replaceState(path);
  }

  /**
   * @name this.getState
   * @memberof Router
   *
   * @function
   * @returns {String}
   */

  /**
   * @name this.setRoot
   * @memberof Router
   *
   * @function
   * @param {String} root
   */

  /**
   * @name this.setState
   * @memberof Router
   *
   * @function
   * @param {String} state
   */

  /**
   * @name this.enableBlocker
   * @memberof Router
   *
   * @function
   */

  /**
   * @name this.replaceState
   * @memberof Router
   *
   * @function
   * @param {String} state
   */

  /**
   * @name this.setTitle
   * @memberof Router
   *
   * @function
   * @param {String} title
   */

  /**
   * @name this.unlock
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.lock
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.useInternal
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.useHash
   * @memberof Router
   *
   * @function
   */
});