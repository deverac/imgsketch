// To run tests:
//     npm test
// OR:
//    1. npm run testserver
//    2. Open browser to http://localhost:8888/

// The canvas that is drawn on is removed after every spec. If '_debug' is
// prepended to the spec description, the canvas will not be removed. E.g.:
//
//     BEFORE:       it("should draw", function() { ...
//     AFTER:        it("_debug should draw", function() { ...
//
// The '_debug' string may only be used in a single spec description.
// The purpose of the '_debug' string is to prevent removal of the canvas,
// thus allowing it to be viewed in the browser. Including the '_debug' string
// interferes with the normal execution of the spec and may cause it to fail.
// So, when using '_debug', any reported reason for the spec failure should be
// ignored. Remove (or rename) the '_debug' string to run the spec correctly.
// All specs executed after the '_debug' spec will be skipped.

// For simplicity, the shape in most tests is drawn at (0,0). Consequenntly,
// the shape will only be partially visible if '_debug' is specified. 

// Specs are in roughly the same order as the z-fields.

// Edit the Jasmine configuration as needed.
jasmine.getEnv().configure({
    // autoCleanClosures: false,           // Clean closures when suite is done
    // failSpecWithNoExpectations: true,   // Fail if spec has no expectation
    // hideDisabled: true                  // Hide disabled specs (HTMLReporter only)
     random: false,                      // Run specs in sequential order
    // seed: '2468',                       // Seed to use for randomization
    // specFilter: (spec) => { console.log(spec.description); return true; },
    // stopOnSpecFailure: true,            // Stop when a spec fails
    // stopSpecOnExpectationFailure: true, // Stop when an expectation fails
    // verboseDeprecation: true,           // Warn every occurance of deprecated functionality
});

// ---------- No user options below  -------

var ctx; // Holds fake getContext('2d').
var imgClass;
var imgAttr;

var colors = {
    'a': '#8b8680',
    'b': '#4f69c6',
    'c': '#6456b7',
    'd': '#ff8833',
    'e': '#ffae42',
    'f': '#fed85d',
    'g': '#01a638',
    'h': '#f1e788',
    'i': '#c5e17a',
    'j': '#0095b7',
    'k': '#000000',
    'l': '#02a4d3',
    'm': '#fd0e35',
    'n': '#af593e',
    'o': '#ff681f',
    'p': '#ffa6c9',
    'q': '#bb3385',
    'r': '#ed0a3f',
    's': '#f7468a',
    't': '#0066ff',
    'u': '#fdd5b1',
    'v': '#8359a3',
    'w': '#ffffff',
    'y': '#fbe870',
};

var debug = {
    keep_img: false,
    desc: null,
    str: '_debug',
};

function toRad(deg) {
    return Math.PI * deg / 180;
}

function cos(deg) {
    return Math.cos(toRad(deg));
}

function sin(deg) {
    return Math.sin(toRad(deg));
}

function computePoints(sides, hgt) {
    var pts = {};
    var angle = 360.0 / sides;
    var adjust = (180.0 - angle) / 2;

    var mcos = Math.cos(Math.PI / sides);
    var denom = ((sides == 1 || sides == 2) ? 2 : ((sides % 2) ? (mcos + 1) : (2 * mcos)));
    var r = hgt / denom;

    for (i = 0; i < sides; i++) {
        pts['x' + i] = r * cos(i * angle + adjust);
        pts['y' + i] = r * sin(i * angle + adjust);
    }

    return pts;
}

function addImg(s, cls, attr) {
    imgClass = cls || 'pgon';
    imgAttr = attr || 'data-src';
    if (debug.keep_img) {
        pending(); // Skip test
    } else {
        var img = document.createElement('img');
        img.setAttribute('class', imgClass);
        img.setAttribute(imgAttr, 'poly.png?' + s);
        document.body.appendChild(img);

        imgSketch.init(imgClass, imgAttr);

        if (debug.desc) {
            debug.keep_img = true;
        }
    }
}

function removeImg() {
    if (debug.keep_img) {
        fail("'" + debug.str + "' found in: [" + debug.desc + "]. Using '" + debug.str + "' may cause the spec to fail for unrelated reasons so any failures should be ignored. Remove '" + debug.str + "' to run spec correctly.");
    } else {
        document.querySelectorAll('img.' + imgClass).forEach(elem => elem.parentElement.removeChild(elem));
    }
}

function isDebugSpec() {
    const hasDebugStr = jasmine.currentTest.description.startsWith(debug.str);
    if (hasDebugStr) {
        if (debug.desc) {
            throw new Error("'" + debug.str + "' may only be used once. Previous location: '" + debug.desc + "'");
        }
        debug.desc = jasmine.currentTest.fullName;
    }
    return hasDebugStr;
}

function spyOnContext2D() {
    spyOn(CanvasRenderingContext2D.prototype, 'arc').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'beginPath').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'closePath').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'ellipse').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'fill').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'fillRect').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'fillText').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'lineTo').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'moveTo').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'rotate').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'stroke').and.callThrough();
    spyOn(CanvasRenderingContext2D.prototype, 'translate').and.callThrough();

    if (isDebugSpec()) {
        spyOn(HTMLCanvasElement.prototype, 'getContext').and.callThrough();
    } else {
        ctx = document.createElement("canvas").getContext('2d');
        spyOn(HTMLCanvasElement.prototype, 'getContext').and.returnValue(ctx);
    }

}

// Check call order of functions.
function callOrder(cx, ary) {
    var dct = {};
    var prevVal = -1;
    var prevName = '(none)'
    var failed = 0;

    ary.forEach((curName, i) => {
        if (!dct[curName]) {
            dct[curName] = 0;
        }
        var n = dct[curName];
        var callDat = cx[curName].calls.all()[n];
        if (callDat) {
            var curVal = callDat.invocationOrder;
            expect(curVal).withContext('Incorrect call order (' + prevName + '[' + (dct[prevName] - 1) + '] and ' + curName + '[' + n + '])').toBeGreaterThan(prevVal);
            dct[curName]++;
            prevVal = curVal;
            prevName = curName;
        } else {
            if (!failed) {
                fail(curName + ' specified too many times (' + (dct[curName] + 1) + ')');
                failed = 1;
            }
        }
    });
}

function checkArgsEq(method, n, a, b, c, d, e, f, g) {
    var callArgs = method.calls.argsFor(n);
    expect(callArgs[0]).toEqual(a);
    if (b) {
        expect(callArgs[1]).toEqual(b);
        if (c) {
            expect(callArgs[2]).toEqual(c);
            if (d) {
                expect(callArgs[3]).toEqual(d);
                if (e) {
                    expect(callArgs[4]).toEqual(e);
                    if (f) {
                        expect(callArgs[5]).toEqual(f);
                        if (g) {
                            expect(callArgs[6]).toEqual(g);
                        }
                    }
                }
            }
        }
    }
}

function checkArgsCl(method, n, a, b, c, d, e, f, g) {
    const delta = 0.00001;
    const callArgs = method.calls.argsFor(n);
    expect(callArgs[0]).toBeCloseTo(a, delta);
    if (b) {
        expect(callArgs[1]).toBeCloseTo(b, delta);
        if (c) {
            expect(callArgs[2]).toBeCloseTo(c, delta);
            if (d) {
                expect(callArgs[3]).toBeCloseTo(d, delta);
                if (e) {
                    expect(callArgs[4]).toBeCloseTo(e, delta);
                    if (f) {
                        expect(callArgs[5]).toBeCloseTo(f, delta);
                        if (g) {
                            expect(callArgs[6]).toBeCloseTo(g, delta);
                        }
                    }
                }
            }
        }
    }
}



describe("Specs", function() {

    beforeAll(function() {
        // Gather test info. (Needed to access test description.)
        jasmine.getEnv().addReporter({
            specStarted: result => (jasmine.currentTest = result),
            // specDone: result => (jasmine.currentTest = result),
        });
    });

    beforeEach(function() {
        spyOnContext2D();
    });

    afterEach(function() {
        removeImg();
    });

    describe("QueryParams", function() {

        it("should have white as default bg", function() {
            const canvasSize = 40;
            addImg('z=s');
            expect(ctx.fillStyle).toEqual(colors.w);
            expect(ctx.fillRect).toHaveBeenCalledTimes(1);
            checkArgsEq(ctx.fillRect, 0, 0, 0, canvasSize / 2, canvasSize / 2);
        });

        it("should fill bg", function() {
            const canvasSize = 40;
            addImg('bg=r&z=s');
            expect(ctx.fillStyle).toEqual(colors.r);
            expect(ctx.fillRect).toHaveBeenCalledTimes(1);
            checkArgsEq(ctx.fillRect, 0, 0, 0, canvasSize / 2, canvasSize / 2);
        });

        it("default color should be black", function() {
            addImg('z=s');
            expect(ctx.strokeStyle).toEqual(colors.k);
        });

        it("should set default color", function() {
            addImg('color=b&z=s');
            expect(ctx.strokeStyle).toEqual(colors.b);
        });

        it("should override default color", function() {
            addImg('color=b&z=sr');
            expect(ctx.strokeStyle).toEqual(colors.r);
        });

        it("should replace all color dictionary", function() {
            var c = [];
            for (var i = 1; i <= 26; i++) {
                c.push(('000000' + i).slice(-6));
            }
            addImg('colord=' + c.join(',') + '&z=se');
            expect(ctx.strokeStyle).toEqual('#000005');
        });

        it("should replace all color dictionary with wrap", function() {
            var c = [];
            for (var i = 1; i <= 28; i++) {
                c.push(('000000' + i).slice(-6));
            }
            addImg('colord=' + c.join(',') + '&z=sb');
            expect(ctx.strokeStyle).toEqual('#000028');
        });

        it("should replace specific color of color dictionary", function() {
            var c = [];
            for (var i = 1; i <= 3; i++) {
                c.push('');
            }
            c[2] = '000003';
            addImg('colord=' + c.join(',') + '&z=sc');
            expect(ctx.strokeStyle).toEqual('#000003');
        });

        it("should set x of color dictionary", function() {
            var c = [];
            addImg('cxz=00000a&z=sx');
            expect(ctx.strokeStyle).toEqual('#00000a');
        });

        it("should set z of color dictionary", function() {
            var c = [];
            addImg('cxz=,00000b&z=sz');
            expect(ctx.strokeStyle).toEqual('#00000b');
        });

        it("should dim both dimensions", function(done) {
            const sz = 50;
            addImg('dim=' + sz + '&z=s');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(sz);
                expect(e.height).toEqual(sz);
                done();
            }
        });

        it("should set dim values", function(done) {
            const sz = 50;
            addImg('dim=' + sz + ',' + (2 * sz) + '&z=s');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(sz);
                expect(e.height).toEqual(2 * sz);
                done();
            }
        });

        it("should set family to monospace", function() {
            addImg('family=m&z=x-Hello');
            expect(ctx.font).toEqual('20px monospace');
        });

        it("should set family to sans-serif", function() {
            addImg('family=n&z=x-Hello');
            expect(ctx.font).toEqual('20px sans-serif');
        });

        it("should set family to serif", function() {
            addImg('family=s&z=x-Hello');
            expect(ctx.font).toEqual('20px serif');
        });

        it("should override default family", function() {
            addImg('family=s&z=x__m-Hello');
            expect(ctx.font).toEqual('20px monospace');
        });

        it("should show help", function() {
            addImg('help=1&z=s');
            expect(ctx.fillText.calls.count()).toBeGreaterThan(20);
            expect(ctx.fillText.calls.argsFor(0)[0]).toEqual("Parameters:");
        });

        it("should ignore help", function() {
            addImg('help=0&z=s');
            expect(ctx.fillText.calls.count()).toEqual(0);
        });

        it("should set default linewidth", function() {
            const lw = 8;
            addImg('linewidth=' + lw + '&z=s');
            expect(ctx.lineWidth).toEqual(lw);
        });

        it("should override default linewidth", function() {
            addImg('linewidth=8&z=s0,0a');
            expect(ctx.lineWidth).toEqual(1);
        });

        it("should pad", function(done) {
            addImg('pad=50&z=s_10');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(2 * 50 + 10 / 2);
                expect(e.height).toEqual(2 * 50 + 10 / 2);
                done();
            }
        });

        it("should padding not change dim dimensions", function(done) {
            const sz = 60;
            addImg('dim=' + sz + ',' + (2 * sz) + '&pad=30&z=s');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(sz);
                expect(e.height).toEqual(2 * sz);
                done();
            }
        });

        it("should ignore palette", function() {
            addImg('palette=0&z=s');
            expect(ctx.fillText.calls.count()).toEqual(0);
        });

        it("should show full palette", function() {
            const c = 'abcdefghijklmnopqrstuvwy'.split('');
            addImg('palette=1&z=s');
            expect(ctx.fillText.calls.count()).toEqual(2 * c.length);
            for (var i = 0; i < c.length; i++) {
                checkArgsEq(ctx.fillText, 2 * i, c[i]);
                checkArgsEq(ctx.fillText, 2 * i + 1, ' ' + c[i]);
            }
        });

        it("should show full palette and x and z", function() {
            const c = 'abcdefghijklmnopqrstuvwxyz'.split('');
            addImg('cxz=000001,000002&palette=1&z=s');
            expect(ctx.fillText.calls.count()).toEqual(2 * c.length);
            for (var i = 0; i < c.length; i++) {
                checkArgsEq(ctx.fillText, 2 * i, c[i]);
                checkArgsEq(ctx.fillText, 2 * i + 1, ' ' + c[i]);
            }
        });

        it("should show simple palette", function() {
            const c = 'roygbvwpank'.split('');
            addImg('palette=2&z=s');
            for (var i = 0; i < c.length; i++) {
                checkArgsEq(ctx.fillText, 2 * i, c[i]);
                checkArgsEq(ctx.fillText, 2 * i + 1, ' ' + c[i]);
            }
        });

        it("should set default polysize", function(done) {
            const sz = 20;
            addImg('polysize=' + sz + '&z=s');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(sz / 2);
                expect(e.height).toEqual(sz / 2);
                done();
            }
        });

        it("should override default polysize", function(done) {
            const sz = 20;
            addImg('polysize=80&z=s_' + sz);
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(sz / 2);
                expect(e.height).toEqual(sz / 2);
                done();
            }
        });

        it("should reload page", function() {
            const n = 3;
            spyOn(window, 'setTimeout');
            addImg('reload=' + n + '&z=s');
            expect(setTimeout).toHaveBeenCalledTimes(1);
            const callArgs = setTimeout.calls.argsFor(0);
            expect(typeof callArgs[0]).toEqual('function');
            expect(callArgs[0].name).toEqual('reloadPage');
            expect(callArgs[1]).toEqual(n * 1000);
        });

        it("should set textheight", function(done) {
            const th = 15;
            addImg('textheight=' + th + '&z=x-Hello~~World');
            expect(ctx.fillText).toHaveBeenCalledTimes(2);
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                // Setting a big textheight should create a large canvas height.
                expect(e.height).toBeGreaterThan(200);
                done();
            }
        });

        it("should set default textsize", function() {
            const sz = 20;
            addImg('textsize=' + sz + '&z=x-Hello');
            expect(ctx.fillText).toHaveBeenCalledTimes(1);
            expect(ctx.font.startsWith(sz + 'px ')).toBeTrue();
        });

        it("should override default textsize", function() {
            const sz = 10;
            addImg('textsize=20&z=x_' + sz + '-Hello');
            expect(ctx.fillText).toHaveBeenCalledTimes(1);
            expect(ctx.font.startsWith(sz + 'px ')).toBeTrue();
        });

        it("should handle empty query string", function(done) {
            addImg('');
            var e = document.querySelector('img.pgon');
            e.onload = function() {
                expect(e.width).toEqual(1);
                expect(e.height).toEqual(1);
                done();
            }
        });

        it("should accept user-defined class name", function(done) {
            const canvasSize = 40;
            const className = 'mypgon';
            addImg('z=s', className);
            var e = document.querySelector('img.' + className);
            expect(e.classList[0]).toEqual(className);
            e.onload = function() {
                expect(e.width).toEqual(canvasSize / 2);
                expect(e.height).toEqual(canvasSize / 2);
                done();
            }
        });

        it("should accept user-defined attribute name", function(done) {
            const canvasSize = 40;
            const attrName = 'myattr';
            addImg('z=s', null, attrName);
            const e = document.querySelector('img.pgon');
            expect(e.getAttribute(attrName)).toEqual('poly.png?z=s');
            e.onload = function() {
                expect(e.width).toEqual(canvasSize / 2);
                expect(e.height).toEqual(canvasSize / 2);
                done();
            }
        });

        for (var i = 0; i < 9; i++) {
            const n = (i == 0 ? '' : i);
            it("should draw z" + (i + 1) + " after z" + n, function() {
                addImg('z' + (n + 1) + '=s&z' + n + '=c');
                expect(ctx.arc).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(3);
                callOrder(ctx, ['arc', 'lineTo', 'lineTo', 'lineTo']);
            });
        }

    });

    describe("Shapes", function() {

        describe("Circle", function() {
            const sides = 3;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 30;
            const roty = 15;
            const rotx = 45;
            const ellipRot = 0;

            it("should draw", function() {
                addImg('z=c');
                expect(ctx.arc).toHaveBeenCalledTimes(1);
                checkArgsCl(ctx.arc, 0, 0, 0, size / 2, 0, toRad(360));
            });

            it("should close pie arc", function() {
                addImg('z=c-90,180');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.arc).toHaveBeenCalledTimes(1);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'arc', 'closePath']);
                checkArgsCl(ctx.arc, 0, 0, 0, size / 2, toRad(90), toRad(180));
            });

            it("should open arc", function() {
                addImg('z=C-90,180');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.arc).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'arc']);
                checkArgsCl(ctx.arc, 0, 0, 0, size / 2, toRad(90), toRad(180));
            });

            it("should stroke", function() {
                addImg('z=c');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=cr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=cR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=cR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=c' + xo + ',' + yo);
                expect(ctx.arc).toHaveBeenCalledTimes(1);
                checkArgsCl(ctx.arc, 0, xo, yo, size / 2, 0, toRad(360));
            });

            it("should size", function() {
                const siz = 100;
                addImg('z=c_'+siz);
                checkArgsCl(ctx.arc, 0, 0, 0, siz / 2, toRad(0), toRad(180));
            });

            it("should rotate z", function() {
                addImg('z=c__' + rotz);
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.ellipse).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'ellipse']);
                checkArgsCl(ctx.ellipse, 0, 0, 0, size / 2, size / 2, ellipRot, 0, toRad(360)); // a circle
            });

            it("should rotate y", function() {
                addImg('z=c__,' + roty);
                var cosy = cos(roty);
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.ellipse).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'ellipse']);
                checkArgsCl(ctx.ellipse, 0, 0, 0, cosy * size / 2, size / 2, ellipRot, 0, toRad(360));
            });

            it("should rotate x", function() {
                addImg('pad=50&z=c__,,' + rotx);
                var cosx = cos(rotx);
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.ellipse).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'ellipse']);
                checkArgsCl(ctx.ellipse, 0, 0, 0, size / 2, cosx * size / 2, ellipRot, 0, toRad(360));
            });

        });

        describe("Line", function() {
            const sides = 2;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;

            it("should draw", function() {
                addImg('z=l');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
            });

            it("should close", function() {
                addImg('z=l');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(1);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=L');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(1);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=l');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=lr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=lR');
                expect(ctx.stroke).toHaveBeenCalledTimes(1); // fill() not used for line
            });

            it("should fill color", function() {
                addImg('z=lR');
                expect(ctx.strokeStyle).toEqual(colors.r); // fillStyle not used for line
            });

            it("should translate", function() {
                addImg('z=l25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
            });

            it("should size", function() {
                const sid = 2;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=l_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
            });

            it("should rotate z", function() {
                addImg('z=l__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=l__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
            });

            it("should rotate x", function() {
                addImg('z=l__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=l25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x0 + xo, p.y0 + yo);
            });

        });

        describe('Triangle', function() {
            const sides = 3;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;

            it("should draw", function() {
                addImg('z=t');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
            });

            it("should close", function() {
                addImg('z=t');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(2);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=T');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(2);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=t');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=tr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=tR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=tR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=t25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
            });

            it("should size", function() {
                const sid = 3;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=t_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
            });

            it("should rotate z", function() {
                addImg('z=t__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=t__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
            });

            it("should rotate x", function() {
                addImg('z=t__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=t25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x0 + xo, p.y0 + yo);
            });

        });

        describe("Square", function() {
            const sides = 4;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;

            it("should draw", function() {
                addImg('z=s');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3);
            });

            it("should close", function() {
                addImg('z=s');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(3);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=S');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(3);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=s');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=sr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=sR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=sR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=s25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x3 + xo, p.y3 + yo);
            });

            it("should size", function() {
                const sid = 4;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=s_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
                checkArgsCl(ctx.lineTo, 2, c.x3, c.y3);
            });

            it("should rotate z", function() {
                addImg('z=s__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 2, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=s__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3 * cosy, p.y3);
            });

            it("should rotate x", function() {
                addImg('z=s__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=s25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x0 + xo, p.y0 + yo);
            });

        });

        describe("Pentagon", function() {
            const sides = 5;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;

            it("should draw", function() {
                addImg('z=p');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4);
            });

            it("should close", function() {
                addImg('z=p');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(4);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=P');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(4);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=p');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=pr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=pR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=pR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=p25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x4 + xo, p.y4 + yo);
            });

            it("should size", function() {
                const sid = 5;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=p_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
                checkArgsCl(ctx.lineTo, 2, c.x3, c.y3);
                checkArgsCl(ctx.lineTo, 3, c.x4, c.y4);
            });

            it("should rotate z", function() {
                addImg('z=p__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 2, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 3, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=p__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3 * cosy, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4 * cosy, p.y4);
            });

            it("should rotate x", function() {
                addImg('z=p__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3 * cosx);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=p25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x0 + xo, p.y0 + yo);
            });

        });

        describe("Hexagon", function() {
            const sides = 6;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;


            it("should draw", function() {
                addImg('z=h');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5);
            });

            it("should close", function() {
                addImg('z=h');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(5);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=H');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(5);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=h');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=hr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=hR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=hR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=h25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x5 + xo, p.y5 + yo);
            });

            it("should size", function() {
                const sid = 6;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=h_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
                checkArgsCl(ctx.lineTo, 2, c.x3, c.y3);
                checkArgsCl(ctx.lineTo, 3, c.x4, c.y4);
                checkArgsCl(ctx.lineTo, 4, c.x5, c.y5);
            });

            it("should rotate z", function() {
                addImg('z=h__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 2, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 3, p.x5, p.y5);
                checkArgsCl(ctx.lineTo, 4, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=h__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3 * cosy, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4 * cosy, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5 * cosy, p.y5);
            });

            it("should rotate x", function() {
                addImg('z=h__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3 * cosx);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4 * cosx);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=h25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x5 + xo, p.y5 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x0 + xo, p.y0 + yo);
            });

        });

        describe("Heptagon", function() {
            const sides = 7;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;


            it("should draw", function() {
                addImg('z=e');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5);
                checkArgsCl(ctx.lineTo, 5, p.x6, p.y6);
            });

            it("should close", function() {
                addImg('z=e');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(6);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=E');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(6);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=e');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=er');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=eR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=eR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=e25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x5 + xo, p.y5 + yo);
                checkArgsCl(ctx.lineTo, 5, p.x6 + xo, p.y6 + yo);
            });

            it("should size", function() {
                const sid = 7;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=e_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
                checkArgsCl(ctx.lineTo, 2, c.x3, c.y3);
                checkArgsCl(ctx.lineTo, 3, c.x4, c.y4);
                checkArgsCl(ctx.lineTo, 4, c.x5, c.y5);
                checkArgsCl(ctx.lineTo, 5, c.x6, c.y6);
            });

            it("should rotate z", function() {
                addImg('z=e__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 2, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 3, p.x5, p.y5);
                checkArgsCl(ctx.lineTo, 4, p.x6, p.y6);
                checkArgsCl(ctx.lineTo, 5, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=e__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3 * cosy, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4 * cosy, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5 * cosy, p.y5);
                checkArgsCl(ctx.lineTo, 5, p.x6 * cosy, p.y6);
            });

            it("should rotate x", function() {
                addImg('z=e__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3 * cosx);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4 * cosx);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5 * cosx);
                checkArgsCl(ctx.lineTo, 5, p.x6, p.y6 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=e25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x5 + xo, p.y5 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x6 + xo, p.y6 + yo);
                checkArgsCl(ctx.lineTo, 5, p.x0 + xo, p.y0 + yo);
            });

        });

        describe("Octagon", function() {
            const sides = 8;
            const size = 40;
            const p = computePoints(sides, size);
            const xo = 25;
            const yo = 30;
            const rotz = 360 / sides;
            const roty = 12;
            const rotx = 32;

            it("should draw", function() {
                addImg('z=o');
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5);
                checkArgsCl(ctx.lineTo, 5, p.x6, p.y6);
                checkArgsCl(ctx.lineTo, 6, p.x7, p.y7);
            });

            it("should close", function() {
                addImg('z=o');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(7);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=O');
                expect(ctx.beginPath).toHaveBeenCalledTimes(1);
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(7);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['beginPath', 'moveTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=o');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=or');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=oR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=oR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

            it("should translate", function() {
                addImg('z=o25,30');
                checkArgsCl(ctx.moveTo, 0, p.x0 + xo, p.y0 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x5 + xo, p.y5 + yo);
                checkArgsCl(ctx.lineTo, 5, p.x6 + xo, p.y6 + yo);
                checkArgsCl(ctx.lineTo, 6, p.x7 + xo, p.y7 + yo);
            });

            it("should size", function() {
                const sid = 8;
                const siz = 100;
                const c = computePoints(sid, siz);
                addImg('z=o_'+siz);
                checkArgsCl(ctx.moveTo, 0, c.x0, c.y0);
                checkArgsCl(ctx.lineTo, 0, c.x1, c.y1);
                checkArgsCl(ctx.lineTo, 1, c.x2, c.y2);
                checkArgsCl(ctx.lineTo, 2, c.x3, c.y3);
                checkArgsCl(ctx.lineTo, 3, c.x4, c.y4);
                checkArgsCl(ctx.lineTo, 4, c.x5, c.y5);
                checkArgsCl(ctx.lineTo, 5, c.x6, c.y6);
                checkArgsCl(ctx.lineTo, 6, c.x7, c.y7);
            });

            it("should rotate z", function() {
                addImg('z=o__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1, p.y1);
                checkArgsCl(ctx.lineTo, 0, p.x2, p.y2);
                checkArgsCl(ctx.lineTo, 1, p.x3, p.y3);
                checkArgsCl(ctx.lineTo, 2, p.x4, p.y4);
                checkArgsCl(ctx.lineTo, 3, p.x5, p.y5);
                checkArgsCl(ctx.lineTo, 4, p.x6, p.y6);
                checkArgsCl(ctx.lineTo, 5, p.x7, p.y7);
                checkArgsCl(ctx.lineTo, 6, p.x0, p.y0);
            });

            it("should rotate y", function() {
                addImg('z=o__,' + roty);
                var cosy = cos(roty);
                checkArgsCl(ctx.moveTo, 0, p.x0 * cosy, p.y0);
                checkArgsCl(ctx.lineTo, 0, p.x1 * cosy, p.y1);
                checkArgsCl(ctx.lineTo, 1, p.x2 * cosy, p.y2);
                checkArgsCl(ctx.lineTo, 2, p.x3 * cosy, p.y3);
                checkArgsCl(ctx.lineTo, 3, p.x4 * cosy, p.y4);
                checkArgsCl(ctx.lineTo, 4, p.x5 * cosy, p.y5);
                checkArgsCl(ctx.lineTo, 5, p.x6 * cosy, p.y6);
                checkArgsCl(ctx.lineTo, 6, p.x7 * cosy, p.y7);
            });

            it("should rotate x", function() {
                addImg('z=o__,,' + rotx);
                var cosx = cos(rotx);
                checkArgsCl(ctx.moveTo, 0, p.x0, p.y0 * cosx);
                checkArgsCl(ctx.lineTo, 0, p.x1, p.y1 * cosx);
                checkArgsCl(ctx.lineTo, 1, p.x2, p.y2 * cosx);
                checkArgsCl(ctx.lineTo, 2, p.x3, p.y3 * cosx);
                checkArgsCl(ctx.lineTo, 3, p.x4, p.y4 * cosx);
                checkArgsCl(ctx.lineTo, 4, p.x5, p.y5 * cosx);
                checkArgsCl(ctx.lineTo, 5, p.x6, p.y6 * cosx);
                checkArgsCl(ctx.lineTo, 6, p.x7, p.y7 * cosx);
            });

            it("should rotate z and translate", function() {
                addImg('z=o25,30__' + rotz);
                checkArgsCl(ctx.moveTo, 0, p.x1 + xo, p.y1 + yo);
                checkArgsCl(ctx.lineTo, 0, p.x2 + xo, p.y2 + yo);
                checkArgsCl(ctx.lineTo, 1, p.x3 + xo, p.y3 + yo);
                checkArgsCl(ctx.lineTo, 2, p.x4 + xo, p.y4 + yo);
                checkArgsCl(ctx.lineTo, 3, p.x5 + xo, p.y5 + yo);
                checkArgsCl(ctx.lineTo, 4, p.x6 + xo, p.y6 + yo);
                checkArgsCl(ctx.lineTo, 5, p.x7 + xo, p.y7 + yo);
                checkArgsCl(ctx.lineTo, 6, p.x0 + xo, p.y0 + yo);
            });

        });


        describe("Multigon", function() {

            it("should close", function() {
                addImg('z=m-20,40_40,70_80,60_50,20');
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(3);
                expect(ctx.closePath).toHaveBeenCalledTimes(1);
                callOrder(ctx, ['moveTo', 'lineTo', 'lineTo', 'lineTo', 'closePath']);
            });

            it("should open", function() {
                addImg('z=M-20,40_40,70_80,60_50,20');
                expect(ctx.moveTo).toHaveBeenCalledTimes(1);
                expect(ctx.lineTo).toHaveBeenCalledTimes(3);
                expect(ctx.closePath).toHaveBeenCalledTimes(0);
                callOrder(ctx, ['moveTo', 'lineTo', 'lineTo', 'lineTo']);
            });

            it("should stroke", function() {
                addImg('z=m');
                expect(ctx.stroke).toHaveBeenCalledTimes(1);
            });

            it("should stroke color", function() {
                addImg('z=mr');
                expect(ctx.strokeStyle).toEqual(colors.r);
            });

            it("should fill", function() {
                addImg('z=mR');
                expect(ctx.fill).toHaveBeenCalledTimes(1);
            });

            it("should fill color", function() {
                addImg('z=mR');
                expect(ctx.fillStyle).toEqual(colors.r);
            });

        });

        describe("Text", function() {

            it("should draw", function() {
                addImg('z=x-Hello~~World');
                checkArgsEq(ctx.fillText, 0, 'Hello');
                checkArgsEq(ctx.fillText, 1, 'World');
            });

            it("should draw with capital", function() {
                addImg('z=X-Hello~~World');
                checkArgsEq(ctx.fillText, 0, 'Hello');
                checkArgsEq(ctx.fillText, 1, 'World');
            });

            it("should stroke color", function() {
                addImg('z=xr-Hello~~World');
                expect(ctx.fillStyle).toEqual(colors.r); // fill for downcase color
            });

            it("should fill color", function() {
                addImg('z=xR-Hello~~World');
                expect(ctx.strokeStyle).toEqual(colors.r); // stroke for upcase color
            });

            it("should call functions", function() {
                addImg('z=x25,30-Hello~~World');
                expect(ctx.translate).toHaveBeenCalledTimes(2);
                expect(ctx.fillText).toHaveBeenCalledTimes(2);
                callOrder(ctx, ['translate', 'fillText', 'fillText', 'translate']);
            });

            it("should translate", function() {
                addImg('z=x25,30-Hello~~World');
                expect(ctx.translate).toHaveBeenCalledTimes(2);
                checkArgsCl(ctx.translate, 0, 25, 30);
                checkArgsCl(ctx.translate, 1, -25, -30);
            });

            it("should rotate", function() {
                addImg('z=x__45-Hello~~World');
                expect(ctx.rotate).toHaveBeenCalledTimes(2);
                checkArgsCl(ctx.rotate, 0, toRad(45));
                checkArgsCl(ctx.rotate, 1, toRad(-45));
            });

            it("should decode", function() {
                addImg('z=x-This-is~~a-mini%2Dtest~~case.%7E');
                checkArgsEq(ctx.fillText, 0, 'This is');
                checkArgsEq(ctx.fillText, 1, 'a mini-test');
                checkArgsEq(ctx.fillText, 2, 'case.~');
            });
        });

    });

    describe("Colors", function() {
        var shapes = 'cltspheomx'.split('');
        var clrs = 'abcdefghijklmnopqrstuvwy';

        shapes.forEach(shp => {
            clrs.split('').forEach(c => {
                it("should set color " + c + " for  shape " + shp, function() {
                    const txt = (shp == 'x'? '-Hello' : '');
                    addImg('z=' + shp + '' + c + txt);
                    if (shp == 'x') {
                        expect(ctx.fillStyle).toEqual(colors[c]);
                    } else {
                        expect(ctx.strokeStyle).toEqual(colors[c]);
                    }
                });
            });
        });

        var upperClrs = clrs.toUpperCase();
        shapes.forEach(shp => {
            upperClrs.split('').forEach(c => {
                it("should set downcase color " + c.toLowerCase() + " for upcase color " + c, function() {
                    const txt = (shp == 'x'? '-Hello' : '');
                    addImg('z=' + shp + c + txt);
                    if (shp == 'l' || shp == 'x') {
                        expect(ctx.strokeStyle).toEqual(colors[c.toLowerCase()]);
                    } else {
                        expect(ctx.fillStyle).toEqual(colors[c.toLowerCase()]);
                    }
                });
            });
        });
    });

    describe("Linewidth", function() {
        var shapes = 'cltspheom'.split('');  // No 'x'; 'x' does not use 'lineWidth'
        var linewidths = 'abcdefghijklmnopqrstuvwxyz'.split('');
        shapes.forEach(shp => {
            linewidths.forEach((lw, i) => {
                it("should set linewidth " + lw + " for shape " + shp, function() {
                    addImg('z=' + shp + 'r70,90' + lw + '30');
                    expect(ctx.lineWidth).toEqual(i + 1);
                });
            });
        });
    });
});