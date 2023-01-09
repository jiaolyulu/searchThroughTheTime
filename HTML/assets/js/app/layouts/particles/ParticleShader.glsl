#!ATTRIBUTES
attribute vec4 random;

#!UNIFORMS
uniform sampler2D tPos;
uniform sampler2D tMap;
uniform float DPR;
uniform float uAlpha;

#!VARYINGS
varying vec4 vRandom;

#!SHADER: Vertex
void main() {
    vec3 pos = texture2D(tPos, position.xy).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // float size = 0.02;
    float size = 0.04;

    gl_PointSize = size * DPR * (1000.0 / length(mvPosition.xyz));
    gl_Position = projectionMatrix * mvPosition;

    vRandom = random;
}

#!SHADER: Fragment

void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);

    float randomSprite = vRandom.y;
    float spriteCount = 8.0;
    float spriteWidth = 1.0 / spriteCount;
    uv.x *= spriteWidth;
    uv.x += spriteWidth * floor(randomSprite * spriteCount);

    vec3 color = texture2D(tMap, uv).rgb;

    if (color.r < 0.5) discard;

    color = vec3(0.8);

    float alpha = uAlpha * 0.4;

    gl_FragColor = vec4(color, alpha);
}