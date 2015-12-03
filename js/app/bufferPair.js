/*
 * A class for managing ping-pong style 2-texture buffers for
 * providing the result of each render to the shader for the next render
 */
define(function() {
    function BufferPair(gl, imgOrWidth, height) {
        this.gl = gl;

        if (arguments.length == 2) {
            this.initImg = imgOrWidth;
            this.width = imgOrWidth.width;
            this.height = imgOrWidth.height;
        } else if (arguments.length == 3) {
            this.initImg = null;
            this.width = imgOrWidth;
            this.height = height;
        }
        this.flipped = false;


        this.textureA = initializeTexture(gl);      
        if (this.initImg == null) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.initImg);
        }
        this.bufferA = initializeFramebuffer(gl, this.textureA);

        this.textureB = initializeTexture(gl, this.width, height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.bufferB = initializeFramebuffer(gl, this.textureB);
    }

    BufferPair.prototype = {
        bindRead: function(textureId, resolutionLoc) {
            if (textureId == undefined) {textureId = 0;}

            this.gl.activeTexture(this.gl.TEXTURE0 + textureId);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.flipped ? this.textureB : this.textureA);
            
            if (resolutionLoc != undefined) {
                this.gl.uniform2fv(resolutionLoc, [this.width, this.height]);
            }
        },

        bindWrite: function() {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.flipped ? this.bufferA : this.bufferB);
            this.gl.viewport(0, 0, this.width, this.height);
        },

        flip: function() {
            this.flipped = !this.flipped;
        }
    };


    function initializeTexture(gl) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        return texture;
    }

    function initializeFramebuffer(gl, texture) {
        var buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return buffer;
    }

    return BufferPair;
});
