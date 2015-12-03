require(['bufferPair',
         'text!shaders/identity.vert',
         'text!shaders/calculate_flow.frag',
         'text!shaders/apply_flow.frag',
         'text!shaders/render_water.frag'],
        function(BufferPair, vertSource, calculateFlowSource, applyFlowSource, renderWaterSource) {
    
    // Hard upper limit on the update rate, in Hz
    var RATE_CAP = 30;

    var canvas = document.getElementById("main-canvas");
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    var gl = initGl(canvas);

    var programs = initShaders();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var vertices = new Float32Array([
        1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        -1.0, -1.0]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindAttribLocation(programs.renderWater, 0, 'a_Position');
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    var query_params = parseQueryString();

    var initImageName = query_params.seed == undefined ? "init.png" : "init_" + query_params.seed + ".png";
    // The number of physics iterations to process per frame
    var ITERATIONS_PER_FRAME = parseInt(query_params.iterations || "1");

    var fluidBuffer;
    var initialWater = loadImage("seeds/" + initImageName, function() {
        fluidBuffer = new BufferPair(gl, initialWater);
        flowBuffer = new BufferPair(gl, fluidBuffer.width, fluidBuffer.height);

        render();
    });

    var lastFrame;
    function render(timestamp) {
        requestAnimationFrame(render);
        
        if (lastFrame == undefined || timestamp - lastFrame >= (1000/RATE_CAP)) {
            lastFrame = timestamp;
            for (var i=0; i<ITERATIONS_PER_FRAME; i++) {
                calculateFlow();
                applyFlow();
            }
            renderFluid();
        }
    }

    function calculateFlow() {
        gl.useProgram(programs.calculateFlow);

        gl.uniform1i(programs.calculateFlow.FLUID_BUFFER, 0);
        fluidBuffer.bindRead(0, programs.calculateFlow.RESOLUTION);

        flowBuffer.bindWrite();
        flowBuffer.flip();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function applyFlow() {
        gl.useProgram(programs.applyFlow);

        gl.uniform1i(programs.applyFlow.FLOW_BUFFER, 0);
        flowBuffer.bindRead(0, programs.applyFlow.RESOLUTION);

        gl.uniform1i(programs.applyFlow.FLUID_BUFFER, 1);
        fluidBuffer.bindRead(1);

        fluidBuffer.bindWrite();
        fluidBuffer.flip();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    function renderFluid() {
        gl.useProgram(programs.renderWater);

        gl.uniform2fv(programs.renderWater.RESOLUTION, [canvas.width, canvas.height]);

        gl.uniform1i(programs.renderWater.FLUID_BUFFER, 0);
        fluidBuffer.bindRead(0, programs.renderWater.FLUID_RESOLUTION);

        resetFramebuffer();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function initGl(canvas) {
        try {
            return canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        } catch(e) {
            alert("Unable to initialize WebGL. See console for details.");
            throw e;
        }
    }

    function initShaders() {
        // Compile shaders
        var vShader = compileShader(vertSource, gl.VERTEX_SHADER);
        var applyFlowShader = compileShader(applyFlowSource, gl.FRAGMENT_SHADER);
        var calculateFlowShader = compileShader(calculateFlowSource, gl.FRAGMENT_SHADER);
        var renderWaterShader = compileShader(renderWaterSource, gl.FRAGMENT_SHADER);
        
        // Link programs
        var programs = {
            applyFlow:     linkProgram(vShader, applyFlowShader),
            calculateFlow: linkProgram(vShader, calculateFlowShader),
            renderWater:   linkProgram(vShader, renderWaterShader)
        };

        // Clean up shader objects
        gl.deleteShader(vShader);
        gl.deleteShader(applyFlowShader);
        gl.deleteShader(calculateFlowShader);
        gl.deleteShader(renderWaterShader);

        initLocations(programs);
        return programs;
    }

    function initLocations(programs) {
        initLocation(programs.calculateFlow, "RESOLUTION");
        initLocation(programs.calculateFlow, "FLUID_BUFFER");

        initLocation(programs.applyFlow, "RESOLUTION");
        initLocation(programs.applyFlow, "FLOW_BUFFER");
        initLocation(programs.applyFlow, "FLUID_BUFFER");

        initLocation(programs.renderWater, "RESOLUTION");
        initLocation(programs.renderWater, "FLUID_RESOLUTION");
        initLocation(programs.renderWater, "FLUID_BUFFER");
    }

    function initLocation(program, name) {
        program[name] = gl.getUniformLocation(program, name);
    }

    function linkProgram(vertex, fragment) {
        var program = gl.createProgram();

        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            var reason = gl.getProgramInfoLog(program);

            gl.detachShader(program, vertex);
            gl.detachShader(program, fragment);
            gl.deleteProgram(program);
            throw "Failed to link program:\n" + reason;
        }

        return program;
    }
    
    function compileShader(source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var reason = gl.getShaderInfoLog(shader);

            gl.deleteShader(shader);
            throw "Failed to compile shader:\n" + reason;
        }
        return shader;
    }

    function resetFramebuffer() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function loadImage(url, callback) {
        var img = new Image();
        img.src = url;
        img.onload = callback;
        return img;
    }

    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function parseQueryString() {
        var query_params = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            query_params[pair[0]] = decodeURIComponent(pair[1]);
        }
        return query_params;
    }
});
