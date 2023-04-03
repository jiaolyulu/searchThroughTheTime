#!ATTRIBUTES

#!UNIFORMS
uniform vec3 uColor;
uniform float uOpacity;
uniform float uScale;

#!VARYINGS
varying vec2 vUv;

#!SHADER: Vertex
void main() {
  vec3 pos = position;

  // pos += 0.5;
  pos *= uScale;
  // pos -= 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vUv = uv;
}

#!SHADER: Fragment
#require(aastep.glsl)

void main() {
  if (uScale < 0.001) {
    discard;
    return;
  }

  float circle = aastep(0.5, length(vUv - vec2(0.5)));
  float alpha = 1.0 - circle;
  alpha *= uOpacity;

  gl_FragColor = vec4(uColor, alpha);
}
