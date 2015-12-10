precision mediump float;

uniform vec2 RESOLUTION;
uniform sampler2D FLUID_BUFFER;

float BASE_PRESSURE_CAP = 0.5;
float MAX_COMPRESS = 0.01;

float last_state(float xoff, float yoff) {
    return texture2D(FLUID_BUFFER, (gl_FragCoord.xy + vec2(xoff, yoff))/RESOLUTION).b;
}

void main() {
    float remaining = last_state(0.0, 0.0);
    vec2 pos = gl_FragCoord.xy;

    float oDown = 0.0;
    if (pos.y < RESOLUTION.x - 1.0) {
        float pressureCap = BASE_PRESSURE_CAP
            + MAX_COMPRESS*last_state(0.0, 0.0)/BASE_PRESSURE_CAP;
        oDown = min(max(pressureCap - last_state(0.0, 1.0), 0.0), remaining);
        remaining -= oDown;
    }

    float oLeft = 0.0;
    float oRight = 0.0;
    
    if (mod(pos.y, 2.0) < 1.0) {
        if (pos.x > 0.0) {
            oLeft = min(max((remaining-last_state(-1.0, 0.0))/2.0,0.0), remaining);
            remaining -= oLeft;
        }

        if (pos.x < RESOLUTION.x - 1.0) {
            oRight = min(max((remaining-last_state(1.0, 0.0))/2.0, 0.0), remaining);
            remaining -= oRight;
        }
    } else {
        if (pos.x < RESOLUTION.x - 1.0) {
            oRight = min(max((remaining-last_state(1.0, 0.0))/2.0, 0.0), remaining);
            remaining -= oRight;
        }
        
        if (pos.x > 0.0) {
            oLeft = min(max((remaining-last_state(-1.0, 0.0))/2.0,0.0), remaining);
            remaining -= oLeft;
        }
    }

    float oUp = 0.0;
    if (pos.y > 0.0) {
        float pressureCap = BASE_PRESSURE_CAP
            + MAX_COMPRESS*last_state(0.0, -1.0)/BASE_PRESSURE_CAP;
        oUp = min(max(remaining-pressureCap, 0.0), remaining);
    }

    gl_FragColor = vec4(oDown, oLeft, oRight, oUp);
}

