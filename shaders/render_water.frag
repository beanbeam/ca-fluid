precision mediump float;

uniform vec2 RESOLUTION;

uniform vec2 FLUID_RESOLUTION;
uniform sampler2D FLUID_BUFFER;

float water_level(vec2 pos);

void main() {
    vec2 pos = gl_FragCoord.xy;

    // Flip y coordinate so origin is in top left
    pos.y = RESOLUTION.y - pos.y;

    vec2 ratioPos = pos/RESOLUTION;
   
    float level = water_level(pos);

    if (level == -1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else if (level == -2.0) {
        gl_FragColor = vec4(0.1, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(1.0-level, 1.0-level, 1.0, 1.0);
    }
}

float water_level(vec2 pos) {
    vec2 scaleXY = RESOLUTION/FLUID_RESOLUTION;

    float scale = min(scaleXY.x, scaleXY.y);

    vec2 imgDim = FLUID_RESOLUTION*scale;
    vec2 padding = RESOLUTION - imgDim;

    vec2 adjustedPos = pos - padding*0.5;

    if (adjustedPos.x >= 0.0 && adjustedPos.x < imgDim.x
     && adjustedPos.y >= 0.0 && adjustedPos.y < imgDim.y) {
        vec4 color = texture2D(FLUID_BUFFER, adjustedPos/imgDim);

        if (color.a == 0.0) {
            return -2.0;
        } else {
            return color.b;
        }
    } else {
        return -1.0;
    }
}
