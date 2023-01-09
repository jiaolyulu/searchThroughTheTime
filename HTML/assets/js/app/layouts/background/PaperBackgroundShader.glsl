#!ATTRIBUTES

#!UNIFORMS
uniform sampler2D tTex;
uniform float uRepeat;
uniform float uSize;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
    vUv = uv * (uRepeat * uSize);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

#!SHADER: Fragment
#require(range.glsl)
#require(levelmask.glsl)
#require(simplenoise.glsl)

float fbm(vec2 v) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;

    // Loop of octaves
    for (int i = 0; i < 2; i++) {
        value += amplitude * cnoise(v);
        v *= 2.;
        amplitude *= .5;
    }

    return value;
}

void main() {
    vec3 color = texture2D(tTex, vUv).rgb;

    if (uAppear < 0.99) { 
        vec2 screenUV = gl_FragCoord.xy / resolution.xy;
        float noiseScale = 1.2;
        float levelValue = 1.4;
        float app = uAppear;

        float n = (fbm(screenUV * noiseScale) + 1.0) / 2.0;
        float level = app * levelValue;
        color = mix(vec3(1.0), color, animateLevels(n, level));
    }

    gl_FragColor = vec4(color, 1.0);
}