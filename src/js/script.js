import iMask from 'imask';

document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll(`[data-toggle="dropdown"]`);
  const editLink = document.querySelector(`[data-action="edit"]`);
  const form = document.forms[0];
  const check = document.getElementById('decided');
  const liability = document.getElementById('liability');
  const liabilityNo = document.getElementById('liability_0');
  let elems = [];

  if (liability) {
    liability.addEventListener('change', () => {
      const block = liability.parentElement.parentElement;
      const hiddenElems = block.querySelectorAll('[data-shown]');
      liability.checked = false;
      if (hiddenElems) {
        hiddenElems.forEach( (item) => {
          item.classList.remove('is-hidden');
        });
        const firstHiddenElem = hiddenElems[0].children[0];
        if (firstHiddenElem) {
          firstHiddenElem.checked = true;
          firstHiddenElem.dispatchEvent(new Event('change'));
        }
      }
    });
    liabilityNo.addEventListener('change', () => {
      const block = liability.parentElement.parentElement;
      const hiddenElems = block.querySelectorAll('[data-shown]');
      if (hiddenElems) {
        hiddenElems.forEach( (item) => {
          item.classList.add('is-hidden');
        });
      }
    });
  }
  if (check) {
    check.addEventListener('change', (e) => {
      if (check.checked) {
        form.elements.link.value = '';
        form.elements.model.value = '';
        form.elements.link.setAttribute('disabled', 'disabled');
        form.elements.model.setAttribute('disabled', 'disabled');
        form.elements.link.parentElement.
            classList.add('lead-form__group--disabled');
        form.elements.model.parentElement.
            classList.add('lead-form__group--disabled');
      } else {
        form.elements.link.removeAttribute('disabled', 'disabled');
        form.elements.model.removeAttribute('disabled', 'disabled');
        form.elements.link.parentElement.
            classList.remove('lead-form__group--disabled');
        form.elements.model.parentElement.
            classList.remove('lead-form__group--disabled');
      }
    });
  }
  if ('undefined' !== typeof form) {
    elems = Object.values(form.elements).
        filter((el) => el && el.classList.contains('is-editable'));
    const phone = form.elements.phone;
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

  const customSelects = document.querySelectorAll('.lead-form__custom-select');
  // Attach click event listeners to each custom select
  customSelects.forEach(function(sel) {
    const selectSelected = sel.querySelector('.lead-form__select-selected');
    const selectItems = sel.querySelector('.lead-form__select-items');
    const options = selectItems.querySelectorAll('div');
    const selHidden = sel.previousElementSibling;
    selectSelected.addEventListener('click', function() {
      if (selectItems.style.display === 'block') {
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      } else {
        selectItems.style.display = 'block';
        selectSelected.classList.add('is-open');
      }
    });
    // Set the selected option and hide the dropdown when an option is clicked
    options.forEach(function(option) {
      option.addEventListener('click', function() {
        selectSelected.textContent = option.textContent;
        selHidden.value = option.dataset.value;
        const selItem = selHidden
            .querySelector(`[value="${option.dataset.value}"]`);
        selItem.dispatchEvent(new Event('click'));
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      });
    });
    // Close the dropdown if the user clicks outside of it
    window.addEventListener('click', function(e) {
      if (!sel.contains(e.target)) {
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      }
    });
  });
});
