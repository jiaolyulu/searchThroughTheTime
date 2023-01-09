/**
 * @name LinkedList
 *
 * @constructor
 */

Class(function LinkedList() {
    var prototype = LinkedList.prototype;

    /**
     * @name length
     * @memberof LinkedList
     */
    this.length = 0;
    this.first = null;
    this.last = null;
    this.current = null;
    this.prev = null;

    if (typeof prototype.push !== 'undefined') return;

    /**
     * @name push
     * @memberof LinkedList
     *
     * @function
     * @param {*} obj
     */
    prototype.push = function(obj) {
        if (!this.first) {
            this.first = obj;
            this.last = obj;
            obj.__prev = obj;
            obj.__next = obj;
        } else {
            obj.__next = this.first;
            obj.__prev = this.last;
            this.last.__next = obj;
            this.last = obj;
        }

        this.length++;
    };

    /**
     * @name remove
     * @memberof LinkedList
     *
     * @function
     * @param {*} obj
     */
    prototype.remove = function(obj) {
        if (!obj || !obj.__next) return;

        if (this.length <= 1) {
            this.empty();
        } else {
            if (obj == this.first) {
                this.first = obj.__next;
                this.last.__next = this.first;
                this.first.__prev = this.last;
            } else if (obj == this.last) {
                this.last = obj.__prev;
                this.last.__next = this.first;
                this.first.__prev = this.last;
            } else {
                obj.__prev.__next = obj.__next;
                obj.__next.__prev = obj.__prev;
            }

            this.length--;
        }

        obj.__prev = null;
        obj.__next = null;
    };

    /**
     * @name empty
     * @memberof LinkedList
     *
     * @function
     */
    prototype.empty = function() {
        this.first = null;
        this.last = null;
        this.current = null;
        this.prev = null;
        this.length = 0;
    };

    /**
     * @name start
     * @memberof LinkedList
     *
     * @function
     * @return {*}
     */
    prototype.start = function() {
        this.current = this.first;
        this.prev = this.current;
        return this.current;
    };

    /**
     * @name next
     * @memberof LinkedList
     *
     * @function
     * @return {*}
     */
    prototype.next = function() {
        if (!this.current) return;
        this.current = this.current.__next;
        if (this.length == 1 || this.prev.__next == this.first) return;
        this.prev = this.current;
        return this.current;
    };

    /**
     * @name destroy
     * @memberof LinkedList
     *
     * @function
     * @returns {Null}
     */
    prototype.destroy = function() {
        Utils.nullObject(this);
        return null;
    };

});