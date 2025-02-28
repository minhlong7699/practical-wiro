class GiftWrap extends HTMLElement {
    constructor() {
        super();

        const productFormSubmit = document.querySelector('product-form');
        this.productForm = productFormSubmit?.querySelector("form[action='/cart/add']");
        this.checkbox = this.querySelector("[data-gift-wrap-checkbox]");
        this.fieldsContainer = this.querySelector("[data-gift-wrap-fields]");
        this.giftWrapId = this.getAttribute("data-gift-wrap-id");
        this.giftWrapPrice = this.getAttribute("data-gift-wrap-price");
        this.messageTextLimit = this.getAttribute("data-message-text-limit");

        if (this.giftMessage && this.messageTextLimit) {
            this.giftMessage.maxLength = parseInt(this.messageTextLimit, 10);
        }

        if (this.checkbox) {
            this.checkbox.addEventListener("change", this.toggleGiftWrap.bind(this));
        }
    }

    toggleGiftWrap() {
        const isChecked = this.checkbox.checked;
        this.fieldsContainer.classList.toggle("hidden", !isChecked);

        this.fieldsContainer.querySelectorAll("input, textarea").forEach(field => {
            if (isChecked) {
                field.setAttribute("required", "true");
            } else {
                field.removeAttribute("required");
                field.value = "";
            }
        });
    }
}

customElements.define("gift-wrap", GiftWrap);
