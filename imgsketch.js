var imgSketch = (function() {

    function isMultigon(ch) {
        return ch.toLowerCase() == 'm';
    }

    function isCircle(ch) {
        return ch.toLowerCase() == 'c';
    }

    function isLine(ch) {
        return ch.toLowerCase() == 'l';
    }

    function isText(ch) {
        return ch.toLowerCase() == 'x';
    }

    function isUpper(ch) {
        return (/[A-Z]/).test(ch);
    };

    function isAlpha(ch) {
        return (/[a-zA-Z]/).test(ch);
    }

    function isDash(ch) {
        return ch == '-';
    }

    function toRad(deg) {
        return deg * Math.PI / 180;
    }

    function isOpenPoly(p) {
        return isUpper(p.kind);
    }

    function isFill(ch) {
        return isUpper(ch);
    }

    function isPiePoly(p) {
        return (p.arc && isCircle(p.kind) && !isOpenPoly(p));
    }

    // function rotateX(pt, r) {
    //     return {
    //         x: pt.x,
    //         y: pt.y * Math.cos(r) - pt.z * Math.sin(r),
    //         z: pt.y * Math.sin(r) + pt.z * Math.cos(r)
    //     };
    // }
    // 
    // function rotateY(pt, r) {
    //     return {
    //         x: pt.x * Math.cos(r) + pt.z * Math.sin(r),
    //         y: pt.y,
    //         z: pt.z * Math.cos(r) - pt.x * Math.sin(r)
    //     };
    // }
    // 
    // function rotateZ(pt, r) {
    //     return {
    //         x: pt.x * Math.cos(r) - pt.y * Math.sin(r),
    //         y: pt.y * Math.cos(r) + pt.x * Math.sin(r),
    //         z: pt.z
    //     };
    // }

    function rotateX(pt, r) {
        return {
            x: pt.x,
            y: pt.y * Math.cos(r) - pt.z * Math.sin(r),
            z: 0
        };
    }

    function rotateY(pt, r) {
        return {
            x: pt.x * Math.cos(r) + pt.z * Math.sin(r),
            y: pt.y,
            z: 0
        };
    }

    function rotateZ(pt, r) {
        return {
            x: pt.x * Math.cos(r) - pt.y * Math.sin(r),
            y: pt.y * Math.cos(r) + pt.x * Math.sin(r),
            z: 0
        };
    }

    function rotate(pt, rotate) {
        // return rotateX(rotateY(rotateZ(pt, rotate.z), rotate.y), rotate.x);
        return rotateZ(rotateY(rotateX(pt, rotate.x), rotate.y), rotate.z);
    }

    function translate(pt, offs) {
        return {
            x: pt.x + offs.x,
            y: pt.y + offs.y,
            z: pt.z
        };
    }

    function reloadPage() {
        window.location.reload();
    }

    function parse2Int(s) {
        var p = (s || '').split(',');
        return {
            a: Number(p[0]) || 0,
            b: Number(p[1]) || 0,
            c: Number(p[2]) || 0
        };
    }

    function decodeText(s) {
        return s.split('~~').map(l => l.replace(/-/g, '%20')).map(decodeURIComponent);
    }

    function encodeText(ary) {
        return ary.map(encodeURIComponent).map(l => l.replace(/~/g, '%7E')).map(l => l.replace(/-/g, '%2D')).join('~~');
    }

    function parseOffset(s) {
        var a = parse2Int(s);
        return {
            x: a.a,
            y: a.b,
            z: 0
        };
    }

    function parseArc(s) {
        var a = parse2Int(s);
        return {
            beg: toRad(a.a),
            end: toRad(a.b || 360)
        }
    }

    function parseRot(s) {
        var d = parse2Int(s);
        return {
            z: toRad(d.a),
            y: toRad(d.b),
            x: toRad(d.c)
        };
    }

    function parseFamily(s) {
        return (s == 'm' ? 'monospace' : (s == 's' ? 'serif' : 'sans-serif'));
    }

    function parseDim(qp) {
        var d = parse2Int(getVal(qp, 'dim'));
        return {
            w: d.a,
            h: d.b || d.a
        };
    }

    function getAry(qp, key) {
        return (qp[key] ? qp[key] : []);
    }

    function getVal(qp, key) {
        return getAry(qp, key)[0] || ''
    }

    function toLineWidth(ch, lw) {
        var val = lw || 3;
        if (isAlpha(ch)) {
            val = ch.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
        }
        return Math.abs(val);
    }

    function preOp(ctx, p) {
        ctx.translate(p.offset.x, p.offset.y);
        ctx.rotate(p.rotate.z);
    }

    function postOp(ctx, p) {
        ctx.rotate(-p.rotate.z);
        ctx.translate(-p.offset.x, -p.offset.y);
    }

    function toColor(s, d) {
        return (s.length > 1 ? s : (d[s.toLowerCase()] ? d[s.toLowerCase()] : '000000'));
    }

    function chAt(s, i) {
        return s.substring(i, i + 1);
    }

    function commaAt(s, i) {
        return i + (s.substring(i).match(/^[,]/) || [''])[0].length;
    }

    function num1At(s, i) {
        return i + (s.substring(i).match(/^[-]?\d+[.]?\d*/) || [''])[0].length;
    }

    function num2At(s, i) {
        const a = num1At(s, i);
        const b = commaAt(s, a);
        return (a == b ? b : num1At(s, b));
    }

    function num3At(s, i) {
        const a = num1At(s, i);
        const b = commaAt(s, a);
        if (a == b) return b;
        const c = num1At(s, b);
        const d = commaAt(s, c);
        return (c == d ? d : num1At(s, d));
    }

    function sideLength(circum_radius, sides) {
        return 2 * circum_radius * Math.sin(Math.PI / sides);
    }


    function parseColorDict(s, dct) {
        var d = Object.assign({}, dct);
        s.split(',').forEach((v, i) => {
            if (v) d[String.fromCharCode((i % 26) + 97)] = ('000000' + ((parseInt(v, 16) || '999999').toString(16))).slice(-6);
        });
        return d;
    }

    function calcCoords(r, sides, txt) {
        var ary = [];
        if (sides == 2) { // circle
            ary.push({
                x: r,
                y: 0,
                z: 0
            });
            ary.push({
                x: -r,
                y: 0,
                z: 0
            });
        } else if (sides) { // other polygons
            var incr = toRad(360.0 / sides);
            for (var i = 0; i < sides; i++) {
                ary.push({
                    x: r * Math.cos(i * incr),
                    y: r * Math.sin(i * incr),
                    z: 0
                });
            }
            ary = ary.map(pt => rotateZ(pt, (Math.PI - incr) / 2));
        } else { // multigon
            txt.split('_').forEach(xy => {
                var co = xy.split(',');
                ary.push({
                    x: parseInt(co[0]),
                    y: parseInt(co[1]),
                    z: 0
                });
            });
        }
        return ary;
    }


    function drawPgonShape(ctx, pgon) {
        var pts = pgon.coords;
        ctx.beginPath();
        if (pts.length == 1) {
            var beg = 0;
            var end = 2 * Math.PI;
            if (pgon.arc) {
                pgon.arc = parseArc(pgon.arc);
                if (isPiePoly(pgon)) {
                    ctx.moveTo(pts[0].x, pts[0].y);
                }
                beg = pgon.arc.beg;
                end = pgon.arc.end;
            }
            if (pgon.rotate.x || pgon.rotate.y || pgon.rotate.z) {
                var r1 = rotate({
                    x: pgon.size,
                    y: 0,
                    z: 0
                }, {
                    x: pgon.rotate.x,
                    y: pgon.rotate.y,
                    z: 0
                });
                var r2 = rotate({
                    x: 0,
                    y: pgon.size,
                    z: 0
                }, {
                    x: pgon.rotate.x,
                    y: pgon.rotate.y,
                    z: 0
                });
                preOp(ctx, pgon);
                ctx.ellipse(0, 0, r1.x, r2.y, 0, beg, end);
                postOp(ctx, pgon);
            } else {
                ctx.arc(pgon.offset.x, pgon.offset.y, pgon.size, beg, end);
            }
        } else {
            ctx.moveTo(pts[0].x, pts[0].y);
            pts.slice(1).forEach(pt => {
                ctx.lineTo(pt.x, pt.y)
            });
        }
        if (isPiePoly(pgon) || (!isOpenPoly(pgon) && (pgon.sides > 1 || isMultigon(pgon.kind)))) {
            ctx.closePath();
        }

        if (pgon.fill && !isLine(pgon.kind)) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    function drawPgonText(ctx, pgon, fam) {
        ctx.font = pgon.size + 'px ' + pgon.textFamily;
        var x = -pgon.textMetrics.maxWidth / 2;
        var y= pgon.textMetrics.lineHeight - (pgon.textMetrics.lineHeight * pgon.textLines.length / 2);
        preOp(ctx, pgon);
        pgon.textLines.forEach(line => {
            if (pgon.fill) {
                ctx.fillText(line, x, y);
            } else {
                ctx.strokeText(line, x, y);
            }
            y += pgon.textMetrics.lineHeight;
        });
        postOp(ctx, pgon);
    }


    function drawPgon(ctx, p, opts) {
        var colr = p.color || opts.color;
        var color = p.forceColor || toColor(colr, opts.colorDict);
        if (p.fill) {
            ctx.fillStyle = '#' + color;
        } else {
            ctx.strokeStyle = '#' + color;
        }
        ctx.lineWidth = toLineWidth(p.linewidth, opts.linewidth);
        if (p.text) {
            drawPgonText(ctx, p, opts.family);
        } else {
            drawPgonShape(ctx, p);
        }
    }





    function fields(s) {
      var d = {
            kind: chAt(s, 0),
            color: '',
            offset: '',
            linewidth: '',
            size: '',
            flags: '',
            rotate: '',
            family: '',
            extra: '',
        };
        var i = 1;
        var colr = chAt(s, i);
        if (!isDash(colr)) {
            d.color = ((isAlpha(colr)) ? colr : '');
            i += d.color.length;
            d.offset = s.substring(i, num2At(s, i));
            i += d.offset.length;
            var linew = chAt(s, i);
            if (!isDash(linew)) {
                d.linewidth = linew;
                i += d.linewidth.length;
                if (!isDash(chAt(s, i))) {
                    d.size = s.substring(i, num1At(s, i));
                    i += d.size.length;
                    var flags = chAt(s, i);
                    if (!isDash(flags)) {
                        d.flags = flags;
                        i += d.flags.length;
                        d.rotate = s.substring(i, num3At(s, i));
                        i += d.rotate.length;
                        var fam = chAt(s, i);
                        if (!isDash(fam)) {
                            d.family = fam;
                        }
                    }
                }
            }
        }
        d.extra = s.substring(i + 1);
        return d;
    }


    function parseSides(ch) {
        switch (ch.toLowerCase()) {
            case 'c':
                return 1;
            case 'l':
                return 2;
            case 't':
                return 3;
            case 's':
                return 4;
            case 'p':
                return 5;
            case 'h':
                return 6;
            case 'e':
                return 7;
            case 'o':
                return 8;
            default:
                return 0; // x, m, other
        }
    }

    function parsePolygon(f, polysz) {
        var sid = parseSides(f.kind);
        var hgt = parseInt(f.size) || polysz || 40;
        // r = Inscribed circle radius
        // R = Circumscribed circle radius
        // n = Number of sides of polygon
        // h = height of polygon
        // r = R * cos(PI/n)
        //   For odd-sided polygons, h = R + r
        //   For even-sided polygons , h = 2 * r
        var mcos = Math.cos(Math.PI / sid);
        var denom = ((sid == 1 || sid == 2) ? 2 : ((sid % 2) ? (mcos + 1) : (2 * mcos)));
        var siz = hgt / denom;
        return {
            coords: calcCoords(siz, sid, f.extra),
            fill: (isLine(f.kind) ? false : (isAlpha(f.color) ? isFill(f.color) : undefined)),
            sides: sid,
            size: siz,
        };
    }

    function parseText(f, textsz, fam) {
        var attr = {
            coords: [],
            family: f.family,
            fill: !isFill(f.color), // For text, fill semantics are reversed
            sides: 0,
            size: parseInt(f.size) || textsz || 20,
            text: f.extra,
        };
        attr.textLines = decodeText(attr.text) || '';
        attr.textFamily = parseFamily(attr.family || fam);
        return attr;
    }


    function parseZ(str, opts, forceColor) {
        const scl = num1At(str, 0);
        var f = fields(str.substring(scl));
        var p = (isText(f.kind) ? parseText(f, opts.textsize, opts.family) : parsePolygon(f, opts.polysize));
        p.scale = (scl > 0 ? Number(str.substring(0, scl)) : 1);
        p.kind = f.kind;
        p.color = f.color;
        p.offset = parseOffset(f.offset);
        p.linewidth = f.linewidth;
        p.rotate = parseRot(f.rotate);
        if (forceColor) {
            p.forceColor = forceColor;
        }
        if (isLine(p.kind) && p.color) {
            p.color = p.color.toLowerCase();
        }
        if (isCircle(f.kind)) {
            p.arc = f.extra;
        }
        scalePgon(p);
        scaleImg(p, opts.scaleImg);
        if (isText(f.kind)) {
            p.textMetrics = calcTextMetrics(p.size, p.textFamily, opts.textheight, p.textLines);
            if (opts.palette || opts.help) {
                p.offset.x += p.textMetrics.maxWidth / 2;
                p.offset.y += (p.textMetrics.lineHeight * p.textLines.length) / 2;
            }
        }
        p.coords = (isCircle(p.kind) ? [{
            x: p.offset.x,
            y: p.offset.y,
            z: 0
        }] : p.coords.map(aa => rotate(aa, p.rotate))
                     .map(bb => translate(bb, p.offset)));

        return p;
    }

    function parseQueryParams(str) {
        var dct = {};
        str.split("&").forEach(str => {
            var kv = str.split("=");
            if (!dct[kv[0]]) dct[kv[0]] = [];
            dct[kv[0]].push(kv[1]);
        });
        return dct;
    }


    function calcTextMetrics(sz, fam, textheight, aryTxt) {
        var metrics = {
            lineHeight: 0,
            maxWidth: 0,
        };
        var body = document.getElementsByTagName('body')[0];
        var div = document.createElement('div');
        div.innerHTML = 'X';
        div.style.position = 'absolute';
        div.style.top = 0;
        div.style.left = '-999px';
        div.style.padding = 0;
        div.style.font = sz + 'px ' + fam;
        div.style.lineHeight = textheight;
        body.appendChild(div);
        metrics.lineHeight = div.offsetHeight;
        aryTxt.forEach(txt => {
            div.innerHTML = txt.replace(/ /g, '&nbsp;')
            if (div.offsetWidth > metrics.maxWidth) {
                metrics.maxWidth = div.offsetWidth;
            }
        });
        body.removeChild(div);
        return metrics;
    }

    function generatePalette(opts) {
        var pgons = [];
        var wid = opts.polysize || 100;
        var txtsiz = opts.textsize || 30;
        var colorKeys = (opts.palette == 2 ? 'roygbvwpank'.split('') : Object.keys(opts.colorDict).sort());
        opts.dim = {
            w: wid * 6 + 2 * opts.pad,
            h: wid * (Math.ceil(colorKeys.length / 6)) + 2 * opts.pad
        };
        colorKeys.forEach((ch, i) => {
            var h = parseInt(wid / 2);
            var x = parseInt(i * wid % (6 * wid) + h);
            var y = parseInt(Math.floor(i / 6) * wid + h);

            pgons.push(parseZ('s' + ch.toUpperCase() + x + ',' + y + '_' + wid, opts, null));
            x -= h;
            y -= h;
            pgons.push(parseZ('x' + x + ',' + y + '_'+txtsiz+'_m' + ch, opts, '000000'));
            pgons.push(parseZ('x' + x + ',' + y + '_'+txtsiz+'_m-' + ch, opts, 'FFFFFF'));
        });
        return pgons;
    }


    function generateHelp(opts) {
        pgons = [];
        var helpText = encodeText([
            "Parameters:",
            "  bg=[a-z]           Background color",
            "  color=[a-z]        Drawing color",
            "  colord=000000,...  Define colors for color dict",
            "  cxz=000000,000000  Specify colors for 'x' and 'z'",
            "  dim=x,y            Image dimensions; y is optional",
            "  family=[m,n,s]     Text family",
            "  help=1             Show this help",
            "  linewidth=[a-z]    Linewidth of shapes",
            "  pad=n              Padding",
            "  palette=[1,2]      Show full or simple color palette",
            "  polysize=n         Size of polygons",
            "  reload=n           Auto-reload page after n seconds",
            "  scaleimg=n         Scale whole image",
            "  textheight=n       Height of text line",
            "  textsize=n         Size of text",
            "  z=...              Z-Fields",
            "  zN=...             Z-Field layer; N must be 1-9",
            "",
            "Z-Fields: Scale Shape Color Offset Linewidth Size Flag Rotate Family Extra",
            "      Scale: n",
            "      Shape: c,l,t,s,p,h,e,o,x,m (Capitalize for open polygon)",
            "      Color: a-z (Capitalize to fill shape)",
            "     Offset: x,y",
            "  Linewidth: a-z,_",
            "       Size: n",
            "       Flag: _",
            "     Rotate: z,y,x (Degrees)",
            "     Family: m,n,s,_ (Monospace, Sans-serif, Serif, Default)",
            "      Extra: Arc OR XYPoints OR Text",
            "Arc is 'begin,end' in degrees",
            "XYPoints is 'x1,y1_x2,y2_...'",
            "For Text, '~~' is newline, '-' is space, '%nn' is ASCII char",
            "For Shape 'c', 'm', or 'x', skip to Extra with '-'",
            "",
            "Examples:",
            " tR5,2b70_9      R=Red fill; 5,2=offset; b=linewidth(2); 70=size; 9=rotate",
            " x4,9-Hi~~World  4,9=offset; -=Skip to Extra; Hi~~World=text",
            " x8,9__sHello    8,9=offset; s=Serif; Hello=text",
            " c9,7_30-45,99   9,7=offset; 30=size; -=Skip to Extra; 45,99=arc",
            "", // Blank line to prevent image border from obscuring last line of text.
        ]);
        pgons.push(parseZ('x0,0__m' + helpText, opts, null));
        return pgons;
    }

    function setDims(canv, pgons, dim, pad, scaleimg) {
        pad = pad || 0;
        if (dim.w) {
            if (scaleimg && scaleimg != 1) {
                dim.w *= scaleimg;
                dim.h *= scaleimg;
            }
        } else {
            var max = {
                x: 0,
                y: 0
            };
            pgons.forEach(p => {
                if (isCircle(p.kind)) {
                    if (p.offset.x + p.size > max.x) max.x = p.offset.x + p.size;
                    if (p.offset.y + p.size > max.y) max.y = p.offset.y + p.size;
                } else if (isText(p.kind)) {
                    var pt = {
                        x: p.textMetrics.maxWidth/2,
                        y: -(p.textMetrics.lineHeight * p.textLines.length)/2,
                        z: 0,
                    }
                    var p1 = rotateZ(pt, p.rotate.z);
                    pt.y = -pt.y;
                    var p2 = rotateZ(pt, p.rotate.z);

                    p1.x = Math.abs(p1.x);
                    p1.y = Math.abs(p1.y);
                    p2.x = Math.abs(p2.x);
                    p2.y = Math.abs(p2.y);

                    var xval = p.offset.x + Math.max(p1.x, p2.x);
                    if (xval > max.x) {
                        max.x = xval;
                    }

                    var yval = p.offset.y + Math.max(p1.y, p2.y);
                    if (yval > max.y) {
                        max.y = yval;
                    }
                } else {
                    p.coords.forEach(coord => {
                        if (coord.x > max.x) max.x = coord.x;
                        if (coord.y > max.y) max.y = coord.y;
                    });
                }
            });
            dim = {
                w: max.x + pad,
                h: max.y + pad
            };
        }

        canv.setAttribute("width", dim.w || 1);
        canv.setAttribute("height", dim.h || 1);
    }


    function readPgons(qp, opts) {
        var pgons = [];
        for (var i = 0; i < 10; i++) {
            getAry(qp, 'z' + (i == 0 ? '' : i)).forEach(str => {
                var p = parseZ(str, opts, null);
                if (p.coords.length || p.text) pgons.push(p);
            });
        }
        return pgons;
    }

    function setBackground(canv, color) {
        if (color) {
            var ctx = canv.getContext('2d');
            ctx.fillStyle = '#' + color;
            ctx.fillRect(0, 0, canv.width, canv.height);
        }
    }

    function drawPgons(canv, pgons, opts) {
        var ctx = canv.getContext('2d');
        pgons.forEach(p => drawPgon(ctx, p, opts));
    }


    function setCxzd(cxzd, colord) {
        if (cxzd['a']) colord['x'] = cxzd['a'];
        if (cxzd['b']) colord['z'] = cxzd['b'];
    }

    function populateOptions(qp, colorDct) {
        return {
            bg: getVal(qp, 'bg') || 'w',
            color: getVal(qp, 'color'),
            colorDict: parseColorDict(getVal(qp, 'colord'), colorDct),
            cxzDict: parseColorDict(getVal(qp, 'cxz'), {}),
            dim: parseDim(qp),
            family: getVal(qp, 'family'),
            help: parseInt(getVal(qp, 'help')),
            linewidth: getVal(qp, 'linewidth'),
            pad: parseInt(getVal(qp, 'pad')),
            palette: parseInt(getVal(qp, 'palette')),
            polysize: parseInt(getVal(qp, 'polysize')),
            //secs: (parseInt(getVal(qp, 'reload')) || 0) * 1000,
            secs: Math.abs(Number(getVal(qp, 'reload')) || 0) * 1000,
            scaleImg: (Number(getVal(qp, 'scaleimg')) || 0),
            textheight: getVal(qp, 'textheight'),
            textsize: parseInt(getVal(qp, 'textsize')),
        };
    }

    function drawImg(canv, parmStr) {

        var crayola24mod = {
            'a': '8B8680',
            'b': '4F69C6',
            'c': '6456B7',
            'd': 'FF8833',
            'e': 'FFAE42',
            'f': 'FED85D',
            'g': '01A638',
            'h': 'F1E788',
            'i': 'C5E17A',
            'j': '0095B7',
            'k': '000000',
            'l': '02A4D3',
            'm': 'FD0E35',
            'n': 'AF593E',
            'o': 'FF681F',
            'p': 'FFA6C9',
            'q': 'BB3385',
            'r': 'ED0A3F',
            's': 'F7468A',
            't': '0066FF',
            'u': 'FDD5B1',
            'v': '8359A3',
            'w': 'FFFFFF',
            'y': 'FBE870',
        };

        var qp = parseQueryParams(parmStr);
        var opts = populateOptions(qp, crayola24mod);
        if (opts.cxzDict) {
            setCxzd(opts.cxzDict, opts.colorDict);
        }

        var pgons = [];
        if (opts.help) {
            pgons = generateHelp(opts);
        } else if (opts.palette) {
            pgons = generatePalette(opts);
        } else {
            pgons = readPgons(qp, opts);
        }
        addPadding(pgons, opts.pad);
        setDims(canv, pgons, opts.dim, opts.pad, opts.scaleImg);
        setBackground(canv, toColor(opts.bg, opts.colorDict));
        drawPgons(canv, pgons, opts);
        if (opts.secs) {
            setTimeout(reloadPage, opts.secs);
        }
    }

    function scaleImg(p, n) {
        if (n && n != 1) {
            _scalePgon(p, n);
            p.offset.x *= n;
            p.offset.y *= n;
        }
    }

    function scalePgon(p) {
        _scalePgon(p, p.scale);
    }

    function _scalePgon(p, n) {
        if (n && n != 1) {
            p.coords.forEach(c => {
                c.x *= n;
                c.y *= n;
            });
           if (isCircle(p.kind) || isText(p.kind)) {
              p.size *= n;
            }
         }
    }

    function addPadding(pgons, padding) {
        var pad = padding || 0;
        pgons.forEach(p => {
            p.coords.forEach(c => {
                c.x += pad;
                c.y += pad;
            });
            p.offset.x += pad;
            p.offset.y += pad;
        });
    }

    function init(sel, attr) {
        var cssSel = sel || 'pgon';
        var imgAttr = attr || 'data-src';
        document.querySelectorAll('img.'+cssSel).forEach(elem => {
            var canvas = document.createElement("canvas");
            const attrVal = (elem.hasAttribute(imgAttr) ? elem.getAttribute(imgAttr) : elem.getAttribute('src'));
            if (attrVal) {
                drawImg(canvas, attrVal.split('?')[1] || '');
                elem.src = canvas.toDataURL("image/png");
            }
        });
    }

    return {
        init: init,
    }
})();