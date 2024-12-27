//Cart Drawer Custom Element JS

if(!customElements.get('cart-drawer')){
    class CartDrawer extends HTMLElement {
        constructor(){
            super();
            this.closeButton = this.querySelector('.drawer__close');
            this.closeButton.addEventListener('click', this.closeDrawer.bind(this));
        }

        // By Call this Function you can open Cart Drawer by this document.querySelector('cart-drawer').openDrawer();
        openDrawer = () => {
            this.classList.add('show-overlay');
        }

        // By Call this Function you can close Cart Drawer by this document.querySelector('cart-drawer').closeDrawer();
        closeDrawer = () => {
            this.classList.remove('show-overlay');
        }
    }

    customElements.define('cart-drawer', CartDrawer)
}

//Quantity Selector Custom Element JS

if(!customElements.get('quantity-selector')){
    class QuantitySelector extends HTMLElement {
        constructor(){
            super();
            this.buttonsPlus = this.querySelector('button[name="plus"]');
            this.buttonsMinus = this.querySelector('button[name="minus"]');
            this.buttonRemove = this.nextElementSibling;
            this.input = this.querySelector('input');
            this.currentValue = this.input.value;

            this.buttonsPlus ? this.buttonsPlus.addEventListener('click', this.upQuantity.bind(this)) : ''; 
            this.buttonsMinus ? this.buttonsMinus.addEventListener('click', this.downQuantity.bind(this)) : '';
            this.buttonRemove ? this.buttonRemove.addEventListener('click', this.removeQuantity.bind(this)) : '';
            this.input ? this.input.addEventListener('change', this.changeQuantity.bind(this)) : '';
        } 

        removeQuantity = () => {
            this.updateCart(true);
        }

        changeQuantity = () => {
            this.updateCart(false);
        }

        upQuantity = () => {
            this.input.stepUp()
            this.updateCart(false);
        }
        
        downQuantity = () => {
            this.input.stepDown()
            this.updateCart(false);
        }

        //Update Cart Drawer HTML
        updateCart = (remove) => {
            if('updateItem' in this.dataset){
                //Get Line Item Data
                const data = {
                    line : this.dataset.line * 1,
                    quantity : remove ? 0 : this.input.value,
                    //Assign Section Id which we want with response after add line item in cart
                    sections: ['cart-drawer' ],
                    sections_url: window.location.pathname
                }
                const body = JSON.stringify(data);
                fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
                .then((response) => {
                    return response.text();
                })
                .then((state) => {
                    const parsedState = JSON.parse(state);
                    const parser = new DOMParser()
                    const html = parser.parseFromString(parsedState.sections['cart-drawer'], "text/html");
                    //Assign Current State to New Cart Drawer HTML
                    html.querySelector('cart-drawer').classList = document.querySelector('cart-drawer').classList;
                    //Replace Current Cart Drawer with New Cart Drawer HTML
                    document.querySelector('cart-drawer').replaceWith(html.querySelector('cart-drawer'));
                })
                .catch((error) => {
                    console.log(error);
                })
                .finally(() => {
                    
                });
            }
        }
    }

    customElements.define('quantity-selector', QuantitySelector)
}

//Product Form Custom Element JS
if(!customElements.get('product-form')){
    class ProductForm extends HTMLElement {
        constructor(){
            super();
            this.form = this.querySelector('form');
            this.form.addEventListener('submit', this.addProduct.bind(this));
        }

        addProduct = (event) => {
            event.preventDefault();

            
            const config = fetchConfig('javascript');
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
            delete config.headers['Content-Type'];

            //Get Form Data Here
            const formData = new FormData(this.form);


            //Assign Section Id which we want with response after add line item in cart
            if (document.querySelector('cart-drawer')) {
                formData.append(
                  'sections',
                  ['cart-drawer']
                );
                formData.append('sections_url', window.location.pathname);
            }

            config.body = formData;
            // Add Product into Cart
            fetch(`${routes.cart_add_url}`, config)
            .then((response) => response.json())
            .then((response) => {
                
                publish(PUB_SUB_EVENTS.cartUpdate, {
                    source: 'product-form',
                    productVariantId: formData.get('id'),
                    cartData: response,
                });
                
                const parser = new DOMParser()
                const html = parser.parseFromString(response.sections['cart-drawer'], "text/html");
                document.querySelector('cart-drawer').replaceWith(html.querySelector('cart-drawer'));

            }).catch(error => {
                console.log(error);
            }).finally(() => {
                setTimeout(() => {
                    document.querySelector('cart-drawer').openDrawer();
                }, 500);
            });
        }
    }

    customElements.define('product-form', ProductForm);
}