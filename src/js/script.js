import iMask from 'imask';

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll(`[data-toggle="dropdown"]`);
  const editLink = document.querySelector(`[data-action="edit"]`);
  const form = document.forms[0];
  let elems = [];
  if ('undefined' !== typeof form) {
    elems = Object.values(form.elements).
        filter((el) => el && el.classList.contains('is-editable'));
    const phone = form.elements.phone;
    if (null !== phone) {
      const newMask = iMask(phone,
          {
            mask: '+{375} (00) 000-00-00',
            lazy: true,
          },
      ).on('complete', function() {
        // todo:
      });
      console.log(newMask);
    }
  }

  if (null !== editLink) {
    editLink.addEventListener('click', (e) => {
      e.preventDefault();
      elems.forEach((elem) => {
        elem.classList.remove('lead-form__group--disabled');
        const inputEl = elem.querySelector('input');
        inputEl.removeAttribute('disabled');
      });
    });
  }
  if (null !== dropdowns) {
    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener('click', () => {
        const contentId = dropdown.dataset.target.replace('#', '');
        if (null !== contentId) {
          const content = document.getElementById(contentId);
          content.classList.toggle('is-hidden');
          dropdown.classList.toggle('is-open');
        }
      });
    });
  }
});
