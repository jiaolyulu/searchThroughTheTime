Class(function OverViewOptionBase() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;

    //*** Constructor
    (function () {
        addHandlers();
    })();

    //*** Event handlers
    function addHandlers() {
        _this.subscribeMutation(OverviewStore, 'setFilter', handleFilterSelection);
    }

    function handleFilterSelection() {

    }

    //*** Public methods
});
