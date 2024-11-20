import iMask from 'imask';

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll(`[data-toggle="dropdown"]`);
  const editLink = document.querySelector(`[data-action="edit"]`);
  const form = document.forms[0];
  const elems = Object.values(form.elements).
      filter((el) => el && el.classList.contains('is-editable'));
  editLink.addEventListener('click', (e) => {
    e.preventDefault();
    elems.forEach((elem) => {
      elem.classList.remove('lead-form__group--disabled');
      const inputEl = elem.querySelector('input');
      inputEl.removeAttribute('disabled');
    });
  });
  if (dropdowns) {
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
  const newMask = iMask(
      document.getElementById('phone'),
      {
        mask: '+{375} (00) 000-00-00',
        lazy: true,
      },
  ).on('complete', function() {
    // phoneInput.classList.remove('is-invalid');
    // phoneInput.classList.add('is-valid');
    console.log('222');
  });
  console.log(newMask);
});
