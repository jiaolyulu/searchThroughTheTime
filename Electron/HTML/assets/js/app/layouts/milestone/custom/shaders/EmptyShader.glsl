#!ATTRIBUTES

#!UNIFORMS

#!VARYINGS
#!SHADER: Vertex
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

#!SHADER: Fragment
void main() {
  discard;
  return;

  gl_FragColor = vec4(0.0);
}