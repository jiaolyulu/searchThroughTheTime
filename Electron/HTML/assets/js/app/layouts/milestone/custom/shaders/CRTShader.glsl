#!ATTRIBUTES


#!UNIFORMS
uniform sampler2D tMap;
uniform float uAlpha;
uniform float uAppear;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  vec3 pos = position;
  pos *= uAppear;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
#require(simplenoise.glsl)

vec2 pinch(vec2 uv, float strength) {
    vec2 st = uv - 0.5;
    float theta = atan(st.x, st.y);
    float r = sqrt(dot(st, st));
    r *= 1.0 + strength * (r * r);

    return 0.5 + r * vec2(sin(theta), cos(theta));
}

float scanLine(float v) {
  float s = sin(v * 6.0 * 3.14 * 2.0);
  return s;
}

float vignette(vec2 uv) {
    uv *=  1.0 - uv.yx;
    float vig = uv.x*uv.y * 15.0;
    return pow(vig, 0.07);
}

void main() {
  float alpha = uAlpha;
  // alpha *= uAppear;

  if (alpha <= 0.001) {
    discard;
    return;
  }

  vec2 uv = pinch(vUv, 0.25);
  vec3 color = texture2D(tMap, uv).rgb;

  color += (getNoise(uv, time) * 0.1);

  // color *= 1.0 - (scanLine(uv.x + time * 0.04) * 0.03);
  color += (scanLine(uv.y + time * 0.04) * 0.03);

  color = mix(vec3(0.0), color, vignette(vUv));

  gl_FragColor = vec4(color, alpha);
}