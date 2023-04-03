/**
 * @name Stage
 */

Hydra.ready(function() {
    //*** Set global shortcut to window, document, and body.

    /**
     * A HydraObject wrapper of the window object
     * @name window.__window
     * @memberof Stage
     */
    window.__window = $(window);

    /**
     * A HydraObject wrapper of the window object
     * @name window.__document
     * @memberof Stage
     */
    window.__document = $(document);

    /**
     * A HydraObject wrapper of the document.body element
     * @name window.__body
     * @memberof Stage
     */
    window.__body = $(document.getElementsByTagName('body')[0]);

    /**
     * A HydraObject wrapper of the main #Stage div element. Size of application to be retrieved from this object via Stage.width and Stage.height.
     * @name window.Stage
     * @memberof Stage
     */
    window.Stage = !!window.Stage && !!window.Stage.style ? $(window.Stage) : __body.create('#Stage');

    Stage.size('100%');
    Stage.__useFragment = true;
    Stage.width = window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
    Stage.height = window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;
});