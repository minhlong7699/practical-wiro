class CartGiftWrap extends HTMLElement {
    constructor() {
        super();

        this.checkbox = this.querySelector("[data-cart-gift-wrap-checkbox]");
        this.editButton = this.querySelector("[data-cart-gift-wrap-edit]");
        this.updateButton = this.querySelector("[data-cart-gift-wrap-update]");
        this.fieldsContainer = this.querySelector("[data-cart-gift-wrap-fields]");
        this.displayText = this.querySelector("[data-cart-gift-wrap-display]");
        this.lineItemIndex = this.getAttribute("data-line-item"); // Số thứ tự của lineItem trong giỏ

        this.isEditing = false;

        if (this.checkbox) {
            this.checkbox.addEventListener("change", this.toggleGiftWrap.bind(this));
        }
        if (this.editButton) {
            this.editButton.addEventListener("click", this.toggleEditMode.bind(this));
        }
        if (this.updateButton) {
            this.updateButton.addEventListener("click", this.validateAndUpdate.bind(this));
        }
    }




    validateAndUpdate() {
        const giftFrom = this.querySelector("[data-gift-from]");
        const giftTo = this.querySelector("[data-gift-to]");
        const giftMessage = this.querySelector("[data-gift-message]");
        let isValid = true;

        this.clearErrors();

        if (!giftFrom.value.trim()) {
            this.showError(giftFrom, "Please enter sender's name");
            isValid = false;
        }
        if (!giftTo.value.trim()) {
            this.showError(giftTo, "Please enter recipient's name");
            isValid = false;
        }
        if (!giftMessage.value.trim()) {
            this.showError(giftMessage, "Please enter a message");
            isValid = false;
        }

        if (isValid) {
            this.updateGiftWrap();
        }
    }

    showError(element, message) {
        const errorElement = document.createElement("p");
        errorElement.className = "text-red-500 text-normal mt-1";
        errorElement.innerText = message;
        element.classList.add("border-red-500");
        element.insertAdjacentElement("afterend", errorElement);
    }

    clearErrors() {
        this.querySelectorAll(".text-red-500").forEach(el => el.remove());
        this.querySelectorAll("input, textarea").forEach(el => el.classList.remove("border-red-500"));
    }

    toggleGiftWrap() {
        const isChecked = this.checkbox.checked;
        this.displayText.classList.toggle("hidden", isChecked);
        this.fieldsContainer.classList.toggle("hidden", !isChecked);
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        if (this.isEditing) {
            this.fieldsContainer.classList.remove("hidden");
            this.displayText.classList.add("hidden");
            this.editButton.textContent = "Cancel";
        } else {
            this.fieldsContainer.classList.add("hidden");
            this.displayText.classList.remove("hidden");
            this.editButton.textContent = "Edit";
        }
    }

    resetFormFields() {
        this.querySelector("[data-gift-from]").value = this.getAttribute("data-gift-from") || "";
        this.querySelector("[data-gift-to]").value = this.getAttribute("data-gift-to") || "";
        this.querySelector("[data-gift-message]").value = this.getAttribute("data-gift-message") || "";
    }

    updateGiftWrap() {
        const giftFrom = this.querySelector("[data-gift-from]").value;
        const giftTo = this.querySelector("[data-gift-to]").value;
        const giftMessage = this.querySelector("[data-gift-message]").value;
        const payload = {
            line: parseInt(this.lineItemIndex, 10),
            properties: {
                "Gift From": giftFrom,
                "Gift To": giftTo,
                "Gift Message": giftMessage,
            }
        };

        fetch("/cart/change.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log("Cart updated:", data);
                this.renderCartDrawer();
            })
            .catch(error => console.error("Error updating cart:", error));
    }

    renderCartDrawer() {
        fetch(`${routes.cart_url}?section_id=cart-drawer`)
            .then(response => response.text())
            .then(responseText => {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(responseText, "text/html");
                console.log(htmlDoc);
                const newCartDrawer = htmlDoc.querySelector("#CartDrawer");
                const currentCartDrawer = document.querySelector("#CartDrawer");
                console.log(currentCartDrawer);
                if (newCartDrawer && currentCartDrawer) {
                    currentCartDrawer.innerHTML = newCartDrawer.innerHTML;
                }
            })
            .catch(error => console.error("Error rendering cart drawer:", error));
    }
}

customElements.define("cart-gift-wrap", CartGiftWrap);
