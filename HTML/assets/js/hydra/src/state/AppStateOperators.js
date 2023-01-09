/**
 * @name AppStateOperators
 * 
 * operators that emitted value can be piped through
 * 
 * state.bind('myvalue',
 *  skip(1),
 *  map(value => value + 1),
 *  tap(value => console.log(value + 1)),
 *  // last function can be an operator or any function
 *  myFunction
 * )
 * 
 */

 Class(function AppStateOperators(_default) {
     Inherit(this, Component)

    /**
     * @name map
     * @memberof AppStateOperators
     * 
     * Apply a transformation to each emitted source value, return that transformed value
     * 
     * map(value => value + 1)
     * 
     * @param {function (value) {return modifiedValue}}
     */
     this.map = fn => value => fn(value);

    /**
     * @name tap
     * @memberof AppStateOperators
     * 
     * Perform side effects with each emission, return the source value unchanged
     * 
     * tap(value => _this.count = value)
     * 
     * @param {function (value) {return value}}
     */
     this.tap = fn => value => (fn(value), value);

     /**
     * @name filter
     * @memberof AppStateOperators
     * 
     * Check emitted source value against conditions
     *
     * If passes, returns source value
     * If fails, returns a rejected Promise which will prevent binding emission
     * 
     * Passed in function has access to both emitted value, as well as number of emissions
     * associated binding
     * 
     * // only take emissions with value greater than 4
     * filter(value => value > 4)
     * 
     * // only take first 3 emissions
     * filter((value, emittedCount) => emittedCount < 3)
     * 
     * @param {function (value, emittedCount) {return value}}
     */
     this.filter = fn => {
        return (value, emittedCount) => {
            if (!fn(value, emittedCount)) return Promise.reject()
            return value
        }
    }

    /**
     * @name skip
     * @memberof AppStateOperators
     * 
     * Skip the given number of emissions
     * 
     * // skip first
     * skip(1)
     * 
     * @param {skipCount} number of emissions to skip
     */
    this.skip = skipCount => this.filter((_,  emittedCount) => {
        return skipCount <= emittedCount
    })

    /**
     * !! EXPERIMENTAL !!
     * so use at your own risk
     * 
     * Allows for auto binding.destroy
     * 
     * untilDestroyed(ComponentContext)
     * untilDestroyed(_this)
     * 
     * @param {*} ctx - Component context
     * @returns 
     */
    this.untilDestroyed = ctx => {
        let checked = false;
        return (value, _, binding) => {
            if (checked) return value;
            checked = true;
            // _bindOnDestroy ok to use?
            ctx._bindOnDestroy(_ => {
                if (Hydra.LOCAL) console.log('binding destroyed ')
                binding.destroy?.()
            })
            return value
        }

    }

}, 'static');


