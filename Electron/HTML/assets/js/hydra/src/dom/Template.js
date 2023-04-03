class TemplateRoot {
    constructor(string, values) {
        this.string = string;
        this.values = values;
    }

    consolidate() {
        let template = this.string;
        const consolidatedValues = {};

        for (const [marker, value] of Object.entries(this.values)) {

            if (value instanceof TemplateHTML) {
                // If the marker resolves to a template we unroll the string and add the values of the
                // template to the root config.
                const [innerTemplate, innerValues] = value.consolidate();
                template = template.replace(marker , innerTemplate);
                Object.assign(consolidatedValues, innerValues);

            } else if (Array.isArray( value )) {
                // If the marker resolves to an array, we assume a collection of templates. All
                // templates are joined to one long template. Same for all configs.
                let childTemplate = "";

                for (let k = 0; k < value.length; k++ ) {
                    const [innerString, innerValue] = value[k].consolidate();
                    childTemplate += innerString;
                    Object.assign(consolidatedValues, innerValue);
                }

                template = template.replace(marker, childTemplate);
            } else {
                // All other markers are add to the accumulative config.
                consolidatedValues[marker] = value;
            }
        }

        return [template, consolidatedValues];
    }

    modifyMarkers(template, config, dataMarkers, bindings) {
        let count = 0;
        return template
            .replace(/@([a-z]+)="\{\{(hydra-[0-9]+)\}\}"/g, function(_, event, marker) {
                const dataMarker = `data-attach-event-${count++}`;
                dataMarkers.push(dataMarker);
                return `${dataMarker}="${event}|${marker}"`;
            })
            .replace(/\{\{hydra-[0-9]+\}\}/g, function(marker) {
                if (config[marker] && config[marker].state) {
                    bindings.push({lookup: marker.trim()});
                    return marker;
                }
                // handle converting style object references (i.e. from template.dynamicStyles)
                // to css properties and return a string
                // { fontSize: '1rem', letterSpacing: '2rem' } => "font-size: 1rem; letter-spacing: 2rem;"
                if (config[marker][`@style`]) {
                    const styles = config[marker][`@style`];
                    if (!styles || typeof styles !== 'object') {
                        console.error('@style must contain an object');
                        return;
                    }
                    let styleString = '';
                    Object.keys(styles).forEach(prop => {
                        // convert camelCase to kebab-case
                        const kebabProp = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                        styleString += `${kebabProp}: ${styles[prop]};\n`;
                    })
                    return styleString;
                }
                return config[marker];
            });
    }
}

class TemplateHTML extends TemplateRoot {
    constructor(string, values) {
        super(string, values);
    }

    inflate(root, cssElement) {
        let [template, config] = this.consolidate();
        let dataMarkers = [];
        let nestedComponents = [];
        let bindings = new LinkedList();

        let scrollTop = root.firstChild?.scrollTop;

        const t = this.modifyMarkers(template, config, dataMarkers, bindings);

        while (root.firstChild) root.removeChild(root.firstChild);

        if (root.flatBindings) root.flatBindings.forEach(b => b.destroy());
        root.flatBindings = [];

        let fragment = document.createDocumentFragment();
        let newNode = DOMTemplate.parser.parseFromString(t, 'text/html');
        let els = newNode.body.firstChild.querySelectorAll('*');
        let length = els.length;
        fragment.appendChild(newNode.body.firstChild);
        if (cssElement) fragment.appendChild(cssElement);
        for (let index = length-1; index > -1; index--) {
            let el = els[index];

            // if an unknown elemnt is found, assume it is a nested component, in kabab-case
            if (~el.tagName.indexOf('-')) {
                nestedComponents.push(el);
            }

            let innerText = el.innerText;
            let innerHTML = el.innerHTML;
            let attributes = [...el.attributes].map(a => ({name: a.name, value: a.value}));

            if (~innerHTML.indexOf('<')) continue;
            let binding = bindings.start();
            while (binding) {
                let bindingLookup = binding.lookup;

                attributes.forEach(attr => {
                    if (~attr?.value?.indexOf(bindingLookup)) {
                        let obj = config[bindingLookup];
                        const attrObject = new DOMAttribute({
                            name: attr.name,
                            value: el.getAttribute(attr.name),
                            belongsTo: el,
                            bindingLookup
                        });
                        root.flatBindings.push(obj.state.bind(obj.key, attrObject));
                    }
                });

                if (~innerText.indexOf(bindingLookup)) {
                    let obj = config[bindingLookup];
                    if (~innerText.indexOf('@[')) el.innerText = innerText.replace(bindingLookup, obj.key);
                    root.flatBindings.push(obj.state.bind(obj.key, el));
                }
                binding = bindings.next();
            }
        }
        root.appendChild(fragment);

        dataMarkers.forEach(dataMarker => {
            const element = root.querySelector(`[${dataMarker}]`);
            const dataEvent = element.getAttribute(dataMarker);
            const [event, marker] = dataEvent.split("|");
            element.removeAttribute(dataMarker);
            element.addEventListener(`${event}`, config[`{{${marker}}}`]);
        });

        defer(() => {
            nestedComponents.forEach(template => {
                // kabab-case to PascalCase to infer class name
                const className = template.tagName.toLowerCase().replace(/(^\w|-\w)/g, str => str.replace(/-/, '').toUpperCase())
                const hydraObj = $(`#${template.id}`, className, true);
                hydraObj.add(new window[className]());
            });
        });

        if (scrollTop) root.firstChild.scrollTop = scrollTop;
    }
}

class TemplateCSS extends TemplateRoot {
    constructor(string, values) {
        super(string, values);
    }

    /**
     * Injects the template into a given parent element.
     *
     * @param {Element} root
     */
    inflate(root) {
        let [template, config] = this.consolidate();
        let dataMarkers = [];
        let bindings = new LinkedList();

        let element = document.createElement('style');
        element.innerHTML = this.modifyMarkers(template, config, dataMarkers, bindings);

        return element;
    }
}


function styleMap(object) {
    return Object.keys(object).map(key => object[key] ? key : "").join(" ");
}
