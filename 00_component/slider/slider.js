function handleMouseMove({ clientX }) {
  if (!this._drag) return;
  const [, , , , track] = this._interactiveElements;
  const box = track.getBoundingClientRect();
  const r = ((clientX - box.x) / box.width).toFixed(2);
  this.value = r < 0 ? 0 : r > 1 ? 1 : r;
}

function handleMouseUp() {
  this._drag = false;
}

function handleMouseDown() {
  this._drag = true;
}

class Slider extends HTMLElement {
  static get formAssociated() {
    return true;
  }
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    if (this.attachInternals) this._internals = this.attachInternals();
    this._drag = false;
    this._value = 0.6;

    const shadow = this.attachShadow({ mode: "open" });
    const template = window.document.getElementById("iy-slider-template");
    const content = template.cloneNode(true).content;

    while (content.firstElementChild) {
      shadow.appendChild(content.firstElementChild);
    }

    this._interactiveElements = [
      shadow.querySelector(".thumb"),
      shadow.querySelector(".notch"),
      shadow.querySelector(".thumb-outer"),
      shadow.querySelector(".active-track"),
      shadow.querySelector(".runnable-track"),
    ];

    this._handleMouseMove = handleMouseMove.bind(this);
    this._handleMouseUp = handleMouseUp.bind(this);
    this._handleMouseDown = handleMouseDown.bind(this);
  }

  connectedCallback() {
    const [thumb] = this._interactiveElements;
    document.addEventListener("mousemove", this._handleMouseMove);
    document.addEventListener("mouseup", this._handleMouseUp);
    thumb.addEventListener("mousedown", this._handleMouseDown);
  }

  disconnectedCallback() {
    const [thumb] = this._interactiveElements;
    document.removeEventListener("mousemove", this._handleMouseMove);
    document.removeEventListener("mouseup", this._handleMouseUp);
    thumb.removeEventListener("mousedown", this._handleMouseDown);
  }

  get form() {
    return this._internals ? this._internals.form : null;
  }

  attributeChangedCallback(name, v, w) {
    if (w >= 0 && w <= 1 && v !== w && !this.hasAttribute("disabled")) {
      this._value = Number(w);
      this.render();
      this.dispatchEvent(new CustomEvent("change"));
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

    const [thumb, notch, thumbOuter, activeTrack, track] =
      this._interactiveElements;
    const box = track.getBoundingClientRect();
    const radius = Number(thumbOuter.getAttribute("rx"));
    const ratio = Math.floor(box.width * this._value);
    const x = this._value < 0.5
      ? Math.max(ratio, radius)
      : Math.min(box.width - (radius - thumb.getAttribute("rx")), ratio);

    thumb.setAttribute("cx", String(x));
    thumbOuter.setAttribute("cx", String(x));
    notch.setAttribute("x1", String(x));
    notch.setAttribute("x2", String(x));
    activeTrack.setAttribute("width", String(x));
  }
}

window.customElements && window.customElements.define("iy-slider", Slider);
