class Test extends HTMLElement {
  constructor() {
    super();
    this._status = "idle";
    this._errorMessage = null;
    this._interactiveElements = {};

    this.attachShadow({ mode: "open" });

    this._run = this.run.bind(this);
  }

  connectedCallback() {
    const control = document.createElement("button");
    const icon = document.createElement("img");
    icon.setAttribute("src", "./assets/play.svg");
    icon.setAttribute("heigth", "18");
    icon.setAttribute("width", "18");

    const description = this.getAttribute("description");

    const controlDiv = document.createElement("div");
    controlDiv.classList.add("control");

    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("description");
    descriptionDiv.textContent = description;

    const error = document.createElement("div");
    error.classList.add("error");

    control.appendChild(icon);
    controlDiv.appendChild(control);

    const style = document.createElement("style");
    style.textContent = `
:host {
  display: flex;
}
    
button {
  background-color: transparent;
  border: none;
}

.control {
  margin-right: 10px;
}

.error {
  color: red;
}
`;

    const wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");

    wrapper.appendChild(descriptionDiv);
    wrapper.appendChild(error);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(controlDiv);
    this.shadowRoot.appendChild(wrapper);

    this._interactiveElements.icon = icon;
    this._interactiveElements.error = error;

    if (this.hasAttribute("auto")) {
      window.setTimeout(
        () => this.run(),
        250 * Number(this.getAttribute("auto")),
      );
    } else {
      control.addEventListener("click", this._run);
    }
  }

  disconnectedCallback() {
    this._interactiveElements.control.removeEventListener("click", this._run);
  }

  run() {
    const test = this.hasAttribute("onRun")
      ? window[this.getAttribute("onRun")]
      : this.onRun;

    try {
      const result = test({
        assert(r) {
          if (!r) {
            throw new Error("Assertion Failed");
          }
        },
        assertNextFrame(f) {
          return new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {
              if (f()) {
                resolve();
              } else {
                reject(new Error("Assertion Failed"));
              }
            });
          });
        },
      });

      if (result instanceof Promise) {
        result
          .then(
            () => {
              this._status = "success";
            },
            (e) => {
              this._status = "failure";
              this._errorMessage = e?.message;
            },
          )
          .then(() => this.render());
      } else {
        this._status = "success";
        this.render();
      }
    } catch (e) {
      this._status = "failure";
      this._errorMessage = e.message;
      this.render();
    }
  }

  render() {
    if (this._status === "success") {
      this._interactiveElements.icon.src = "./assets/success-circle.svg";
    } else {
      this._interactiveElements.icon.src = "./assets/failure-circle.svg";
      this._interactiveElements.error.textContent = this._errorMessage;
    }
  }
}

window.createTests = (tests, root, e) => {
  tests.forEach(({ auto, description, test }, i) => {
    const component = document.createElement("iy-test");
    if (auto) component.setAttribute("auto", String(i));
    component.setAttribute("description", description);
    component.onRun = test(e);
    root.appendChild(component);
  });
};

window.customElements && window.customElements.define("iy-test", Test);
