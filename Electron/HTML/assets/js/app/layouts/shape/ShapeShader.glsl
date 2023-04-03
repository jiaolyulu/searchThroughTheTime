#!ATTRIBUTES

#!UNIFORMS
uniform sampler2D tMap;
uniform vec3 uColor;
uniform vec2 uNoiseScale;
uniform float uLevel;
uniform float uProgress;
uniform float uShow;
uniform float uMouseFluid;
// uniform vec4 uWiggle;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
#require(simplenoise.glsl)
#require(mousefluid.fs)
#require(glscreenprojection.glsl)

void main() {
  vec3 pos = position;
  vec4 wPos = modelViewMatrix * vec4(pos, 1.0);

  #test Tests.useMouseFluid()
    vec3 fluid = vec3(0.0);
    vec2 screenUV = getProjection(wPos.xyz, projectionMatrix);
    vec3 flow = vec3(texture2D(tFluid, screenUV).xy, 0.0);
    fluid = flow * 0.001 * uMouseFluid * texture2D(tFluidMask, screenUV).r;
  #endtest


  gl_Position = projectionMatrix * wPos;

  #test Tests.useMouseFluid()
    gl_Position.xyz += fluid;
  #endtest

  // #test Tests.wireWiggle()
  //   vec3 seed = pos.xyz * uWiggle.x;
  //   // seed += uv.x * uWiggle.y;
  //   seed += time * uWiggle.z;

  //   float noise = cnoise(seed) * uWiggle.w;
  //   gl_Position.xy += noise;
  // #endtest

  vUv = uv;
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
  vec4 color = texture2D(tMap, vUv);
  color.rgb = uColor;


  if (uProgress > 0.0 && uProgress < 0.99) { 
    float n = (fbm(vUv * uNoiseScale) + 1.0) / 2.0;
    float level = uProgress * uLevel;
    color.a = mix(0.0, color.a, animateLevels(n, level));
  }

  color.a *= uShow;

  gl_FragColor = color;
}