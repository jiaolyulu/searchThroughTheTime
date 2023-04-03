class GLUIShapeHoles {
    constructor() {
        this.commands = [];
    }

    beginPath() {
        this.commands.length = 0;
    }

    moveTo(x, y) {
        this.commands.push(['moveTo', x, -y]);
    }

    lineTo(x, y) {
        this.commands.push(['lineTo', x, -y]);
    }

    quadraticCurveTo(aCPx, aCPy, aX, aY) {
        this.commands.push(['quadraticCurveTo', aCPx, -aCPy, aX, -aY]);
    }

    bezierCurveTo(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY) {
        this.commands.push(['bezierCurveTo', aCP1x, -aCP1y, aCP2x, -aCP2y, aX, -aY]);
    }

    arc(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
        this.commands.push(['arc', aX, -aY, aRadius, aStartAngle, aEndAngle, aClockwise]);
    }

    endPath() {
        this.commands.push(['endPath']);
    }
}