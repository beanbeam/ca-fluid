precision mediump float;

uniform vec2 RESOLUTION;
uniform sampler2D FLOW_BUFFER;
uniform sampler2D FLUID_BUFFER;

// Flow stored as outgoing values in 4 channels:
//  R - Down
//  G - Left
//  B - Right
//  A - Up

vec4 flow_ref(float xdiff, float ydiff);

void main() {
    vec2 pos = gl_FragCoord.xy;

    float newValue = texture2D(FLUID_BUFFER, pos/RESOLUTION).b;

    vec4 outFlow = flow_ref(0.0, 0.0);
    newValue -= outFlow.r + outFlow.g + outFlow.b + outFlow.a;

    newValue += flow_ref( 0.0, -1.0).r;
    newValue += flow_ref( 1.0,  0.0).g;
    newValue += flow_ref(-1.0,  0.0).b;
    newValue += flow_ref( 0.0,  1.0).a;

    /*if (newValue > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }*/

    gl_FragColor = vec4(newValue, newValue, newValue, 1.0);
}

vec4 flow_ref(float xdiff, float ydiff) {
    vec2 refPos = (gl_FragCoord.xy + vec2(xdiff, ydiff))/RESOLUTION;

    if (refPos.x < 0.0 || refPos.x >= 1.0
            || refPos.y < 0.0 || refPos.y >= 1.0) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }

    return texture2D(FLOW_BUFFER, refPos);
}
