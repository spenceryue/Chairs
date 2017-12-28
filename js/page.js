// Initialization script at bottom


// Global variables, constants
var SCALE = 1,
	BASEW,
	BASEH,
	SLDR1,
	IN1,
	VIEW,
	XFORM,
	SIZE,
	POSITION,
	NAV;


// Global functions, objects
function getGlobals() {
	getBounds();
	SLDR1 = document.querySelector('.SLDR1');
	IN1 = document.querySelector('.IN1');
	VIEW = document.querySelector('.map-viewbox');
	XFORM = document.querySelector('.map-transform');
	SIZE = document.querySelector('.map-size');
	POSITION = document.querySelector('.map-position');
	NAV = document.querySelector('nav');
}

function getBounds() {
	 // see stylesheet (page-styles.css) to confirm
	BASEW = document.body.clientWidth;
	BASEH = document.body.clientHeight;
	TOTALW = document.body.clientHeight;
	TOTALH = document.body.clientHeight;
}

function centerSize() {
	SIZE.style.transform = centerMe(SCALE*TOTALW,SCALE*TOTALH,BASEW,BASEH);
}

function centerView() {
	VIEW.scrollTop= (VIEW.scrollHeight-VIEW.clientHeight)/2-VIEW.clientHeight/2;
	VIEW.scrollLeft= (VIEW.scrollWidth-VIEW.clientWidth)/2;
}

function registerResizeUpdate() {
	window.addEventListener('resize', () => {getBounds(); centerSize(); centerView()});
}

var Exponential = {
	running : undefined,
	step : 0, // time-step (frame number)
	factor : 0.95, // acceleration factor
	V : undefined, // current speed
	X : undefined, // remaining scroll distance
	reset() {
		window.cancelAnimationFrame(this.running);
		this.step = this.V = this.X = 0;
	},
	applyTo(callback) {
		if (this.running)
			this.reset();

		this.V = (1 - this.factor)/(1-.00201631);
		this.X = 1;

		// console.log(this.step,this.X,this.V); //TODO: remove
		var advance = () => {
			if (callback(this.V,this.X))
				return;
			this.X -= this.V;
			this.V *= this.factor;
			this.step++;

			// console.log(this.step,this.X,this.V); //TODO: remove
			if (this.step < 120)
				this.running = requestAnimationFrame(advance);
		}

		advance();
	}
};

function scaleTo(scale) {
	return `scale3d(${scale},${scale},${scale})`;
}

function scrollTo(X,Y) {
	this.scrollLeft = X;
	this.scrollTop = Y;
}

function translateTo(X,Y,prepend=true) {
	return `translate(${X}px,${Y}px)`;
}

function centerMe(w,h,W,H) {
	if (w <= W && h >= H)
		return translateTo((W-w)/2,0);
	else if (w >= W && h <= H)
		return translateTo(0,(H-h)/2);
	else if (w <= W && h <= H)
		return translateTo((W-w)/2,(H-h)/2);
}

function Zoomer() {
	var timing = Object.create(Exponential);
	var lastScrollX = VIEW.scrollLeft/(SCALE*TOTALW - BASEW);
	var lastScrollY = VIEW.scrollTop/(SCALE*TOTALH - BASEH);
	var scrollXStart = 1;
	var scrollYStart = 1;
	var dScale, dScrollX, dScrollY;
	var callback = function(delta,remaining) {
		let d1 = delta*dScale,
			d2 = delta*dScrollX/scrollXStart,
			d3 = delta*dScrollY/scrollYStart;
		if (Math.abs(d1) < .001 && Math.abs(d2) + Math.abs(d3) < 1)
			return true;

		SCALE += d1;
		let smallerW = SCALE*TOTALW < BASEW;
		let smallerH = SCALE*TOTALH < BASEH;

		if (smallerW || smallerH)
			SIZE.style.transform = `${centerMe(SCALE*TOTALW, SCALE*TOTALH, BASEW, BASEH)} ${scaleTo(SCALE)}`;
		else
			SIZE.style.transform = scaleTo(SCALE);

		if (smallerW)
			scrollXStart = remaining - delta;
		else
			lastScrollX += d2;
		if (smallerH)
			scrollYStart = remaining - delta;
		else
			lastScrollY += d3;

		if (!smallerW || !smallerH)
			scrollTo.call(VIEW, lastScrollX, lastScrollY);
	};
	this.zoomStart = function(scale,sourceX=BASEW/2,sourceY=BASEH/2) {
		lastScrollX = VIEW.scrollLeft;
		lastScrollY = VIEW.scrollTop;
		scrollXStart = 1;
		scrollYStart = 1;

		if (SCALE*TOTALW < BASEW)
			if (sourceX == BASEW/2)
				sourceX = .5 * SCALE*TOTALW;
		if (SCALE*TOTALH < BASEH)
			if (sourceY == BASEH/2)
				sourceY = .5 * SCALE*TOTALH;

		dScale = scale - SCALE;
		percentX = (lastScrollX + sourceX) / (SCALE*TOTALW);
		percentY = (lastScrollY + sourceY) / (SCALE*TOTALH);
		finalX = scale*TOTALW * percentX - BASEW/2;
		finalY = scale*TOTALH * percentY - BASEH/2;
		dScrollX = finalX - lastScrollX;
		dScrollY = finalY - lastScrollY;

		timing.applyTo(callback);
		SLDR1.value = scale; //TODO: remove
		IN1.value = scale; //TODO: remove
	};

	this.zoomCancel = function() {
		timing.applyTo(() => true);
	}
}

function registerZoom() {
	var zoomObj = new Zoomer;
	SLDR1.addEventListener('input', () => zoomObj.zoomStart(+SLDR1.value));
	IN1.addEventListener('change', () => zoomObj.zoomStart(+IN1.value));
}

function distance(x1,y1,x2,y2) {
	return Math.sqrt((x1-x2)**2+(y1-y2)**2);
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

// Initializer list, status
var INITIALIZING = false,
	INITLIST = [getGlobals,centerSize,centerView,registerResizeUpdate,registerZoom];


// Initializer
function init() {
	if (INITIALIZING)
		return;
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		INITIALIZING = true;
		INITLIST.forEach((func) => {func();});
		console.log("All items initialized.");
	}
	else
		document.addEventListener('readystatechange',init);
}
init();