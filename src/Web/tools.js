




let Utils = {
    Variables: {
    },
    /**
     * 
     * @param  {String} e 
     * @returns {HTMLElement|NodeList|null}
     */
    $: function (e) {
        return this.Try(() => {
            let _ = document.querySelectorAll(e);
            return _.length > 1 ? _ : _.length === 0 ? null : _[0];
        }, _ => {
            if (e.startsWith("#")) return document.getElementById(e.slice(1));
            return null;
        });
    },
    /**
     * 
     * @param {Function} Func 
     * @param {Function} Catch 
     * @returns {any}
     */
    Try: function (Func, Catch = _ => 0) {
        try {
            return Func();
        } catch (e) {
            return Catch(e);
        }
    },
    /**
 * 
 * @param {Function} Func 
 * @param {Function} Catch 
 * @returns {any}
 */
    TryAsync: async function (Func, Catch = _ => 0) {
        try {
            return await Func();
        } catch (e) {
            return await Catch(e);
        }
    },
    /**
     * 
     * @param {Number} ms 
     * @returns {Promise<void>}
     */
    Sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    TimeConverter: function (time) {
        let type = time.slice(-1).toLowerCase();
        let value = parseFloat(time.slice(0, -1));
        const times = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000
        }
        return value * (times[type] || 1);
    },
    /**
     * 
     * @param {Function} Condition 
     * @param {Number} Interval
     * @param {String|Number} TimeOut  
     * @returns {any}
     */
    WaitForCondition: async function (Condition, Interval = 10, TimeOut = "5m") {
        let out = null;
        let Start = Date.now();
        const Timeout = typeof TimeOut === "string" ? this.TimeConverter(TimeOut) : TimeOut;
        while (1) {
            out = Condition();
            if (out || Date.now() - Start > Timeout) break;
            await this.Sleep(Interval);
        }
        return out;
    },
    FormatDateTime: function (input) {
        const date = new Date(input);
        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            return date.toLocaleTimeString('en-GB');
        } else {
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')
                }/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')
                }`;
        }
    },
    HTML: {
        /**
         * 
         * @param {HTMLElement} parent 
         * @param {String} tagName 
         * @param {Object} attributes 
         * @returns {HTMLElement}
         */
        Add: function (parent, tagName, attributes) {
            let e = document.createElement(tagName);
            if (attributes?.first_child) parent.prepend(e);
            if (parent?.appendChild_) parent.appendChild_(e);
            else parent.appendChild(e);
            Object.entries(attributes).forEach(([k, v]) => {
                if (k.slice(0, 5) === "event") {
                    e.addEventListener(k.split("_")[1], v)
                } else switch (k) {
                    case "html":
                        e.innerHTML = v;
                        break;
                    case "text":
                        e.textContent = v;
                        break;
                    case "style":
                        if (typeof v == "object") Object.entries(v).forEach(([k_, v_]) => e.style[k_] = v_);
                        else if (typeof v == "string") e.style = v;
                        break;
                    default:
                        e.setAttribute(k, v);
                }
            });
            return e;
        },

        /**
         * 
         * @param {String} Text 
         * @param {DOMRect} Rect 
         * @returns {HTMLElement}
         */
        PopupBackgorund: function () {
            let b = this.Add(document.body, "div", {
                event_click: (e) => (e.target === b ? b.remove() : null),
                style: " position: fixed;z-index: 1300; inset: 0px; position: absolute;height: 100%;width: 100%;background: #ffffff1f;z-index: 9000;backdrop-filter: blur(10px);"
            })
            return b;
        },
        Tooltip: function (Text, Rect) {

            let Parent = this.Add(Utils.$("#root-page-mobile"), "div", {
                role: "tooltip",
                style: "position: absolute;inset: 0px auto auto 0px;margin: 0px;z-index: 1500;"
            })
            this.Add(Parent, "div", {
                html: Text,
                style: '    opacity: 1;    transform: none;    transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 133ms cubic-bezier(0.4, 0, 0.2, 1);    transform-origin: center top;    margin-top: 14px !important;    background-color: rgba(97, 97, 97, 0.92);    border-radius: 4px;    color: rgb(255, 255, 255);    font-family: "Open Sans", sans-serif;    padding: 4px 8px;    font-size: 0.6875rem;    max-width: 300px;    margin: 2px;    overflow-wrap: break-word;    font-weight: 500;            ',
            });

            let ParentBounds = Parent.getBoundingClientRect();

            Parent.style.transform = `translate(${Math.round(Rect.left + Rect.width / 2 - ParentBounds.width / 2)}px, ${window.scrollY + Rect.bottom}px)`;

            return Parent;
        },
        AddColorPicker: function (parent, txt, [type, outputType, value], func, otherColors = []) {
            Utils.Try(() => {
                function hslToCss(h, s, l) { return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)` }
                function rgbToCss(r, g, b, a) { return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${Math.round(a ?? 100)}%)` }
                function hexToRgba(hex) {
                    if (typeof hex !== 'string') return null;
                    hex = hex.trim().replace(/^#/, '');

                    if (![3, 4, 6, 8].includes(hex.length)) return null;
                    if (hex.length === 3 || hex.length === 4) {
                        hex = hex.split('').map(ch => ch + ch).join('');
                    }

                    const r = parseInt(hex.slice(0, 2), 16);
                    const g = parseInt(hex.slice(2, 4), 16);
                    const b = parseInt(hex.slice(4, 6), 16);
                    const a = (hex.length === 8) ? parseInt(hex.slice(6, 8), 16) * 100 / 255 : 100;

                    return [r, g, b, Number(a.toFixed(4))];
                }

                function rgbaToHex(rgba) {
                    var a,
                        rgb = rgba.slice(0, 3),
                        alpha = rgba[3],
                        hex =
                            (rgb[0] | 1 << 8).toString(16).slice(1) +
                            (rgb[1] | 1 << 8).toString(16).slice(1) +
                            (rgb[2] | 1 << 8).toString(16).slice(1);

                    if (alpha >= 0) a = alpha;
                    else a = 100;

                    if (a === 100) return hex;
                    a = ((a * 255 / 100) | 1 << 8).toString(16).slice(1)
                    hex = hex + a;

                    return hex;
                }
                function rgbToHsl(r, g, b) {
                    r /= 255; g /= 255; b /= 255;
                    const max = Math.max(r, g, b), min = Math.min(r, g, b);
                    let h, s, l = (max + min) / 2;
                    if (max === min) { h = s = 0; }
                    else {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                            case g: h = (b - r) / d + 2; break;
                            case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                    }
                    return [Math.round(h * 360), s, l];
                }

                function hslToRgb(h, s, l) {
                    // h in [0,1], s,l in [0,1]
                    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
                    let r, g, b;
                    if (s === 0) { r = g = b = l; }
                    else {
                        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                        const p = 2 * l - q;
                        r = hue2rgb(p, q, h + 1 / 3);
                        g = hue2rgb(p, q, h);
                        b = hue2rgb(p, q, h - 1 / 3);
                    }
                    return [r, g, b];
                }

                function rgbToHex(r, g, b) {
                    const to = v => v.toString(16).padStart(2, '0');
                    return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
                }


                let picker = null;
                let div = this.Add(parent, "div");
                div.className = "DivContainerTypeA";

                let hue = 210; // degrees
                let sat = 0.8; // 0..1
                let lig = 0.5; // 0..1

                if (!value) {
                    type = "hex";
                    value = "#fff";
                }

                let rgba = [128, 128, 128, 100];

                switch (type.toLowerCase()) {
                    case "hex":
                        rgba = hexToRgba(value)
                        break;
                    case "rgb":
                        rgba = [...value.slice(0, 3), 100];
                        break;
                    case "rgba":
                        rgba = [...value];
                        break;
                }

                [hue, sat, lig] = rgbToHsl(...rgba);


                let var01 = this.Add(top.document.body, "div", `
                position: fixed;
                height: 100%;
                width: 100%;
                z-index: 99999;
                top: 0;
                left: 0;
            `);

                var01.addEventListener("mousedown", (e) => {
                    if (e.target === var01) {
                        inputContainer.style.background = currentColorSwatch.style.background;
                        let output = [...rgba];
                        switch (outputType.toLowerCase()) {
                            case "hex":
                                output = "#" + rgbaToHex(output)
                                break;
                            case "rgb":
                                output = [...output.slice(0, 3), 100];
                                break;
                            case "rgba":
                                output = [...output];
                                break;
                        }
                        func(output);
                        var01.remove();
                        picker = null;
                    }
                });

                let var02 = this.Add(var01, "div", `
                left:${pos.x}px; top:${pos.y}px;
                position: absolute;
                height: 400px;
                width: 400px;
                background: var(--secondary-theme-color);
                border: 2px solid #0000003d;
                border-radius: 10px;
                display: flex;
            `);

                const CommonStyles = [
                    `overflow: hidden;position: relative;aspect-ratio: 2 / 1; border-radius: 10px;width: 80%; margin-bottom: 20px;`,
                    `font-family: VOID, sans-serif;color: var(--active-text-color);letter-spacing: 1px;font-size: 17px;font-weight: 100;`
                ];

                let var03 = this.Add(var02, "div", `width: 70%; height: 100%;`);
                let var04 = this.Add(var02, "div", `width: 30%; height: 100%;display: flex;flex-direction: column;align-items: center;justify-content: flex-start;`);

                let d = this.Add(var03, "div", CommonStyles[1] + "margin-top: 40px;margin-left: 25px;");
                d.textContent = txt;

                function AddSwatch(parent, style) {
                    let container = this.Add(parent, "div", CommonStyles[0]);
                    this.Add(container, "div", `  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  width: 100%;
  height: 100%;
  `);
                    return this.Add(container, "div", "position: absolute;top: 0;width: 100%;height: 100%;" + style);
                }

                d = this.Add(var04, "div", CommonStyles[1] + "margin-top: 40px;");
                d.textContent = "Current";
                let currentColorSwatch = AddSwatch(var04);
                d = this.Add(var04, "div", CommonStyles[1]);
                d.textContent = "Original";
                AddSwatch(var04, "background:" + rgbToCss(...rgba));


                let RSlider = AddSliderNumber(var04, "R", [0, 255, 1, rgba[0]], (e) => {
                    rgba[0] = e;
                    [hue, sat, lig] = rgbToHsl(...rgba);
                    drawAll();
                    updateUI();
                });
                let GSlider = AddSliderNumber(var04, "G", [0, 255, 1, rgba[1]], (e) => {
                    rgba[1] = e;
                    [hue, sat, lig] = rgbToHsl(...rgba);
                    drawAll();
                    updateUI();
                });
                let BSlider = AddSliderNumber(var04, "B", [0, 255, 1, rgba[2]], (e) => {
                    rgba[2] = e;
                    [hue, sat, lig] = rgbToHsl(...rgba);
                    drawAll();
                    updateUI();
                });
                let ASlider = AddSliderNumber(var04, "A", [0, 100, 1, rgba[3]], (e) => {
                    rgba[3] = e;
                    currentColorSwatch.style.background = rgbToCss(...rgba);
                });

                RSlider.style.marginBottom = "10px";
                GSlider.style.marginBottom = "10px";
                BSlider.style.marginBottom = "10px";
                ASlider.style.marginBottom = "10px";


                let var05 = this.Add(var03, "div", `width: 100%;position: relative;`);
                let canvas = this.Add(var05, "canvas", "width:100%; height:100%; display:block; border-radius:14px");
                let triHandle = this.Add(var05, "div", "pointer-events: none; position:absolute; width:20px; height:20px; margin:-6px 0 0 -6px; border-radius:50%; background:#fff;border: 2px solid white; box-shadow: 0px 0px 3px 4px #00000045;");
                let ringHandle = this.Add(var05, "div", `pointer-events: none; position:absolute; width:20px; height:20px; margin:-7px 0 0 -7px; border-radius:50%; background:#fff;border: 2px solid white; box-shadow: 0px 0px 3px 4px #00000045;`);


                const ctx = canvas.getContext('2d');



                let ringInner = 0, ringOuter = 0, triR = 0, center = { x: 0, y: 0 };
                let dragging = null; // 'ring' | 'tri' | null

                const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

                function setCanvasSize() {

                    const rect = canvas.parentElement.getBoundingClientRect();
                    const size = Math.floor(rect.width * DPR);
                    canvas.width = size;
                    canvas.height = size;
                    canvas.style.width = rect.width + 'px';
                    canvas.style.height = rect.width + 'px';

                    center = { x: size / 2, y: size / 2 };
                    const R = size * 0.44; // outer ring radius
                    ringOuter = R;
                    ringInner = R - Math.max(14 * DPR, size * 0.04);
                    triR = ringInner - 16 * DPR; // triangle circumradius

                    drawAll();
                    positionHandles();
                }

                const off = document.createElement('canvas');
                const offCtx = off.getContext('2d');

                function drawAll() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawHueRing();
                    drawTriangle();
                }

                function drawHueRing() {
                    const { x: cx, y: cy } = center;
                    // ring background
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, ringOuter, 0, Math.PI * 2);
                    ctx.arc(cx, cy, ringInner, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fillStyle = '#141a2b';
                    ctx.fill();

                    // gradient ring by sweeping
                    const steps = 360;
                    for (let a = 0; a < steps; a += .5) {
                        const ang0 = (a / steps) * Math.PI * 2;
                        const ang1 = ((a + 1) / steps) * Math.PI * 2;
                        ctx.beginPath();
                        ctx.arc(cx, cy, ringOuter, ang0, ang1);
                        ctx.arc(cx, cy, ringInner, ang1, ang0, true);
                        ctx.closePath();
                        ctx.fillStyle = `hsl(${a}, 100%, 50%)`;
                        ctx.fill();
                    }
                    // inner subtle stroke
                    /*
                    ctx.beginPath();
                    ctx.arc(cx, cy, ringInner, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0,0,0,.45)';
                    ctx.lineWidth = 1 * DPR;
                    ctx.stroke();
                    ctx.restore();
                    */
                }

                function triangleVertices(angle) {
                    const { x: cx, y: cy } = center;
                    const a = angle; // radians
                    const v0 = { x: cx + triR * Math.cos(a), y: cy + triR * Math.sin(a) }; // hue corner
                    const v1 = { x: cx + triR * Math.cos(a + 2 * Math.PI / 3), y: cy + triR * Math.sin(a + 2 * Math.PI / 3) }; // white
                    const v2 = { x: cx + triR * Math.cos(a + 4 * Math.PI / 3), y: cy + triR * Math.sin(a + 4 * Math.PI / 3) }; // black
                    return [v0, v1, v2];
                }

                function drawTriangle() {
                    const angle = hue * Math.PI / 180;
                    const [A, B, C] = triangleVertices(angle);

                    // prerender into offscreen for crispness & speed
                    off.width = Math.ceil(triR * 2 + 4);
                    off.height = Math.ceil(triR * 2 + 4);
                    const ox = off.width / 2, oy = off.height / 2;
                    offCtx.clearRect(0, 0, off.width, off.height);

                    // Map local triangle around (ox,oy)
                    const A2 = { x: ox + (A.x - center.x), y: oy + (A.y - center.y) };
                    const B2 = { x: ox + (B.x - center.x), y: oy + (B.y - center.y) };
                    const C2 = { x: ox + (C.x - center.x), y: oy + (C.y - center.y) };

                    // Bounding box
                    const minX = Math.floor(Math.min(A2.x, B2.x, C2.x));
                    const maxX = Math.ceil(Math.max(A2.x, B2.x, C2.x));
                    const minY = Math.floor(Math.min(A2.y, B2.y, C2.y));
                    const maxY = Math.ceil(Math.max(A2.y, B2.y, C2.y));

                    const img = offCtx.createImageData(off.width, off.height);
                    const data = img.data;

                    // Precompute for barycentric
                    const denom = ((B2.y - C2.y) * (A2.x - C2.x) + (C2.x - B2.x) * (A2.y - C2.y));

                    for (let y = minY; y <= maxY; y++) {
                        for (let x = minX; x <= maxX; x++) {
                            const w1 = ((B2.y - C2.y) * (x - C2.x) + (C2.x - B2.x) * (y - C2.y)) / denom; // A weight (u)
                            const w2 = ((C2.y - A2.y) * (x - C2.x) + (A2.x - C2.x) * (y - C2.y)) / denom; // B weight (v)
                            const w3 = 1 - w1 - w2; // C weight (w)

                            if (w1 >= -1e-3 && w2 >= -1e-3 && w3 >= -1e-3) { // inside or near edge
                                // Convert barycentric -> HSL
                                let u = Math.max(0, Math.min(1, w1));
                                let v = Math.max(0, Math.min(1, w2));
                                let w = Math.max(0, Math.min(1, w3));
                                const sum = u + v + w || 1;
                                u /= sum; v /= sum; w /= sum;

                                const S = u;                 // along hue corner
                                const L = 0.5 * u + 1.0 * v + 0.0 * w; // blend: hue corner 0.5, white 1, black 0

                                const [R, G, Bv] = hslToRgb(hue / 360, S, L);
                                const idx = (y * off.width + x) << 2;
                                data[idx] = Math.round(R * 255);
                                data[idx + 1] = Math.round(G * 255);
                                data[idx + 2] = Math.round(Bv * 255);
                                data[idx + 3] = 255;
                            }
                        }
                    }
                    offCtx.putImageData(img, 0, 0);

                    // Clip to triangle and draw
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(off, center.x - off.width / 2, center.y - off.height / 2);
                    ctx.restore();

                    // subtle edge
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath();
                    ctx.strokeStyle = 'rgba(0,0,0,.6)';
                    ctx.lineWidth = 1 * DPR;
                    ctx.stroke();
                }


                function updateUI() {
                    const [r, g, b] = hslToRgb(hue / 360, sat, lig).map(v => Math.round(v * 255));


                    //swatch.style.background = `rgb(${r} ${g} ${b})`;
                    //hslVal.value = `HSL(${Math.round(hue)}, ${Math.round(sat * 100)}%, ${Math.round(lig * 100)}%)`;
                    //hexVal.value = rgbToHex(r, g, b);
                    //hRange.value = hue;
                    //sRange.value = Math.round(sat * 100);
                    //lRange.value = Math.round(lig * 100);

                    rgba[0] = r;
                    rgba[1] = g;
                    rgba[2] = b;
                    RSlider.UpdateValue(r);
                    GSlider.UpdateValue(g);
                    BSlider.UpdateValue(b);


                    currentColorSwatch.style.background = rgbToCss(...rgba);
                    triHandle.style.background = hslToCss(hue, sat, lig);
                    ringHandle.style.background = hslToCss(hue, 1, .5);
                    positionHandles();
                }

                function positionHandles() {
                    // ring handle at current hue on inner/outer midline
                    const r = (ringInner + ringOuter) / 2;
                    const a = hue * Math.PI / 180;
                    const rx = center.x + r * Math.cos(a);
                    const ry = center.y + r * Math.sin(a);
                    ringHandle.style.left = (rx / DPR) + 'px';
                    ringHandle.style.top = (ry / DPR) + 'px';

                    // triangle handle using barycentric inverse: (S = u, L = 0.5u + v)
                    const [A, B, C] = triangleVertices(a);
                    // Solve for u,v given S=sat, L=lig
                    const u = Math.max(0, Math.min(1, sat));
                    let v = lig - 0.5 * u; v = Math.max(0, Math.min(1, v));
                    let w = 1 - u - v; if (w < 0) { // clamp into triangle
                        // push proportionally
                        const sum = u + v; u /= sum; v /= sum; w = 0;
                    }
                    const px = u * A.x + v * B.x + w * C.x;
                    const py = u * A.y + v * B.y + w * C.y;
                    triHandle.style.left = (px / DPR) + 'px';
                    triHandle.style.top = (py / DPR) + 'px';
                }

                function pointToHSL(px, py) {
                    const a = hue * Math.PI / 180;
                    const [A, B, C] = triangleVertices(a);
                    // barycentric relative to A,B,C
                    const denom = ((B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y));
                    let u = ((B.y - C.y) * (px - C.x) + (C.x - B.x) * (py - C.y)) / denom;
                    let v = ((C.y - A.y) * (px - C.x) + (A.x - C.x) * (py - C.y)) / denom;
                    let w = 1 - u - v;

                    // If outside, clamp to triangle
                    if (u < 0 || v < 0 || w < 0) {
                        // Project onto edges and pick closest
                        const P = { x: px, y: py };
                        const cl = closestPointOnTriangle(P, A, B, C);
                        px = cl.x; py = cl.y;
                        // recompute
                        u = ((B.y - C.y) * (px - C.x) + (C.x - B.x) * (py - C.y)) / denom;
                        v = ((C.y - A.y) * (px - C.x) + (A.x - C.x) * (py - C.y)) / denom;
                        w = 1 - u - v;
                    }

                    // clamp and renormalize
                    u = Math.max(0, Math.min(1, u));
                    v = Math.max(0, Math.min(1, v));
                    w = Math.max(0, Math.min(1, w));
                    const sum = u + v + w || 1; u /= sum; v /= sum; w /= sum;

                    const S = u;
                    const L = 0.5 * u + 1.0 * v + 0.0 * w;
                    return { h: hue, s: S, l: L };
                }

                function closestPointOnSegment(P, A, B) {
                    const ABx = B.x - A.x, ABy = B.y - A.y;
                    const APx = P.x - A.x, APy = P.y - A.y;
                    const t = Math.max(0, Math.min(1, (APx * ABx + APy * ABy) / (ABx * ABx + ABy * ABy)));
                    return { x: A.x + ABx * t, y: A.y + ABy * t, t };
                }
                function closestPointOnTriangle(P, A, B, C) {
                    const AB = closestPointOnSegment(P, A, B);
                    const BC = closestPointOnSegment(P, B, C);
                    const CA = closestPointOnSegment(P, C, A);
                    const dAB = (P.x - AB.x) ** 2 + (P.y - AB.y) ** 2;
                    const dBC = (P.x - BC.x) ** 2 + (P.y - BC.y) ** 2;
                    const dCA = (P.x - CA.x) ** 2 + (P.y - CA.y) ** 2;
                    if (dAB <= dBC && dAB <= dCA) return AB; else if (dBC <= dCA) return BC; else return CA;
                }

                function onPointerDown(e) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * DPR;
                    const y = (e.clientY - rect.top) * DPR;
                    const dx = x - center.x, dy = y - center.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist > ringInner && dist < ringOuter) { dragging = 'ring'; setHueFromPoint(x, y); }
                    else { dragging = 'tri'; setSLFromPoint(x, y); }

                    top.addEventListener('pointermove', onPointerMove);
                    top.addEventListener('pointerup', onPointerUp, { once: true });
                }
                function onPointerMove(e) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * DPR;
                    const y = (e.clientY - rect.top) * DPR;
                    if (dragging === 'ring') setHueFromPoint(x, y);
                    else if (dragging === 'tri') setSLFromPoint(x, y);
                }
                function onPointerUp() { dragging = null; top.removeEventListener('pointermove', onPointerMove); }

                function setHueFromPoint(x, y) {
                    const a = Math.atan2(y - center.y, x - center.x);
                    hue = (a * 180 / Math.PI + 360) % 360;
                    drawAll();
                    updateUI();
                }
                function setSLFromPoint(x, y) {
                    const res = pointToHSL(x, y);
                    sat = res.s; lig = Math.max(0, Math.min(1, res.l));
                    updateUI();
                }

                // Range inputs
                //hRange.addEventListener('input', e => { hue = +e.target.value; drawAll(); updateUI(); });
                //sRange.addEventListener('input', e => { sat = (+e.target.value) / 100; updateUI(); });
                //lRange.addEventListener('input', e => { lig = (+e.target.value) / 100; updateUI(); });

                canvas.addEventListener('pointerdown', onPointerDown);

                top.addEventListener('resize', setCanvasSize);

                // init
                setCanvasSize();
                updateUI();

                return var01;

            }, (e) => {
                Utils.Log("Error", "AddColorPicker", e);
            })
        }
    },
    /**
     * 
     * @param {"Info" | "Warn" | "Error"} type 
     * @param {String} ModuleName 
     * @param  {...any} msg 
     */
    Log: function (type = "Info", ModuleName, ...msg) {
        const colors = {
            Info: "#53eb23",
            Warn: "#ebe723",
            Error: "#eb4823"
        };
        const color = colors[type] || colors.Info;
        const moduleColor = "#23a6eb";
        this.log(`%c Modulr %c ${ModuleName} `,
            `font-weight: bolder;color:${color};border-radius:5px;border:2px solid ${color};margin-right:3px;`,
            `font-weight: bolder;color:${moduleColor};border-radius:5px;border:1px solid ${moduleColor};`,
            ...msg);
    },
    LocalStorageManager: {
        Data: {},
        KEY: "Modulr-LocalStorage-Manager-Key",
        Initialize: function () {
            let stored = window.localStorage.getItem(this.KEY);
            if (!stored) return false;
            JSON.parse(`[${stored}]`).forEach(key => {
                this.Data[key] = this.StringToValue(window.localStorage.getItem(key));
            });
            return true;
        },
        Add: function (Key, Value) {
            this.Data[Key] = Value;
            this.SaveAll();
        },
        Get: function (Key) {
            return this.Data[Key];
        },
        Remove: function (Key) {
            delete this.Data[Key];
            this.SaveAll();
        },

        SaveAll: function () {
            Object.entries(this.Data).forEach(([k, v]) => {
                window.localStorage.setItem(k, this.ValueToString(v));
            });
            window.localStorage.setItem(this.KEY, JSON.stringify(Object.keys(this.Data)).slice(1, -1));
        },
        ClearAll: function () {
            let stored = window.localStorage.getItem(this.KEY);
            if (!stored) return false;
            JSON.parse(`[${stored}]`).forEach(key => window.localStorage.removeItem(key));
            window.localStorage.removeItem(this.KEY);
            return true;
        },
        ValueToString: function (Value) {
            switch (typeof Value) {
                case "boolean": return (Value ? 1 : 0) + "b";
                case "object": return JSON.stringify(Value) + "o";
                case "string": return Value + "s";
                case "number": return Value + "n";
            }
        },
        StringToValue: function (Str) {
            switch (Str.slice(-1)) {
                case "b": return !!parseInt(Str.slice(0, -1));
                case "o": return JSON.parse(Str.slice(0, -1));
                case "s": return Str.slice(0, -1);
                case "n": return Number(Str.slice(0, -1));
            }
        }
    },
    /** @type {"Dark"|"Light"} */
    get theme() {
        let theme = this.LocalStorageManager.Get("modulr-current-theme");
        if (theme) return theme;
        return this.Try(_ => window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light", _ => "dark");
    },
    /** @type {"Function"} */
    get log() {
        return (console?.log_ ? console.log_ : console.log);
    },
}




let Plugins = {
    Add: function (ModuleName, Initialize) {
        this[ModuleName] = {
            ModuleName,
            Initialized: false,
            Initialize: function () {
                if (this.Initialized) return;
                Initialize.bind(this)(arguments);
                Utils.Log("Info", this.ModuleName, "Initialized.")
                this.Initialized = true;
            }
        }
        return this[ModuleName];
    }
}

Utils.LocalStorageManager.Initialize();

Plugins.Add("ConsoleLogEnhancer", function () {
    console.log_ = console.log;
    console.log = function () { }
}).Initialize();

Plugins.Add("CustomBackground", async function () {
    const body = await Utils.WaitForCondition(_ => Utils.$("#content"));

    let colors = [
        Utils.LocalStorageManager.Get("modulr-primary-background-color") || "#70A288",
        Utils.LocalStorageManager.Get("modulr-secondary-background-color") || "#04395E"
    ];

    const background = Utils.HTML.Add(body, "div", {
        id: "modulr-background",
        style: {
            position: 'fixed',
            height: '100%',
            width: '100%',
            zIndex: '-100',
            backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
        }
        /*
        html:`
        <video autoplay muted loop playsinline style="width:100%">
          <source src="/modulr-wallpaper/exemple.mp4" type="video/mp4">
        </video>
        `,
        */ //add wallpaper
    });
    background.colors = colors;
    background.setColor = function (...colors) {
        background.colors[0] = colors[0] || background.colors[0];
        background.colors[1] = colors[1] || background.colors[1];
        background.style.backgroundImage = `linear-gradient(135deg, ${background.colors[0]}, ${background.colors[1]})`
    }

    Utils.Variables.Background = background;
}).Initialize();

Plugins.Add("ThemeController", async function () {
    Utils.HTML.Add(document.head, "script", {
        src: "/Coloris/min.js",
        event_load: function () {
            Utils.HTML.Add(document.head, "link", {
                href: "/Coloris/min.css", rel: "stylesheet", event_load: function () {
                    Coloris({
                        theme: 'pill',
                        themeMode: 'dark',
                        format: 'hex',
                        swatches: [
                            'DarkSlateGray',
                            '#2a9d8f',
                            '#e9c46a',
                            'coral',
                            'rgb(231, 111, 81)',
                            'Crimson',
                            '#023e8a',
                            '#0077b6',
                            'hsl(194, 100%, 39%)',
                            '#00b4d8',
                            '#48cae4'
                        ],
                        onChange: (color, inputEl) => {
                            console.log_(inputEl.id);
                            if (inputEl.id === "primary") {
                                window.MODULR_.Utils.LocalStorageManager.Add("modulr-primary-background-color", color);
                                Utils.Variables.Background.setColor(color);
                            } else if (inputEl.id === "secondary") {
                                window.MODULR_.Utils.LocalStorageManager.Add("modulr-secondary-background-color", color);
                                Utils.Variables.Background.setColor(null, color);
                            }
                        }
                    });
                }
            });
        }
    });
    Utils.HTML.Add(document.head, "link", { href: "/Coloris/min.css", rel: "stylesheet" });

    document.documentElement.style.setProperty('--modulr-current-theme', `var(--modulr-${Utils.theme}-theme)`);

}).Initialize();


window.MODULR_ = {
    Utils,
    Plugins,
};

