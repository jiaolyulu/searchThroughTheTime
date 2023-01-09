Class(function LangPicker() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    //*** Constructor
    (function () {
        initHTML();
    })();

    function initHTML() {
        const lang = Utils.query('lang') || 'en';

        $this.html(`
          <p>Current lang: ${lang}</p>
          <select>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
          </select>
        `);

        const select = $this.div.querySelector('select');

        select.style.pointerEvents = 'all';

        select.addEventListener('change', e => {
            const v = select.options[select.selectedIndex].value;

            window.location = `?lang=${v}`;
        });

        $this.css({ top: 20, right: 20, width: 100 });
    }

    //*** Event handlers

    //*** Public methods
});
