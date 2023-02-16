#!ATTRIBUTES
attribute vec4 random;
attribute vec3 color;

#!UNIFORMS
uniform sampler2D tPos;
uniform sampler2D tOrigin;
uniform float DPR;
uniform float uAlpha;

#!VARYINGS
varying vec4 vRandom;
varying vec3 vColor;
varying float vRadius;

#!SHADER: Vertex

void main() {
    vec3 pos = texture2D(tPos, position.xy).xyz;
    vec3 origin = texture2D(tOrigin, position.xy).xyz;
    float blur = 0.0;

    float size = 0.04; //lulu's deeplocal change

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * DPR * (1000.0 / length(mvPosition.xyz)); 
    gl_Position = projectionMatrix * mvPosition;

    vRandom = random;
    vColor = color;

    origin.y *= 1.8;
    vRadius = length(origin.xy);
}

#!SHADER: Fragment
#require(aastep.glsl)

void main() {
    if (vRadius < 1.45) {
        discard;
        return;
    }

    vec2 uv = gl_PointCoord.xy;

    vec3 color = vColor;
    float circle = aastep(0.5, length(uv - vec2(0.5)));
    float alpha = 1.0 - circle;
    alpha *= uAlpha;

    if (alpha < 0.01) {
        discard;
        return;
    }

    gl_FragColor = vec4(color, alpha);
}