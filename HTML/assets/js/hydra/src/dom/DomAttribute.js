class DOMAttribute {
    constructor({name, value, belongsTo, bindingLookup}) {
        this.name = name;
        this.value = value;
        this.belongsTo = belongsTo; 
        this.bindingLookup = bindingLookup;
    }
}