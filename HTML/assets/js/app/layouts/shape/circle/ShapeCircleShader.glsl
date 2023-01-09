#!ATTRIBUTES

#!UNIFORMS
uniform vec3 uColor;
uniform float uAlpha;
uniform float uProgress;
uniform float uShow;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
#require(aastep.glsl)

void main() {
  float radius = mix(0.2, 0.5, uProgress);
  float circle = aastep(radius, length(vUv - vec2(0.5)));

  vec3 color = uColor;
  float alpha = uAlpha;

  alpha *= 1.0 - circle;
  alpha *= uProgress;
  alpha *= uShow;

  gl_FragColor = vec4(color, alpha);
}
