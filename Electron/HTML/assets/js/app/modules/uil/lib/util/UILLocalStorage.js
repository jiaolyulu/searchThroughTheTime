Class(function UILLocalStorage() {

    const prefix = `UIL_`;

    this.set = function(id, value) {
        sessionStorage.setItem(`${prefix}${id}`, JSON.stringify({value}));
    }

    this.get = function(id) {
        let json = JSON.parse(sessionStorage.getItem(`${prefix}${id}`));
        return json && json.value || undefined;
    }

}, 'static');