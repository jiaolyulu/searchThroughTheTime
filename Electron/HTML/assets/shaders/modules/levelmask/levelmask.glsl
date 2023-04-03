float levelChannel(float inPixel, float inBlack, float inGamma, float inWhite, float outBlack, float outWhite) {
    return (pow(((inPixel * 255.0) - inBlack) / (inWhite - inBlack), inGamma) * (outWhite - outBlack) + outBlack) / 255.0;
}

vec3 levels(vec3 inPixel, float inBlack, float inGamma, float inWhite, float outBlack, float outWhite) {
    vec3 o = vec3(1.0);
    o.r = levelChannel(inPixel.r, inBlack, inGamma, inWhite, outBlack, outWhite);
    o.g = levelChannel(inPixel.g, inBlack, inGamma, inWhite, outBlack, outWhite);
    o.b = levelChannel(inPixel.b, inBlack, inGamma, inWhite, outBlack, outWhite);
    return o;
}

float animateLevels(float inp, float t) {
    float inBlack = 0.0;
    float inGamma = range(t, 0.0, 1.0, 0.0, 3.0);
    float inWhite = range(t, 0.0, 1.0, 20.0, 255.0);
    float outBlack = 0.0;
    float outWhite = 255.0;

    float mask = 1.0 - levels(vec3(inp), inBlack, inGamma, inWhite, outBlack, outWhite).r;
    mask = max(0.0, min(1.0, mask));
    return mask;
}