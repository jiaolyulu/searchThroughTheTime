Class(function CalcFilteredOptionPosition() {
    function getTargetPosX($obj) {
        return $obj.element.div.getBoundingClientRect().left;
    }

    function getTargetPosY($obj) {
        return $obj.element.div.getBoundingClientRect().top;
    }

    this.getPhase = function ($options, { selectedFilter }) {
        let _milestoneFound = false;
        let _totalOptionsCount = $options.length;
        for (let i = 0; i < _totalOptionsCount; i++) {
            const option = $options[i];
            let filters = option.filters.filter(item => selectedFilter === item.filter);
            if (filters.length > 0) {
                _milestoneFound = true;
                return i / _totalOptionsCount;
            }
            if (_milestoneFound) break;
        }
    };

    this.getPosition = function ($options, {
        selectedFilter,
        direction = 'horizontal'
    }) {
        let _milestoneFound = false;
        //iterate through all the options
        for (let $option of $options) {
            //go through the options filters
            for (let filters of $option.filters) {
                //if there is a filter match, get the milestone's offset based on direction
                if (selectedFilter === filters.filter) {
                    _milestoneFound = true;
                    if (direction === 'horizontal') {
                        return getTargetPosX($option);
                    }
                    return getTargetPosY($option);
                }
            }
            //break loop entirely if first object found
            if (_milestoneFound) break;
        }
    };

    //magic number 55: mobile milestone option height + margin
    this.getOffset = function ($options, { selectedFilter, offsetWidth = 0, offsetHeight = 55, offsetStart = 60, offsetEnd = 0, direction = 'horizontal' }) {
        let _milestoneFound = false;
        let _totalOptionsCount = $options.length;
        for (let i = 0; i < _totalOptionsCount; i++) {
            const $option = $options[i];
            let filters = $option.filters.filter(item => selectedFilter === item.filter);
            if (filters.length > 0) {
                _milestoneFound = true;
                if (direction === 'horizontal') {
                    return $option.yearIndex * offsetWidth;
                }
                return (i * offsetHeight);
            }
            if (_milestoneFound) break;
        }
    };
}, 'static');
