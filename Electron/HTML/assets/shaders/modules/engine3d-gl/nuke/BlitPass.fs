void main() {
    gl_FragColor = texture2D(tDiffuse, vUv);
    gl_FragColor.a = 1.0;
}