"use strict";

///////////
// by me //
///////////

// https://github.com/google/canvas-5-polyfill/blob/master/canvasv5.js
if (CanvasRenderingContext2D.prototype.ellipse == undefined) {
    CanvasRenderingContext2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
        this.save();
        this.translate(x, y);
        this.rotate(rotation);
        this.scale(radiusX, radiusY);
        this.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
        this.restore();
    }
}

/**
 * Creates Canvas class from DOM CanvasElement
 * @class
 * @classdesc Easy-to-use canvas helper class
 * @param {object} canvas - DOM CanvasElement
 */
function Canvas(canvas) {
    this.canvas = canvas;
    this.translation = { x: 0, y: 0 };

    this.mouseMove = undefined;
    this.mouseDown = undefined;
    this.mouseUp = undefined;
    this.mouseLeave = undefined;

    this.mouseIsDown = false;
    this.lastPos = undefined;

    this.deepCalcPosition();
}

Canvas.imageToDataURL = function(img, shrinkage) {
    shrinkage = shrinkage || 1;
    var w = Math.floor(img.width / shrinkage);
    var h = Math.floor(img.height / shrinkage);

    var c = new Canvas(document.createElement("canvas"));
    c.resize(w, h);
    c.drawImage(img, 0, 0, w, h);
    return c.getDataURL();
};

Canvas.imageSrcToDataURL = function(src, callback) {
    var img = new Image();

    img.onload = function() {
        callback(Canvas.imageToDataURL(this));
    };

    img.src = src;
};

Canvas.fileToDataURL = function(file, callback) {
    Canvas.imageSrcToDataURL(window.URL.createObjectURL(file), callback);
};

Canvas.fileToImage = function(file, callback) {
    var img = new Image();

    img.onload = function() {
        callback(this);
    };

    img.src = window.URL.createObjectURL(file);
};

Canvas.prototype.deepCalcPosition = function() {
    var z = this.canvas, x = 0, y = 0, c; 

    while(z && !isNaN(z.offsetLeft) && !isNaN(z.offsetTop)) {        
        c = isNaN(window.globalStorage) ? 0 : window.getComputedStyle(z, null); 
        x += z.offsetLeft - z.scrollLeft + (c ? parseInt(c.getPropertyValue('border-left-width') , 10) : 0);
        y += z.offsetTop - z.scrollTop + (c ? parseInt(c.getPropertyValue('border-top-width') , 10) : 0);
        z = z.offsetParent;
    }

    this.offset = { x: x, y: y };
};

/**
 * Sets function to use when mouse is moved on canvas (or touch moved)
 * @param {Function} fn - function to be called on mousemove (or touchmove)
 */
Canvas.prototype.setMouseMove = function(fn) {
    this.mouseMove = fn;
    var self = this;

    this.canvas.addEventListener("mousemove", function(e) {
        var p = self.pos(e);
        if (self.lastPos === undefined) self.lastPos = p;
            if (self.mouseMove(p.x, p.y, self.mouseIsDown, self.lastPos.x, self.lastPos.y, e) !== false) {
            self.lastPos = p;
        }
    });

    this.canvas.addEventListener("touchmove", function(e) {
        var p = self.pos(e);
        if (self.lastPos === undefined) self.lastPos = p;
            if (self.mouseMove(p.x, p.y, self.mouseIsDown, self.lastPos.x, self.lastPos.y, e) !== false) {
            self.lastPos = p;
        }
    });
};

/**
 * Sets function to use on mousedown (or touch start)
 * @param {Function} fn function to be called on mousedown/touchstart
 */
Canvas.prototype.setMouseDown = function(fn) {
    this.mouseDown = fn;
    var self = this;

    this.canvas.addEventListener("mousedown", function(e) {
        var p = self.pos(e);
        self.mouseIsDown = true;
        self.lastPos = p;
        self.mouseDown(p.x, p.y, e);
    });

    this.canvas.addEventListener("touchstart", function(e) {
        var p = self.pos(e);
        self.mouseIsDown = true;
        self.lastPos = p;
        self.mouseDown(p.x, p.y, e);
    });
};

/**
 * Sets function to use on mouseup (or touch release)
 * @param {Function} fn function to be called on mouseup/touchrelease
 */
Canvas.prototype.setMouseUp = function(fn) {
    this.mouseUp = fn;
    var self = this;

    this.canvas.addEventListener("mouseup", function(e) {
        var p = self.pos(e);
        self.mouseIsDown = false;
        self.mouseUp(p.x, p.y, self.lastPos.x, self.lastPos.y, e);
        self.lastPos = p;
    });

    this.canvas.addEventListener("touchend", function(e) {
        var p = self.pos(e);
        self.mouseIsDown = false;
        self.mouseUp(p.x, p.y, self.lastPos.x, self.lastPos.y, e);
        self.lastPos = p;
    });
};

/**
 * Sets function to use on mouseleave (or touchcancel)
 * @param {Function} fn function to be called on mouseleave/touchcancel
 */
Canvas.prototype.setMouseLeave = function(fn) {
    this.mouseLeave = fn;
    var self = this;

    this.canvas.addEventListener("mouseleave", function(e) {
        var p = self.pos(e);
        self.mouseLeave(e);
    });

    this.canvas.addEventListener("touchcancel", function(e) {
        var p = self.pos(e);
        self.mouseLeave(e);
    });
};

/**
 * Gets mouseposition from a MouseEvent -- relative to scale (gives internal x, y)
 * @param  {object} e TouchEvent
 * @return {object} Coordinate object (x, y)
 */
Canvas.prototype.pos = function(e) {
    var x = e.pageX;
    var y = e.pageY;

    if (e.changedTouches) {
        x = e.changedTouches[0].pageX;
        y = e.changedTouches[0].pageY;
    }

    x -= this.offset.x;
    y -= this.offset.y;

    x *= this.canvas.width / this.canvas.offsetWidth;
    y *= this.canvas.height / this.canvas.offsetHeight;

    return { "x": x, "y": y };
};

/**
 * Gets canvas element's context
 * @param  {string=} type Context type to retrieve
 * @return {CanvasRenderingContext2D} context
 */
Canvas.prototype.context = function(type) {
    if (type === undefined) {
        type = "2d";
    }

    return this.canvas.getContext(type);
};

/**
 * Gets canvas width
 * @return {number} width
 */
Canvas.prototype.width = function() {
    return this.canvas.width;
};

/**
 * Gets canvas height
 * @return {number} height
 */
Canvas.prototype.height = function() {
    return this.canvas.height;
};

/**
 * Resizes canvas
 * @param  {number} w New width
 * @param  {number} h New height
 * @param  {boolean} redraw Redraw canvas afterwards?
 */
Canvas.prototype.resize = function(w, h, redraw) {
    if (redraw === undefined) {
        redraw = true;
    }

    var data;

    if (redraw) {
        data = this.toDataURL();
    }

    this.clear();
    this.canvas.width = w;
    this.canvas.height = h;

    if (redraw) {
        this.drawDataURL(data);
    }
};

/**
 * Sets the canvas' globalAlpha
 * @param {number} opacity Alpha value 0-1
 */
Canvas.prototype.setOpacity = function(opacity) {
    this.context().globalAlpha = opacity;
};

/**
 * Gets the canvas' globalAlpha value
 * @return {number} opacity Alpha value 0-1
 */
Canvas.prototype.opacity = function() {
    return this.context().globalAlpha;
};

/**
 * Translates the canvas relative to its current translation
 * @param  {number} x x amount to translate
 * @param  {number} y y amount to translate
 * @return {undefined}   no return value
 */
Canvas.prototype.translate = function(x, y) {
    this.context().translate(x, y);
    this.translation = { "x": this.translation.x + x, "y": this.translation.y + y };
};

/**
 * Sets the canvas' translation
 * @param {number} x x translation
 * @param {number} y y translation
 */
Canvas.prototype.setTranslation = function(x, y) {
    this.context().translate(-this.translate.x, -this.translate.y);
    this.context().translate(x, y);
    this.translation = { "x": x, "y": y };
};

/**
 * Gets the canvas' current translation - can also be accessed through the translation property
 * @return {number} current translation
 */
Canvas.prototype.currentTranslation = function() {
    return this.translation;
};

Canvas.prototype.setComposition = function(c) {
    this.context().globalCompositeOperation = c;
};

Canvas.prototype.composition = function() {
    return this.context().globalCompositeOperation;
};

Canvas.prototype.setStrokeStyle = function(s) {
    this.context().strokeStyle = s;
};

Canvas.prototype.strokeStyle = function() {
    return this.context().strokeStyle;
};

Canvas.prototype.setFillStyle = function(s) {
    this.context().fillStyle = s;
};

Canvas.prototype.fillStyle = function() {
    return this.context().fillStyle;
};

Canvas.prototype.setLineWidth = function(width) {
    this.context().lineWidth = width;
};

Canvas.prototype.lineWidth = function() {
    return this.context().lineWidth;
};

Canvas.prototype.setLineCap = function(cap) {
    // butt* round square
    this.context().lineCap = cap;
};

Canvas.prototype.lineCap = function() {
    return this.context().lineCap;
};

Canvas.prototype.setLineJoin = function(join) {
    // bevel round miter*
    this.context().lineJoin = join;
};

Canvas.prototype.lineJoin = function() {
    return this.context().lineJoin;
};

Canvas.prototype.setFont = function(font) {
    // css font property
    this.context().font = font;
};

Canvas.prototype.font = function() {
    return this.context().font;
};

Canvas.prototype.setFontSize = function(size) {
    var font = this.context().font;
    var args = font.substr(font.indexOf(" ") + 1);
    this.context().font = size + " " + args;
};

Canvas.prototype.fontSize = function() {
    return this.context().font.split(" ")[0];
};

Canvas.prototype.setTextAlign = function(align) {
    // start*, end, left, right, center
    this.context().textAlign = align;
};

Canvas.prototype.textAlign = function() {
    return this.context().textAlign;
};

Canvas.prototype.setTextBaseline = function(baseline) {
    // top, hanging, middle, alphabetic*, ideographic, bottom
    this.context().textBaseline = baseline;
};

Canvas.prototype.textBaseline = function() {
    return this.context().textBaseline;
};

Canvas.prototype.setDirection = function(direction) {
    // ltr, rtl, inherit*
    this.context().direction = direction;
};

Canvas.prototype.direction = function() {
    return this.context().direction;
};

/**
 * Clears a rectangular area on the canvas
 * @param  {number}     x x position
 * @param  {number}     y y position
 * @param  {number}     w width
 * @param  {number}     h height
 * @return {undefined}  no return value
 */
Canvas.prototype.clearRect = function(x, y, w, h) {
    this.context().clearRect(x, y, w, h);
};

/**
 * Fills the canvas regardless of translation
 * @param  {string=} color  color - if undefined, will use last fill color
 * @return {undefined}      no return value
 */
Canvas.prototype.fill = function(color) {
    if (color !== undefined) {
        this.context().fillStyle = color;
    }

    this.context().fillRect(-this.translation.x, -this.translation.y, this.canvas.width, this.canvas.height);
};

/**
 * Clears the canvas regardless of translation
 * @return {undefined} no return value
 */
Canvas.prototype.clear = function() {
    this.context().clearRect(-this.translation.x, -this.translation.y, this.canvas.width, this.canvas.height);
};

/**
 * Draws the outline of a rectangle
 * @param  {number} x           x position
 * @param  {number} y           y position
 * @param  {number} w           width
 * @param  {number} h           height
 * @param  {string=} color      color - if undefined, will use last draw color
 * @param  {number=} lineWidth  width of line - if undefined, will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.drawRect = function(x, y, w, h, color, lineWidth) {
    if (color !== undefined) {
        this.context().strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        this.context().lineWidth = lineWidth;
    }

    this.context().strokeRect(x, y, w, h);
};

Canvas.prototype.drawRectPts = function(x1, y1, x2, y2, color, lineWidth) {
    if (color !== undefined) {
        this.context().strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        this.context().lineWidth = lineWidth;
    }

    if (x1 > x2) {
        var _ = x1;
        x1 = x2;
        x2 = _;
    }

    if (y1 > y2) {
        var _ = y1;
        y1 = y2;
        y2 = _;
    }

    this.context().strokeRect(x1, y1, x2 - x1, y2 - y1);
};

/**
 * Fills a rectangle
 * @param  {number} x       x position
 * @param  {number} y       y position
 * @param  {number} w       width
 * @param  {number} h       height
 * @param  {string=} color  color - if undefined, will use last fill color
 * @return {undefined}      no return value
 */
Canvas.prototype.fillRect = function(x, y, w, h, color) {
    if (color !== undefined) {
        this.context().fillStyle = color;
    }

    this.context().fillRect(x, y, w, h);
};

Canvas.prototype.fillRectPts = function(x1, y1, x2, y2, color) {
    if (color !== undefined) {
        this.context().fillStyle = color;
    }

    if (x1 > x2) {
        var _ = x1;
        x1 = x2;
        x2 = _;
    }

    if (y1 > y2) {
        var _ = y1;
        y1 = y2;
        y2 = _;
    }

    this.context().fillRect(x1, y1, x2 - x1, y2 - y1);
};

/**
 * Draws a line
 * @param  {number} x1          x position of first point
 * @param  {number} y1          y position of first point
 * @param  {number} x2          x position of second point
 * @param  {number} y2          y position of second point
 * @param  {string=} color      color - if undefined, will use last draw color
 * @param  {number=} lineWidth  line width - if undefined, will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.drawLine = function(x1, y1, x2, y2, color, lineWidth) {
    if (color !== undefined) {
        this.context().strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        this.context().lineWidth = lineWidth;
    }

    var ctx = this.context();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

/**
 * Draws through a path of points with lines
 * @param  {object} pts         Array of either {x, y} objects
 * @param  {string=} color      color - if undefined, will use last draw color
 * @param  {number=} lineWidth  line width = if undefined, will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.drawPath = function(pts, color, lineWidth) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    var len = pts.length;

    for (var i = 1; i < len; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.stroke();
};

/**
 * Fills in a polygon defined by points
 * @param  {object} pts         Array of either {x, y} objects
 * @param  {string=} color      color - if undefined, will use last fill color
 * @return {undefined}          no return value
 */
Canvas.prototype.fillPath = function(pts, color) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    var len = pts.length;

    for (var i = 1; i < len; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }

    ctx.fill();
};

/**
 * Curves an approximation through a path using quadratic curves
 * @param  {object} pts         array of {x, y} objects
 * @param  {string=} color      color - if undefined, will use last draw color
 * @param  {number=} lineWidth  line width - if undefined, will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.curvePath = function(pts, color, lineWidth) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }

    var len = p.length - 2;

    ctx.moveTo(pts[0].x, pts[0].y);

    for (var i = 1; i < len; i++) {
        var xc = (p[i].x + p[i + 1].x) / 2;
        var yc = (p[i].y + p[i + 1].y) / 2;
        ctx.quadraticCurveTo(p[i].x, p[i].y, xc, yc);
    }

    ctx.quadraticCurveTo(p[i].x, p[i].y, p[i + 1].x, p[i + 1].y);

    ctx.stroke();
};

/**
 * Draws a circle by center point and radius
 * @param  {number} cx          x position of center
 * @param  {number} cy          y position of center
 * @param  {number} r           radius
 * @param  {string=} color      color - if undefined will use last draw color
 * @param  {number=} lineWidth  line width - if undefined will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.drawCircle = function(cx, cy, r, color, lineWidth) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    ctx.stroke();
};

/**
 * Fills a circle by center point and radius
 * @param  {number} cx          x position of center
 * @param  {number} cy          y position of center
 * @param  {number} r           radius
 * @param  {string=} color      color - if undefined, will use last fill color
 * @return {undefined}          no return value
 */
Canvas.prototype.fillCircle = function(cx, cy, r, color) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI, false);
    ctx.fill();
};

/**
 * Draws a circle within a hypothetical square
 * @param  {number} x           x position of square
 * @param  {number} y           y position of square
 * @param  {number} s           size of square (width or height)
 * @param  {string=} color      color - if undefined, will use last draw color
 * @param  {number=} lineWidth  line width - if undefined, will use last line width
 * @return {undefined}          no return value
 */
Canvas.prototype.drawCircleInSquare = function(x, y, s, color, lineWidth) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }

    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, 2 * Math.PI, false);
    ctx.stroke();
};

/**
 * Fills a circle within a hypothetical square
 * @param  {number} x           x position of square
 * @param  {number} y           y position of square
 * @param  {number} s           size of square (width or height)
 * @param  {string=} color      color - if undefined, will use last fill color
 * @return {undefined}          no return value
 */
Canvas.prototype.fillCircleInSquare = function(x, y, s, color) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, 2 * Math.PI, false);
    ctx.fill();
};

Canvas.prototype.drawCircleInPts = function(x1, y1, x2, y2, color, lineWidth) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }

    if (x1 > x2) {
        var _ = x1;
        x1 = x2;
        x2 = _;
    }

    if (y1 > y2) {
        var _ = y1;
        y1 = y2;
        y2 = _;
    }

    var w = x2 - x1;
    var h = y2 - y1;

    ctx.beginPath();
    ctx.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI, false);
    ctx.stroke();
};



Canvas.prototype.fillCircleInPts = function(x1, y1, x2, y2, color) {
    var ctx = this.context();

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

    if (x1 > x2) {
        var _ = x1;
        x1 = x2;
        x2 = _;
    }

    if (y1 > y2) {
        var _ = y1;
        y1 = y2;
        y2 = _;
    }

    var w = x2 - x1;
    var h = y2 - y1;

    ctx.beginPath();
    ctx.ellipse(x1 + w / 2, y1 + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI, false);
    ctx.fill();
};

/**
 * Draws an image
 * @param  {Image} image    image to draw
 * @param  {number} x       x position
 * @param  {number} y       y position
 * @param  {number} w       width - if undefined, will use the image's width
 * @param  {number=} h      height - if undefined, will use the image's height
 * @return {undefined}      no return value
 */
Canvas.prototype.drawImage = function(image, x, y, w, h) {
    if (w === undefined) {
        w = image.width;
    }

    if (h === undefined) {
        h = image.height;
    }

    this.context().drawImage(image, x, y, w, h);
};

/**
 * Draws a rotated image
 * @param  {Image} image    image to draw
 * @param  {number} rotate  radians to rotate image
 * @param  {number} x       x position
 * @param  {number} y       y position
 * @param  {number=} w      width - if undefined, will use image's width
 * @param  {number=} h      height - if undefined, will use image's height
 * @return {undefined}      no return value
 */
Canvas.prototype.drawRotatedImage = function(image, rotate, x, y, w, h) {
    if (w === undefined) w = image.width;
    if (h === undefined) h = image.height;

    var ctx = this.context();

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotate);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    ctx.restore();
};

/**
 * Draws a cropped image
 * @param  {Image} image    image to crop and draw
 * @param  {number} x       x position to display
 * @param  {number} y       y position to display
 * @param  {number} cx      x position local to image to start crop
 * @param  {number} cy      y position local to image to start crop
 * @param  {number} cw      width of crop
 * @param  {number} ch      height of crop
 * @param  {number=} w      width to display, if undefined will use crop width
 * @param  {number=} h      height to display, if undefined will use crop height
 * @return {undefined}      no return value
 */
Canvas.prototype.drawCroppedImage = function(image, x, y, cx, cy, cw, ch, w, h) {
    if (w === undefined) w = cw;
    if (h === undefined) h = ch;

    this.context().drawImage(image, cx, cy, cw, ch, x, y, w, h);
};

/**
 * fuck off
 * @param  {Image} image    image to crop and rotate and draw
 * @param  {number} rotate  radians to rotate
 * @param  {number} x       x position to display
 * @param  {number} y       y position to display
 * @param  {number} cx      x position local to image to start crop
 * @param  {number} cy      y position local to image to start crop
 * @param  {number} cw      width of crop
 * @param  {number} ch      height of crop
 * @param  {number=} w      width to display - if undefined, will use crop width
 * @param  {number=} h      height to display - if undefined, will use crop height
 * @return {undefined}      no return value
 */
Canvas.prototype.drawRotatedCroppedImage = function(image, rotate, x, y, cx, cy, cw, ch, w, h) {
    if (w === undefined) w = cw;
    if (h === undefined) h = ch;

    var ctx = this.context();

    ctx.save();
    ctx.translation(x + w / 2, y + h / 2);
    ctx.rotate(rotate);
    ctx.drawImage(image, cx, cy, cw, ch, -w / 2, -h / 2, w, h);
    ctx.restore();
};

/**
 * Gets data url from canvas data (can be used to view in-browser as image)
 * @return {string} dataurl
 */
Canvas.prototype.getDataURL =
Canvas.prototype.toDataURL = function() {
    return this.canvas.toDataURL();
};

/**
 * Draws data URL to canvas
 * @param  {string}     data        data URL
 * @param  {number}     x           x position
 * @param  {number}     y           y position
 * @param  {number=}    w           width - if undefined, will use data width
 * @param  {number=}    h           height - if undefined, will use data height
 * @param  {Function=}  callback    function to be called when the data is drawn
 * @return {undefined}              no return value
 */
Canvas.prototype.drawDataURL = function(data, x, y, w, h, callback) {
    var self = this;
    var img = new Image();

    img.onload = function() {
        self.drawImage(this, x, y, w, h);

        if (callback !== undefined) {
            callback();
        }
    };

    img.onerror = function(e) {
        console.log(e);
    };

    img.src = data;
};

/**
 * Gets pixel data of canvas
 * @param  {number=} x x position of cropping rect - if undefined, will use 0
 * @param  {number=} y y position of cropping rect - if undefined, will use 0
 * @param  {number=} w width of cropping rect - if undefined, will use canvas width
 * @param  {number=} h height of cropping rect - if undefined, will use canvas height
 * @return {ImageData} ImageData containing "data" member, which is Uint8ClampedArray of r, g, b, a, . . . values
 */
Canvas.prototype.getImageData = function(x, y, w, h) {
    x = x || 0;
    y = y || 0;
    w = w || this.canvas.width;
    h = h || this.canvas.height;

    return this.context().getImageData(x, y, w, h);
};

/**
 * Sets pixel data of canvas
 * @param  {ImageData} data ImageData to put - needs width, height, and data (Uint8ClampedArray of r, g, b, a, . . . values)
 * @param  {number=} x      x position to put the data - if undefined, will use 0
 * @param  {number=} y      y position to put the data - if undefined, will use 0
 * @return {undefined}      no return value
 */
Canvas.prototype.putImageData = function(data, x, y) {
    x = x || 0;
    y = y || 0;

    this.context().putImageData(data, x, y);
};

/**
 * Generates an image from canvas and returns it through a callback function
 * @param  {Function} cb    Callback function taking an Image argument to be used as a returner
 * @return {undefined}      no value - Image is returned through callback function
 */
Canvas.prototype.getImage =
Canvas.prototype.toImage = function(cb) {
    var ret = new Image();
    ret.onload = function() {
        cb(this);
    };

    ret.src = this.toDataURL();
};

/**
 * Returns an x-value to be used to horizontally center an object with width w
 * @param  {number} w width of object to be centered
 * @return {number}   x-value of object to be used to center it
 */
Canvas.prototype.cx = function(w) {
    return this.canvas.width / 2 - w / 2;
};

/**
 * Returns a y-value to be used to vertically center an object with height h
 * @param  {number} h height of object to be centered
 * @return {number}   y-value of object to be used to center it
 */
Canvas.prototype.cy = function(h) {
    return this.canvas.height / 2 - h / 2;
};