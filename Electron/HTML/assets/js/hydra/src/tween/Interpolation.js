/**
 * @name Interpolation
 */

TweenManager.Class(function Interpolation() {
    
    function calculateBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
    }
    
    function getTForX(aX, mX1, mX2) {
        var aGuessT = aX;
        for (var i = 0; i < 4; i++) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope == 0.0) return aGuessT;
            var currentX = calculateBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }
    
    function getSlope(aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }
    
    function A(aA1, aA2) { 
        return 1.0 - 3.0 * aA2 + 3.0 * aA1; 
    }
    
    function B(aA1, aA2) { 
        return 3.0 * aA2 - 6.0 * aA1; 
    }
    
    function C(aA1) { 
        return 3.0 * aA1; 
    }

    /**
     * Converts easing string to relative function.
     * @name TweenManager.Interpolation.convertEase
     * @memberof Interpolation
     *
     * @function
     * @param {String} ease
     * @example
     * const ease = TweenManager.Interpolation.convertEase('easeOutCubic');
     * console.log(ease(0.7)); // logs 0.973
     */
    this.convertEase = function(ease) {
        var fn = (function() {
            switch (ease) {
                case 'easeInQuad': return TweenManager.Interpolation.Quad.In; break;
                case 'easeInCubic': return TweenManager.Interpolation.Cubic.In; break;
                case 'easeInQuart': return TweenManager.Interpolation.Quart.In; break;
                case 'easeInQuint': return TweenManager.Interpolation.Quint.In; break;
                case 'easeInSine': return TweenManager.Interpolation.Sine.In; break;
                case 'easeInExpo': return TweenManager.Interpolation.Expo.In; break;
                case 'easeInCirc': return TweenManager.Interpolation.Circ.In; break;
                case 'easeInElastic': return TweenManager.Interpolation.Elastic.In; break;
                case 'easeInBack': return TweenManager.Interpolation.Back.In; break;
                case 'easeInBounce': return TweenManager.Interpolation.Bounce.In; break;
                
                case 'easeOutQuad': return TweenManager.Interpolation.Quad.Out; break;
                case 'easeOutCubic': return TweenManager.Interpolation.Cubic.Out; break;
                case 'easeOutQuart': return TweenManager.Interpolation.Quart.Out; break;
                case 'easeOutQuint': return TweenManager.Interpolation.Quint.Out; break;
                case 'easeOutSine': return TweenManager.Interpolation.Sine.Out; break;
                case 'easeOutExpo': return TweenManager.Interpolation.Expo.Out; break;
                case 'easeOutCirc': return TweenManager.Interpolation.Circ.Out; break;
                case 'easeOutElastic': return TweenManager.Interpolation.Elastic.Out; break;
                case 'easeOutBack': return TweenManager.Interpolation.Back.Out; break;
                case 'easeOutBounce': return TweenManager.Interpolation.Bounce.Out; break;
                
                case 'easeInOutQuad': return TweenManager.Interpolation.Quad.InOut; break;
                case 'easeInOutCubic': return TweenManager.Interpolation.Cubic.InOut; break;
                case 'easeInOutQuart': return TweenManager.Interpolation.Quart.InOut; break;
                case 'easeInOutQuint': return TweenManager.Interpolation.Quint.InOut; break;
                case 'easeInOutSine': return TweenManager.Interpolation.Sine.InOut; break;
                case 'easeInOutExpo': return TweenManager.Interpolation.Expo.InOut; break;
                case 'easeInOutCirc': return TweenManager.Interpolation.Circ.InOut; break;
                case 'easeInOutElastic': return TweenManager.Interpolation.Elastic.InOut; break;
                case 'easeInOutBack': return TweenManager.Interpolation.Back.InOut; break;
                case 'easeInOutBounce': return TweenManager.Interpolation.Bounce.InOut; break;
                            
                case 'linear': return TweenManager.Interpolation.Linear.None; break;
            }
        })();
        
        if (!fn) {
            var curve = TweenManager._getEase(ease, true);
            if (curve) fn = curve;
            else fn = TweenManager.Interpolation.Cubic.Out;
        }
        
        return fn;
    };

    /**
     * @name TweenManager.Interpolation.solve
     * @memberof Interpolation
     *
     * @function
     * @param {Number[]} values
     * @param {Number} elapsed
     * @returns {Number}
     */
    this.solve = function(values, elapsed) {
        if (values[0] == values[1] && values[2] == values[3]) return elapsed;
        return calculateBezier(getTForX(elapsed, values[0], values[2]), values[1], values[3]);
    };

    this.Linear = {
        None: function(k) {
            return k;
        }
    };
    this.Quad = {
        In: function(k) {
            return k*k;
        },
        Out: function(k) {
            return k * (2 - k);
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return - 0.5 * (--k * (k - 2) - 1);
        }
    };
    this.Cubic = {
        In: function(k) {
            return k * k * k;
        },
        Out: function(k) {
            return --k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k;
            return 0.5 * ((k -= 2) * k * k + 2 );
        }
    };
    this.Quart = {
        In: function(k) {
            return k * k * k * k;
        },
        Out: function(k) {
            return 1 - --k * k * k * k;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return - 0.5 * ((k -= 2) * k * k * k - 2);
        }
    };
    this.Quint = {
        In: function(k) {
            return k * k * k * k * k;
        },
        Out: function(k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    };
    this.Sine = {
        In: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function(k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    };
    this.Expo = {
        In: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function(k) {
            if (k === 0) return 0;
            if (k === 1) return 1;
            if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
            return 0.5 * (-Math.pow(2, - 10 * (k - 1)) + 2);
        }
    };
    this.Circ = {
        In: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function(k) {
            return Math.sqrt(1 - --k * k);
        },
        InOut: function(k) {
            if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
            return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
        }
    };
    this.Elastic = {
        In: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        },
        Out: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
        },
        InOut: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
            return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
        }
    };
    this.Back = {
        In: function(k) {
            var s = 1.70158;
            return k * k * ( ( s + 1 ) * k - s );
        },
        Out: function(k) {
            var s = 1.70158;
            return --k * k * ( ( s + 1 ) * k + s ) + 1;
        },
        InOut: function(k) {
            var s = 1.70158 * 1.525;
            if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
            return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
        }
    };
    this.Bounce = {
        In: function(k) {
            return 1 - this.Bounce.Out( 1 - k );
        },
        Out: function(k) {
            if ( k < ( 1 / 2.75 ) ) {
                return 7.5625 * k * k;
            } else if ( k < ( 2 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
            } else if ( k < ( 2.5 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
            } else {
                return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
            }
        },
        InOut: function(k) {
            if ( k < 0.5 ) return this.Bounce.In( k * 2 ) * 0.5;
            return this.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;
        }
    };
}, 'Static');