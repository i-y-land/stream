


function handleAddButton () {
  this.value = ++this._value;
}

function handlesubtractButton () {
  if (this._value <= 0) return;
  this.value = --this._value;
}

class Stepper extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    this._value = 0;
    this._interactiveElements = {};

    this.attachShadow({ mode: "open" });

    this._handleAddButton = handleAddButton.bind(this);
    this._handlesubtractButton = handlesubtractButton.bind(this);
  }

  connectedCallback() {
    const template = window.document.getElementById("iy-stepper-template");
    const content = template.cloneNode(true).content;

    while (content.firstElementChild) {
      this.shadowRoot.appendChild(content.firstElementChild);
    }

    const addButton = this.shadowRoot.querySelector("ellipse.clickable.add");
    const subtractButton = this.shadowRoot.querySelector("ellipse.clickable.subtract");
    const span = this.shadowRoot.querySelector("text.value");

    this._interactiveElements.addButton = addButton;
    this._interactiveElements.subtractButton = subtractButton;
    this._interactiveElements.span = span;

    addButton.addEventListener("click", this._handleAddButton);
    subtractButton.addEventListener("click", this._handlesubtractButton);
  }

  disconnectedCallback() {
    const { addButton, subtractButton } = this._interactiveElements;

    addButton.removeEventListener("click", this._handleAddButton);
    subtractButton.removeEventListener("click", this._handlesubtractButton);
  }

  attributeChangedCallback(name, v, w) {
    if (!this.hasAttribute("disabled")) {
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
    if (!this.parentElement || !this._interactiveElements.span) return;
    this._interactiveElements.span.textContent = String(this._value);
  }
}

window.customElements && window.customElements.define("iy-stepper", Stepper);
