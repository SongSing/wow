var canvas;

function el(id) {
    return document.getElementById(id);
}

function init() {
    el("filepicker").onchange = filePicked;
    el("save").onclick = saveImage;
    el("t1").onclick = fnButtonClicked;
    el("t2").onclick = fnButtonClicked;
    canvas = new Canvas(el("canvas"));
}

function saveImage() {
    window.open(canvas.toDataURL(), "_blank");
}

function fnButtonClicked(e) {
    e = e || window.event;
    var sender = e.target || e.srcElement;

    var fn = window[sender.getAttribute("fn")];

    var imageData = canvas.getImageData();
    var buf32 = new Uint32Array(imageData.data.buffer);
    buf32 = fn(buf32, canvas.width(), canvas.height()); // auto changes bc buffer view
    canvas.putImageData(imageData);
}

function filePicked() {
    var file = this.files[0];

    Canvas.fileToImage(file, imageLoaded);
}

function imageLoaded(img) {
    canvas.resize(img.width, img.height);
    canvas.drawImage(img, 0, 0);
}

function transform1(data, w, h) {
    for (var y = 0; y < h; y++) {
        var n = shiftArray(data.subarray(y * w, y * w + w), y / 2 * (Math.random() - 1/2));
        for (var x = 0; x < w; x++) {
            data[y * w + x] = n[x];
        }
    }

    return data;
}

function transform2(data, w, h) {
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var pixel = data[y * w + x]; // abgr, 8 bits (255)
            //console.log(pixel);

            var mask = 255;
            var r = pixel & mask;
            var g = (pixel & (mask <<= 8)) >> 8;
            var b = (pixel & (mask <<= 8)) >> 16;
            var a = (pixel & (mask <<= 8)) >> 24;
            //console.log(r+","+g+","+b+","+a);

            r += 200;

            if (r > 255) {
                r = 255;
            }

            //console.log(r+","+g+","+b+","+a);
            pixel = a;
            pixel = (pixel << 8) | b;
            pixel = (pixel << 8) | g;
            pixel = (pixel << 8) | r;
            //console.log(pixel);
            //console.log("-");


            data[y * w + x] = pixel;
        }
    }

    return data;
}

function shiftArray(arr, d) {
    d = parseInt(d);
    var ret = new Uint32Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        var _i = i + d;

        if (_i < 0) {
            _i = arr.length + _i;
        } else if (_i >= arr.length) {
            _i = _i % arr.length;
        }

        ret[_i] = obj;
    }

    return ret;
}

window.onload = init;