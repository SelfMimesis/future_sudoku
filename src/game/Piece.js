export class Piece {
  constructor(value, onSelect) {
    this.value = value;
    this.onSelect = onSelect;
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "piece-token";
    this.element.dataset.value = String(value);
    this.element.setAttribute("aria-label", `Numero ${value}`);

    this.numberElement = document.createElement("strong");
    this.numberElement.textContent = String(value);

    this.countElement = document.createElement("span");
    this.countElement.textContent = "9";

    this.element.append(this.numberElement, this.countElement);
    this.element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.onSelect(this.value);
    });
  }

  mount(root) {
    root.append(this.element);
  }

  update({ selected = false, remaining = 9 } = {}) {
    this.element.classList.toggle("is-selected", selected);
    this.element.classList.toggle("is-complete", remaining <= 0);
    this.element.disabled = remaining <= 0;
    this.countElement.textContent = String(Math.max(0, remaining));
    this.element.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}
