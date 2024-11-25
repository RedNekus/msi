import iMask from 'imask';

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll(`[data-toggle="dropdown"]`);
  const editLink = document.querySelector(`[data-action="edit"]`);
  const form = document.forms[0];
  const check = document.getElementById('decided');
  let elems = [];
  check.addEventListener('change', (e) => {
    if (check.checked) {
      console.log('add');
      form.elements.link.setAttribute('disabled', 'disabled');
      form.elements.model.setAttribute('disabled', 'disabled');
      form.elements.link.parentElement.
          classList.add('lead-form__group--disabled');
      form.elements.model.parentElement.
          classList.add('lead-form__group--disabled');
    } else {
      console.log('remove');
      form.elements.link.removeAttribute('disabled', 'disabled');
      form.elements.model.removeAttribute('disabled', 'disabled');
      form.elements.link.parentElement.
          classList.remove('lead-form__group--disabled');
      form.elements.model.parentElement.
          classList.remove('lead-form__group--disabled');
    }
  });
  if ('undefined' !== typeof form) {
    elems = Object.values(form.elements).
        filter((el) => el && el.classList.contains('is-editable'));
    const phone = form.elements.phone;
    console.log(phone);
    if ('undefined' !== typeof phone) {
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
        inputEl.removeAttribute('readonly');
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
