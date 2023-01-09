Class(function YearText({ _year, enabled = true, isMobile = false }) {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    var $container, $clipContainer, $yearNumberColumnContainer;
    var $yearNumberColumns = []; //rename
    var _years = [];
    var _desiredYearIndex = 0;
    var _previousYear = 1996;
    var _lerpSpeed = 0.1;

    var _currentNumberPhases = [0, 0, 0, 0];
    var _prevNumberPhases = [0, 0, 0, 0];
    var _alphas = [1, 1, 1, 1];
    var _targetNumberPhases = [0, 0, 0, 0];

    var _currentPos = 0;
    var _prevPos = 0;

    var _enabled = enabled;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
    })();

    function initHTML() {
        $container = $this.create('container');
        $clipContainer = $container.create('clip-container');
        $yearNumberColumnContainer = $clipContainer.create('year-number-columns-container');

        //cudos to Luigi
        DataModel.MILESTONES.forEach(entry => {
            const y = parseInt(entry.metadata.year);

            if (!_years.includes(y)) {
                _years.push(y);
            }
        });

        _years = _years.sort((a, b) => a - b);
        //----->

        initNumberColumns();
    }

    function initNumberColumns() {
        const columnCount = 4;
        //iterate for each digit in a year
        for (let i = 0; i < columnCount; i++) {
            //create container
            let $numberColumn = $yearNumberColumnContainer.create('year-number-column');

            //append property that will be used to determine wether or not to lerp the column
            $numberColumn.applyLerp = true;

            //some stagger goodness
            $numberColumn.stagger = (i / (columnCount - 1));

            //populate container with digits from the year array
            let j = 0;
            while (j < _years.length) {
                //split the year to individual digits
                let splitYear = _years[j].toString().split('');

                //create element containing single digit and assign digit as text
                let $yearNumber = $numberColumn.create('year-text');
                $yearNumber.text(splitYear[i]);
                j++;
            }

            //push to array which will later be used to determine scroll destination
            $yearNumberColumns.push($numberColumn);
        }
    }

    function initStyles() {
        if (!isMobile) {
            _this.initClass(YearTextCSS, $this);
        } else {
            _this.initClass(YearTextMobileCSS, $this);
        }
    }

    //*** Event handlers

    //*** Public methods
    this.animateNumbers = function () {
        $yearNumberColumns.forEach((column, i) => {
            if (column.applyLerp) {
                // _currentNumberPhases[i] = Math.lerp(_targetNumberPhases[i], _currentNumberPhases[i], _lerpSpeed);
                _currentNumberPhases[i] = Math.lerp(_targetNumberPhases[i], _currentNumberPhases[i], _lerpSpeed + (column.stagger * 0.125));
                // column.transform({ y: `-${_currentNumberPhases[i]}%` });
                column.y = `-${_currentNumberPhases[i]}%`;
                column.transform();

                //use velocity to determine opacity;
                let vel = Math.min(1.0, Math.abs(_currentNumberPhases[i] - _prevNumberPhases[i])) * Math.lerp(0.5, 0.3, 1.0 - column.stagger);
                _alphas[i] -= vel;
                _alphas[i] = Math.max(0.0, _alphas[i]);
                // column.css({ opacity: _alphas[i] });
                _alphas[i] += Math.lerp(0.125, 0.1, 1.0 - column.stagger);
                _alphas[i] = Math.min(1.0, _alphas[i]);
            } else {
                _currentNumberPhases[i] = _targetNumberPhases[i];
                _alphas[i] = 1.0;
                // column.transform({ y: `-${_currentNumberPhases[i]}%` });
                column.y = `-${_currentNumberPhases[i]}%`;
                column.transform();
                column.css({ opacity: 1 });
            }

            _prevNumberPhases[i] = _currentNumberPhases[i];
        });
    };

    this.updateYear = function({ year, setImmediate = false }) {
        if (_years.length === 0) return;

        //find index of new year. exit loop when index found;
        for (let i = 0; i < _years.length; i++) {
            let currentYear = _years[i];
            if (currentYear === year) {
                _desiredYearIndex = i;
                break;
            }
        }

        //split the desired year and use it to determine which numbers to lerp and which to teleport
        let desiredYearString = _years[_desiredYearIndex].toString().split('');

        //split previousYear
        let prevYearString = _previousYear.toString().split('');

        //iterate through each column
        $yearNumberColumns.forEach((column, i) => {
            //fetch digit in current year
            let prevYearDigit = parseInt(prevYearString[i]);
            let desiredYearDigit = parseInt(desiredYearString[i]);

            //tell column to not lerp if numbers match
            if ((prevYearDigit - desiredYearDigit) === 0) {
                column.applyLerp = false;
            } else {
                column.applyLerp = true;
            }
            _targetNumberPhases[i] = (_desiredYearIndex / _years.length) * 100.0;

            //translate immediatly if desired
            if (setImmediate) column.css({ transform: `translateY(-${_targetNumberPhases[i]}%)` });
        });

        _previousYear = year;
    };

    this.show = function() {
        $container.transform({ y: $container.div.getBoundingClientRect().height });
        $container.tween({ opacity: 1.0, y: 0 }, 500.0, 'easeOutCubic', 150);
    };

    this.hide = function () {
        _enabled = false;
        $container.tween({ opacity: 0.0 }, 500, 'easeOutExpo');
    };
});
