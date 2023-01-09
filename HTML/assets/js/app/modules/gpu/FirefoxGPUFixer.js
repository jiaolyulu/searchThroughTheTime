Module(function FirefoxGPUFixer() {
    this.exports = function() {
        if (GPU.detect('radeon r9 200')) {
            if (Device.system.os == 'mac' || Device.pixelRatio > 1) {
                Device.graphics.webgl.gpu = 'radeon pro 455';
            }
        }
    }
});
