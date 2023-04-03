Module(function MacOSPerformanceTest() {
    function test() {
        let results = [];
        function getPrime() {
            return largest_prime_factor(1000000000000);
        }
        function factors(n) {
            var i;
            var out = [];
            var sqrt_n = Math.sqrt(n);
            for (i = 2; i <= sqrt_n; i++) {
                if (n % i === 0) {
                    out.push(i);
                }
            }
            return out;
        }
        function primep(n) {
            return factors(n).length === 0;
        }
        function largest_prime_factor(n) {
            return factors(n).filter(primep).pop();
        }

        for (let i = 0; i < 3; i++) {
            let time = performance.now();
            getPrime();
            results.push((performance.now() - time) * 10);
        }

        results.sort((a, b) => a - b);
        return results[0];
    }

    this.exports = function() {
        let result = test();

        if (screen.width <= 1440 && screen.height <= 900) {
            //probably a 13" laptop
            if (result > 540) {
                Device.graphics.webgl.gpu = 'intel iris opengl engine';
            } else {
                Device.graphics.webgl.gpu = 'safari tier 1';
            }
        } else {
            //probably a mbp
            if (result > 475) {
                if (result > 540) {
                    Device.graphics.webgl.gpu = 'intel iris opengl engine';
                } else {
                    Device.graphics.webgl.gpu = 'safari tier 1';
                }
            } else {
                if (result < 375) {
                    Device.graphics.webgl.gpu = 'amd radeon pro 455 opengl engine';
                } else {
                    Device.graphics.webgl.gpu = 'nvidia geforce 750m opengl engine';
                }
            }
        }
    }
});