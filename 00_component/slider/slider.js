const calculatePosition = (value, { offset, radius, width }) => {
  const ratio = Math.floor(width * value);

  return value < 0.09
    ? Math.max(ratio, radius)
    : Math.min(width - (radius - offset), ratio);
};

const positionThumb = (x, { thumb, thumbOuter, notch }) => {
  const v = Number(thumb.getAttribute("cx"));
  if (x === v) return;
  thumb.setAttribute("cx", String(x));
  thumbOuter.setAttribute("cx", String(x));
  notch.setAttribute("x1", String(x));
  notch.setAttribute("x2", String(x));
};

const positionActiveTrack = (x1, x2, activeTrack) => {
  activeTrack.setAttribute("x", String(x1));
  activeTrack.setAttribute("width", String(x2 - x1));
};

function handleMouseMove({ clientX }) {
  if (!this._drag) return;
  const { track } = this._interactiveElements;
  const box = track.getBoundingClientRect();
  const r = (clientX - box.x) / box.width;

  if (this._range && this._dragElement) {
    const d = this._dragElement.classList.contains("thumb__min")
      ? "min"
      : "max";
    const v = d === "min" ? this._max : this._min;
    this[d] = d === "min"
      ? Math.max(0, Math.min(r, v))
      : Math.min(Math.max(r, v), 1);
  } else {
    this.value = r < 0 ? 0 : r > 1 ? 1 : r;
  }
}

function handleMouseUp() {
  this._dragElement = null;
  this._drag = false;
  document.removeEventListener("mouseup", this._handleMouseUp);
  document.removeEventListener("mousemove", this._handleMouseMove);
}

function handleMouseDown({ target }) {
  this._dragElement = target;
  this._drag = true;
  document.addEventListener("mouseup", this._handleMouseUp);
  document.addEventListener("mousemove", this._handleMouseMove);
}

function handleClick({ clientX }) {
  const { track } = this._interactiveElements;
  const box = track.getBoundingClientRect();
  this.value = (clientX - box.x) / box.width;
}

class Slider extends HTMLElement {
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ["min", "max", "value"];
  }

  constructor() {
    super();
    if (this.attachInternals) this._internals = this.attachInternals();
    this._drag = false;
    this._dragElement = null;
    this._value = 0;
    this._interactiveElements = {};

    this.attachShadow({ mode: "open" });

    this._handleMouseMove = handleMouseMove.bind(this);
    this._handleMouseUp = handleMouseUp.bind(this);
    this._handleMouseDown = handleMouseDown.bind(this);
    this._handleClick = handleClick.bind(this);
  }

  connectedCallback() {
    const template = window.document.getElementById("iy-slider-template");
    const content = template.cloneNode(true).content;

    while (content.firstElementChild) {
      this.shadowRoot.appendChild(content.firstElementChild);
    }

    const thumb = this.shadowRoot.querySelector(".thumb");
    const notch = this.shadowRoot.querySelector(".notch");
    const thumbOuter = this.shadowRoot.querySelector(".thumb-outer");
    const track = this.shadowRoot.querySelector(".runnable-track");

    // The component is in "range mode"
    if (this.hasAttribute("min") && this.hasAttribute("max")) {
      this._range = true;
      this._min = Number(this.getAttribute("min"));
      this._max = Number(this.getAttribute("max"));

      const svg = this.shadowRoot.querySelector("svg");
      const c1 = thumb.cloneNode();
      const c2 = notch.cloneNode();
      const c3 = thumbOuter.cloneNode();

      c1.setAttribute("cx", "32");
      c2.setAttribute("x1", "32");
      c2.setAttribute("x2", "32");
      c3.setAttribute("cx", "32");

      thumb.classList.add("thumb__min");
      c1.classList.add("thumb__max");

      svg.appendChild(c3);
      svg.appendChild(c1);
      svg.appendChild(c2);

      c1.addEventListener("mousedown", this._handleMouseDown);

      this._interactiveElements.minThumb = thumb;
      this._interactiveElements.minNotch = notch;
      this._interactiveElements.minThumbOuter = thumbOuter;
      this._interactiveElements.maxThumb = c1;
      this._interactiveElements.maxNotch = c2;
      this._interactiveElements.maxThumbOuter = c3;
    } else {
      this._interactiveElements.thumb = thumb;
      this._interactiveElements.notch = notch;
      this._interactiveElements.thumbOuter = thumbOuter;
    }

    this._interactiveElements.activeTrack = this.shadowRoot.querySelector(
      ".active-track",
    );
    this._interactiveElements.track = track;

    thumb.addEventListener("mousedown", this._handleMouseDown);
    track.addEventListener("click", this._handleClick);

    this.render();
  }

  disconnectedCallback() {
    const { thumb, track } = this._interactiveElements;
    document.removeEventListener("mouseup", this._handleMouseUp);
    thumb.removeEventListener("mousedown", this._handleMouseDown);
    track.removeEventListener("click", this._handleClick);
  }

  get form() {
    return this._internals ? this._internals.form : null;
  }

  attributeChangedCallback(name, v, w) {
    if (w >= 0 && w <= 1 && v !== w && !this.hasAttribute("disabled")) {
      if (this._range) {
        this[`_${name}`] = Number(w);
      } else {
        this._value = Number(w);
      }
      this.render();
      this.dispatchEvent(new CustomEvent("change"));
    }
  }

  get max() {
    return this._range ? this._max : null;
  }

  get min() {
    return this._range ? this._min : null;
  }

  set max(x) {
    if (!this.hasAttribute("disabled") && this._range) {
      this.setAttribute("max", x);
    }
  }

  set min(x) {
    if (!this.hasAttribute("disabled") && this._range) {
      this.setAttribute("min", x);
    }
  }

  get value() {
    return this._value;
  }

  set value(x) {
    if (!this.hasAttribute("disabled")) {
      this.setAttribute("value", x);
    }
  }

  render() {
    if (!this.parentElement) return;

    const { activeTrack, track } = this._interactiveElements;

    if (!track) return;

    const range = this._range;

    const box = track.getBoundingClientRect();

    if (range) {
      const {
        minNotch,
        maxNotch,
        minThumb,
        maxThumb,
        minThumbOuter,
        maxThumbOuter,
      } = this._interactiveElements;
      const strokeWidth = Number(minThumb.getAttribute("stroke-width"));

      const x1 = calculatePosition(
        this._min,
        {
          offset: Number(minThumb.getAttribute("rx")) + strokeWidth,
          radius: Number(minThumbOuter.getAttribute("rx")),
          width: box.width,
        },
      );
      const x2 = calculatePosition(
        this._max,
        {
          offset: Number(maxThumb.getAttribute("rx")) + strokeWidth,
          radius: Number(maxThumbOuter.getAttribute("rx")),
          width: box.width,
        },
      );
      window.requestAnimationFrame(() => {
        positionActiveTrack(x1, x2, activeTrack);
        positionThumb(
          x1,
          {
            thumb: minThumb,
            thumbOuter: minThumbOuter,
            notch: minNotch,
          },
        );
        positionThumb(
          x2,
          {
            thumb: maxThumb,
            thumbOuter: maxThumbOuter,
            notch: maxNotch,
          },
        );
      });
    } else {
      const { notch, thumb, thumbOuter } = this._interactiveElements;
      const strokeWidth = Number(thumb.getAttribute("stroke-width"));
      const offset = Number(thumb.getAttribute("rx")) + strokeWidth;
      const radius = Number(thumbOuter.getAttribute("rx"));
      const x = calculatePosition(
        this._value,
        { offset, radius, width: box.width },
      );
      window.requestAnimationFrame(() => {
        positionActiveTrack(radius - offset, x, activeTrack);
        positionThumb(
          x,
          {
            thumb: thumb,
            thumbOuter: thumbOuter,
            notch: notch,
          },
        );
      });
    }
  }
}

window.customElements && window.customElements.define("iy-slider", Slider);
