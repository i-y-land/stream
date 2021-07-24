


function handleAddButton (event) {
  this.value = ++this._value;
  console.log("ADD", this.value);
}

function handleRemoveButton (event) {
  if (this._value <= 0) return;
  this.value = --this._value;
  console.log("REMOVE", this.value);
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
    this._handleRemoveButton = handleRemoveButton.bind(this);
  }

  connectedCallback() {
    const template = window.document.getElementById("iy-stepper-template");
    const content = template.cloneNode(true).content;

    while (content.firstElementChild) {
      this.shadowRoot.appendChild(content.firstElementChild);
    }

    const addButton = this.shadowRoot.querySelector("ellipse.clickable.add");
    const removeButton = this.shadowRoot.querySelector("ellipse.clickable.remove");
    const span = this.shadowRoot.querySelector("text.value");

    this._interactiveElements.addButton = addButton;
    this._interactiveElements.removeButton = removeButton;
    this._interactiveElements.span = span;

    addButton.addEventListener("click", this._handleAddButton);
    removeButton.addEventListener("click", this._handleRemoveButton);
  }

  disconnectedCallback() {
    const { addButton, removeButton } = this._interactiveElements;

    addButton.removeEventListener("click", this._handleAddButton);
    removeButton.removeEventListener("click", this._handleRemoveButton);
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
    if (!this.parentElement) return;
    console.log("Render");
    this._interactiveElements.span.textContent = String(this._value);
  }
}

window.customElements && window.customElements.define("iy-stepper", Stepper);
