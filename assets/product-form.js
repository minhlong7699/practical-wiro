if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
        this.giftWrapElement = document.querySelector("gift-wrap");
        this.giftWrapId = this.giftWrapElement ? this.giftWrapElement.dataset.giftWrapId : null;

        this.productId = this.form.querySelector('input[name="id"]').value;
        console.log(this.productId);

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        this.hasGiftWrap = document.querySelector('[name="gift-wrap"]').checked;

        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();
        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        try {
          if (this.hasGiftWrap) {
            await this.addGiftWrap();
          }
          await this.addProduct();

        } catch (error) {
          console.error("Error in adding to cart:", error);
        } finally {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading__spinner').classList.add('hidden');
        }
      }

      addGiftWrap() {
        return new Promise((resolve, reject) => {
          const giftWrapItem = {
            id: this.giftWrapId,
            quantity: 1,
            properties: {
              "main_variant_id": this.productId
            }
          };

          fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: "POST",
            body: JSON.stringify(giftWrapItem),
            headers: { "Content-Type": "application/json" }
          })
            .then(response => response.json())
            .then(data => {
              if (data.status) {
                console.error("Gift wrap add failed:", data);
                reject(data);
              } else {
                resolve(data);
              }
            })
            .catch(reject);
        });
      }

      addProduct() {
        return new Promise((resolve, reject) => {
          const config = fetchConfig("javascript");
          config.headers["X-Requested-With"] = "XMLHttpRequest";
          delete config.headers["Content-Type"];

          const formData = new FormData(this.form);
          if (this.cart) {
            formData.append(
              "sections",
              this.cart.getSectionsToRender().map(section => section.id)
            );
            formData.append("sections_url", window.location.pathname);
            this.cart.setActiveElement(document.activeElement);
          }
          config.body = formData;

          fetch(`${routes.cart_add_url}`, config)
            .then(response => response.json())
            .then(response => {
              if (response.status) {
                publish(PUB_SUB_EVENTS.cartError, {
                  source: "product-form",
                  productVariantId: formData.get("id"),
                  errors: response.errors || response.description,
                  message: response.message
                });
                this.handleErrorMessage(response.description);
                reject(response);
              } else {
                if (!this.cart) {
                  window.location = window.routes.cart_url;
                  return;
                }

                publish(PUB_SUB_EVENTS.cartUpdate, {
                  source: "product-form",
                  productVariantId: formData.get("id"),
                  cartData: response
                });

                this.cart.renderContents(response);
                resolve(response);
              }
            })
            .catch(reject);
        });
      }


      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
