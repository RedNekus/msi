//const Mask = require("imask");
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll(`[data-toggle="dropdown"]`)
    const editLink = document.querySelector(`[data-action="edit"]`)
    const form = document.forms[0]
    const elems = Object.values(form.elements).filter( el => el.classList.contains('is-editable') ) ?? []
    editLink.addEventListener('click', (e) => {
        e.preventDefault()
        elems.forEach(elem => {
            elem.classList.remove('lead-form__group--disabled')
            let inputEl = elem.querySelector('input')
            inputEl.removeAttribute('disabled')
        })
    });
    if(dropdowns) {
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', () => {
                let contentId = dropdown.dataset?.target.replace('#', '')
                if(null !== contentId) {
                    let content = document.getElementById(contentId)
                    content.classList.toggle('is-hidden')
                    dropdown.classList.toggle('is-open')
                }
            });
        });
    };
    /*let newMask = Mask.createMask(
        document.getElementById('phone'),
        {
          mask: 'XXX-XX-0000',
          definitions: {
            X: {
              mask: '0',
              displayChar: 'X',
              placeholderChar: '#',
            },
          },
          lazy: false,
          overwrite: 'shift',
        }
    );
    console.log(newMask);*/
})