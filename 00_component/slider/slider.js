function handleMouseMove({clientX}) {
  if (!this._drag) return;
  const { track } = this._interactiveElements;
  const box = track.getBoundingClientRect();
  const r = ((clientX - box.x) / box.width).toFixed(2);

  if (this._range && this._dragElement) {
    this[this._dragElement.classList.contains("min") ? "minvalue" : "maxvalue"] = r < 0 ? 0 : r > 1 ? 1 : r;
  } else {
    this.value = r < 0 ? 0 : r > 1 ? 1 : r;
  }
}

function handleMouseUp() {
  this._dragElement = null;
  this._drag = false;
}

function handleMouseDown({ target }) {
  this._dragElement = target;
  this._drag = true;
}

function handleClick({clientX}) {
  const { track } = this._interactiveElements;
  const box = track.getBoundingClientRect();
  this.value = (clientX - box.x) / box.width;
}

class Slider extends HTMLElement {
  static get formAssociated() {
    return true;
  }

  static get observedAttributes() {
    return ["minvalue", "maxvalue", "value"];
  }

  constructor() {
    super();
    if (this.attachInternals) this._internals = this.attachInternals();
    this._drag = false;
    this._dragElement = null;
    this._value = 0;
    this._interactiveElements = {};

    this.attachShadow({mode: "open"});

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
    const track = this.shadowRoot.querySelector(".runnable-track")

    // The component is in "range mode"
    if (this.hasAttribute("minvalue") && this.hasAttribute("maxvalue")) {
      this._range = true;
      this._minvalue = Number(this.getAttribute("minvalue"));
      this._maxvalue = Number(this.getAttribute("maxvalue"));

      const svg = this.shadowRoot.querySelector("svg");
      const c1 = thumb.cloneNode();
      const c2 = notch.cloneNode();
      const c3 = thumbOuter.cloneNode();

      c1.setAttribute("cx", "32");
      c2.setAttribute("x1", "32");
      c2.setAttribute("x2", "32");
      c3.setAttribute("cx", "32");

      thumb.classList.add("min");
      c1.classList.add("max");

      svg.appendChild(c3)
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

    this._interactiveElements.activeTrack = this.shadowRoot.querySelector(".active-track");
    this._interactiveElements.track = track;

    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    thumb.addEventListener("mousedown", this._handleMouseDown);
    track.addEventListener("click", this._handleClick);


    this.render();
  }

  disconnectedCallback() {
    const { thumb, track } = this._interactiveElements;
    document.removeEventListener("mousemove", this._handleMouseMove);
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

  get maxvalue() {
    return this._range ? this._maxvalue : null;
  }

  get minvalue() {
    return this._range ? this._minvalue : null;
  }

  set maxvalue(x) {
    if (!this.hasAttribute("disabled") && this._range) {
      this.setAttribute("maxvalue", x);
    }
  }

  set minvalue(x) {
    if (!this.hasAttribute("disabled") && this._range) {
      this.setAttribute("minvalue", x);
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
    const d = this._range && this._dragElement
      ? this._dragElement.classList.contains("min")
        ? "minvalue"
        : "maxvalue"
      : undefined;
    const thumb = range
      ? d === "minvalue"
        ? this._interactiveElements.minThumb
        : this._interactiveElements.maxThumb
      : this._interactiveElements.thumb;
    const notch = range
      ? d === "minvalue"
        ? this._interactiveElements.minNotch
        : this._interactiveElements.maxNotch
      : this._interactiveElements.notch;
    const thumbOuter = range
      ? d === "minvalue"
        ? this._interactiveElements.minThumbOuter
        : this._interactiveElements.maxThumbOuter
      : this._interactiveElements.thumbOuter;

    const box = track.getBoundingClientRect();
    const radius = Number(thumbOuter.getAttribute("rx"));
    const ratio = Math.floor(box.width * this[range ? `_${d}` : "_value"]);
    const x = this[range ? `_${d}` : "_value"] < 0.5
      ? Math.max(ratio, radius)
      : Math.min(box.width - (radius - Number(thumb.getAttribute("rx"))), ratio);

    console.log("render", d, this[range ? `_${d}` : "_value"], x, activeTrack.getAttribute("width"));

    thumb.setAttribute("cx", String(x));
    thumbOuter.setAttribute("cx", String(x));
    notch.setAttribute("x1", String(x));
    notch.setAttribute("x2", String(x));

    if (range) {
      if (d === "minvalue") {
        // console.log("minvalue", String(x), String(Number(activeTrack.getAttribute("width")) - x))
        activeTrack.setAttribute("x", String(x));
        activeTrack.setAttribute(
          "width",
          String(Number(activeTrack.getAttribute("width")) - x)
        );
      } else {
        // console.log("maxvalue", Number(activeTrack.getAttribute("x")) - x)
        activeTrack.setAttribute(
          "width",
          String(Number(activeTrack.getAttribute("x")) - x)
        );
      }
    } else {
      activeTrack.setAttribute("width", String(x));
    }
  }
}

window.customElements && window.customElements.define("iy-slider", Slider);
