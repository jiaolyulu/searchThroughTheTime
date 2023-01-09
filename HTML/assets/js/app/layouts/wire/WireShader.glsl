#!ATTRIBUTES
attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float width;
// attribute vec2 uv2;

#!UNIFORMS
uniform vec4 uWiggle;
uniform vec3 uColor;
uniform vec2 uTip;
uniform float uThickness;
uniform float uDrawing;
uniform float uErasing;
uniform float uExtraDrawing;
uniform float uMouseFluid;
uniform float uIntro;
uniform float uOpacity;
uniform float uEnd;

#!VARYINGS
varying vec2 vUv;
// varying vec2 vUv2;
// varying float vWidth;
// varying float vDist;

#!SHADER: Vertex
#require(range.glsl)
#require(simplenoise.glsl)
#require(mousefluid.fs)
#require(glscreenprojection.glsl)

vec2 fix(vec4 i, float aspect) {
    vec2 res = i.xy / i.w;
    res.x *= aspect;
    return res;
}

const float startWiggleFluid = 0.05;

void main() {
    float drawing = uDrawing + uExtraDrawing;
    float aspect = resolution.x / resolution.y;

    vec3 pos = position;
    vec3 prevPos = previous;
    vec3 nextPos = next;
    float lineWidth = 1.0;
    float thickness = uThickness;

    // Tip is thinner
    if (uEnd < 0.5) {
        lineWidth *= crange(drawing - uv.x, uTip.x * 0.0009, 0.0, 1.0, uTip.y);
    }

    vec4 wPos = modelViewMatrix * vec4(pos, 1.0);
    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 finalPosition = m * vec4(pos, 1.0);
    vec4 pPos = m * vec4(prevPos, 1.0);
    vec4 nPos = m * vec4(nextPos, 1.0);

    float wiggleFluidForce = crange(uv.x, startWiggleFluid, startWiggleFluid + 0.02, 0.0, 1.0);

    if (uIntro < 0.5 && uEnd < 0.5) {
        // boost
        float boost = sin(time * 3.0 - uv.x * 800.0);
        boost = boost * 0.5 + 0.5;
        boost *= wiggleFluidForce;
        lineWidth += boost * 0.4;
    }

    vec3 fluid = vec3(0.0);
    #test Tests.useMouseFluid()
        if (uIntro < 0.5 && uEnd < 0.5) {
            vec2 screenUV = getProjection(wPos.xyz, projectionMatrix);
            vec3 flow = vec3(texture2D(tFluid, screenUV).xy, 0.0);
            fluid = flow * 0.001 * uMouseFluid * texture2D(tFluidMask, screenUV).r;
        }
    #endtest

    fluid *= wiggleFluidForce;
    lineWidth += length(fluid.xy) * 1.3;

    vec2 currentP = fix(finalPosition, aspect);
    vec2 prevP = fix(pPos, aspect);
    vec2 nextP = fix(nPos, aspect);

    float w = 0.005 * thickness * width * lineWidth;

    // vec2 dirNC = normalize(currentP - prevP);
    // vec2 dirPC = normalize(nextP - currentP);

    // vec2 dir1 = normalize(currentP - prevP);
    // vec2 dir2 = normalize(nextP - currentP);
    // vec2 dirF = normalize(dir1 + dir2);

    // vec2 dirM = mix(dirPC, dirNC, when_eq(nextP, currentP));
    // vec2 dir = mix(dirF, dirM, clamp(when_eq(nextP, currentP) + when_eq(prevP, currentP), 0.0, 1.0));
    vec2 dirNC = currentP - prevP;
    vec2 dirPC = nextP - currentP;
    if (length(dirNC) >= 0.0001) dirNC = normalize(dirNC);
    if (length(dirPC) >= 0.0001) dirPC = normalize(dirPC);
    vec2 dir = normalize(dirNC + dirPC);

    vec2 normal = vec2(-dir.y, dir.x);
    normal.x /= aspect;
    normal *= 0.5 * w;

    finalPosition.xy += normal * side;

    finalPosition.xy += fluid.xy;

    #test Tests.wireWiggle()
        if (uIntro < 0.5 && uEnd < 0.5) {
            vec3 seed = pos.xyz * uWiggle.x;
            seed += uv.x * uWiggle.y;
            seed += time * uWiggle.z;

            float noise = cnoise(seed) * uWiggle.w;
            // finalPosition.xyz += noise * wiggleFluidForce;
            finalPosition.xy += noise * wiggleFluidForce;
        }
    #endtest

    gl_Position = finalPosition;

    vUv = uv;
    // vUv2 = uv2;
    // vWidth = w;
    // vDist = finalPosition.z / 10.0;
}

#!SHADER: Fragment
#require(range.glsl)
#require(aastep.glsl)

float tri(float v) {
    return mix(v, 1.0 - v, step(0.5, v)) * 2.0;
}

void main() {
    float drawing = uDrawing + uExtraDrawing;
    float signedDist = tri(vUv.y) - 0.5;
    float w = clamp(signedDist/fwidth(signedDist) + 0.5, 0.0, 1.0);

    if (w <= 0.3) {
        discard;
        return;
    }

    vec4 color = vec4(uColor, w);
    float draw = 1.0 - step(drawing, vUv.x);
    draw *= step(uErasing, vUv.x);

    if (draw < 0.5) {
        discard;
    }

    if (uOpacity < 1.0) {
        // Fade out line using uv
        float drawingUV = crange(vUv.x, drawing - 0.1, uDrawing, 0.0, 1.0);
        color.a = rangeTransition(uOpacity, drawingUV, 0.4);
    }

    if(color.a <= 0.0) {
        discard;
    }

    gl_FragColor = color;
    // gl_FragColor.a = 0.3;
}
