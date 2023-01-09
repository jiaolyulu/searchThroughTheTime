Class(function GLA11y() {
    Inherit(this, Element);
    const _this = this;
    var $this;

    var _groups = [];
    var _links = [];

    //*** Constructor
    (async function () {
        window.GLSEO = _this;
        await Hydra.ready();
        initHTML();
        HydraCSS.style('.GLA11y *', { position: 'relative' });
    })();

    function initHTML() {
        $this = _this.element;
        $this.setZ(-1);
        Stage.add($this);
    }

    function isVisible(group) {
        if (group.__glseoParent) {
            const seoHidden = !!group.__glseoParent.seoHidden;
            const hidden = !!group.__glseoParent.hidden;

            return (!seoHidden && !hidden);
        }

        return group.seo.enabled && group.determineVisible();
    }

    function isDeleted(group) {
        if (group.__glseoParent) {
            return group.__glseoParent.deleted;
        }

        return group.deleted;
    }

    function checkItemVisibility(seo) {
        Array.prototype.slice.call(seo.div.children).forEach(div => {
            let seo = div.hydraObject;
            let group = seo && seo.group;
            if (!seo || !group) return;
            let hidden = !group.determineVisible();
            if (hidden !== seo.hidden) {
                if (hidden) {
                    seo.hide();
                } else {
                    seo.show();
                }
                seo.hidden = hidden;
            }
        });
    }

    function loop() {
        for (let i = _groups.length - 1; i > -1; i--) {
            let group = _groups[i];

            if (isDeleted(group)) {
                $this.removeChild(group.seo);
                return _groups.splice(i, 1);
            }

            if (isVisible(group)) {
                if (group.seo && group.seo.hidden) {
                    group.seo.hidden = false;
                    $this.add(group.seo);
                }
                checkItemVisibility(group.seo);
            } else {
                if (group.seo && !group.seo.hidden) {
                    group.seo.hidden = true;
                    $this.removeChild(group.seo, true);
                }
            }
        }

        for (let i = _links.length - 1; i > -1; i--) {
            let group = _links[i];

            if (isDeleted(group)) {
                $this.removeChild(group.seo);
                return _groups.splice(i, 1);
            }

            if (isVisible(group)) {
                if (group.seoHidden) {
                    group.seoHidden = false;
                    group.seoDOM.forEach(obj => obj.show());
                }
            } else {
                if (!group.seoHidden) {
                    group.seoHidden = true;
                    group.seoDOM.forEach(obj => obj.hide());
                }
            }
        }
    }

    //*** Event handlers

    //*** Public methods
    this.registerPage = function (group, name) {
        let topLevel = group;

        group = group instanceof GLUIObject ? group : (group.group || group.scene || group);
        if (!group.determineVisible && group.group) group.determineVisible = group.group.determineVisible.bind(group.group);

        if (!Global.PLAYGROUND) World.ELEMENT.mouseEnabled(false);

        topLevel.seo = group.seo = $(name);
        group.seo.hidden = true;
        group.seo.enabled = true;

        let remove = group.seo.remove.bind(group.seo);
        group.seo.remove = _ => {
            _groups.remove(group);
            remove();
        };

        _groups.push(group);
        _this.startRender(loop, 10);
    };

    this.setPageH1 = function (group, title, type = 'h1') {
        let $h1 = group.seo.h1;
        if (!$h1) {
            $h1 = group.seo.create('title', type);

            if (type === 'h1') {
                defer(() => {
                    // Move it to the top.
                    let el = $h1.div;
                    el.parentNode.insertBefore(el, el.parentNode.firstChild);
                });
            }
        }
        $h1.text(title);
    };

    this.registerPersist = function (group, name) {
        let topLevel = group;
        group = group instanceof GLUIObject ? group : (group.group || group.scene || group);
        if (!Global.PLAYGROUND) World.ELEMENT.mouseEnabled(false);
        topLevel.seo = group.seo = $this.create(name);
    };

    this.link = function ($dom, group) {
        if ($dom instanceof HydraObject) {
            group = group.group || group.scene || group;

            if (!group.seoDOM) group.seoDOM = [];
            group.seoDOM.push($dom);

            _links.push(group);
        }

        if ($dom instanceof GLUIObject) {
            $dom.seo = group.seo;
        }
    };

    function aLink($object, url, label, options = {}) {
        let isPlus = false;

        if ($object?.shader?.vsName === 'MilestonePlusShader') {
            isPlus = true;
        }

        let seo = $('link', 'a');

        if (isPlus) {
            seo.attr('aria-expanded', 'false');
            // seo = $('button', 'button');
            // seo.attr('lang', 'it');
        }

        // if (!isPlus) {
        seo.attr('href', url === '#' ? url : Hydra.absolutePath(url));
        // }

        seo.group = $object.group;
        // seo.attr('role', 'button');
        seo.text(label);
        seo.accessible();
        seo.div.onfocus = _ => {
            if (isPlus) {
                seo.attr('aria-expanded', 'true');
            }
            $object._divFocus();
        };
        seo.div.onblur = _ => {
            if (isPlus) {
                seo.attr('aria-expanded', 'false');
            }

            $object._divBlur();
        };
        seo.div.onclick = e => {
            e.preventDefault();
            $object._divSelect();
        };
        if (options.role) {
            seo.attr('role', options.role);
            seo.div.onkeydown = e => {
                switch (e.key) {
                    case ' ':
                    case 'Spacebar':
                        e.preventDefault();
                        e.stopPropagation();
                        $object._divSelect();
                        break;
                }
            };
        }
        return seo;
    }

    this.textNode = function ($text, text) {
        let parent = ($text._3d ? $text.anchor || $text.group : $text)._parent;
        if ($text.parentSeo) {
            let parentSeo = $text.parentSeo;
            if (parentSeo.group && parentSeo.group.seo) parent = parentSeo.group;
            else parent = parentSeo;
        } else if (parent) {
            while (parent && !parent.seo) {
                parent = parent._parent;
            }
        }

        if (!parent) return;

        if (parent.seo) {
            if (!$text.seo) {
                $text.seo = $('text');
                $text.seo.group = $text.group;
                $text.seo.text(text);
                $text.seo.accessible();
                parent.seo.add($text.seo);

                $text.seo.aLink = function (url, options) {
                    let index = Array.prototype.slice.call(parent.seo.div.children).indexOf($text.seo.div);
                    $text.seo.remove();
                    $text.seo = aLink($text, url, text, options);
                    parent.seo.div.insertBefore($text.seo.div, parent.seo.div.children[index]);
                };

                $text.seo.unlink = function () {
                    parent.seo.div.removeChild($text.seo.div);
                    $text.seo.group = null;
                    $text.seo = null;
                };
            } else {
                $text.seo.text(text);
                $text.seo.accessible();
            }
        }
    };

    this.bindToPage = function (parent, child, name) {
        child.__glseoParent = parent;
        _this.registerPage(child, name);
    };

    this.objectNode = function ($object, $parent) {
        let parent = $parent || ($object._3d ? $object.group : $object)._parent;
        if ($object.parentSeo) { parent = $object.parentSeo.group || $object.parentSeo; } else {
            if (!parent) return;
            while (parent && !parent.seo) {
                parent = parent._parent;
            }
        }

        if (!parent) return;
        if (parent.seo) {
            if (!$object.seo) {
                $object.seo = {};
                $object.seo.group = $object.group;

                $object.seo.aLink = function (url, label, options) {
                    let index = Array.prototype.slice.call(parent.seo.div.children).indexOf($object.seo.div);
                    $object.seo = aLink($object, url, label, options);
                    parent.seo.div.insertBefore($object.seo.div, parent.seo.div.children[index]);

                    $object.seo.unlink = function () {
                        parent.seo.div.removeChild($object.seo.div);
                        $object.seo.group = null;
                        $object.seo = null;
                    };
                };
            }
        }
    };
}, 'static');
