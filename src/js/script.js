import iMask from 'imask';
import validate from 'validate.js';

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
  if ('undefined' !== typeof form && form.elements) {
    elems = Object.values(form.elements);
    if (elems) {
      elems.filter((el) => el.nodeName === 'INPUT' &&
        el.classList.contains('is-editable'));
    }
    const phone = form.elements.phone;
    if ('undefined' !== typeof phone) {
      iMask(phone,
          {
            mask: '+{375} (00) 000-00-00',
            lazy: true,
          },
      ).on('complete', function() {
        // todo:
      });
    }

    Object.values(form.elements).forEach((el) =>{
      if (el.nodeName === 'INPUT') {
        el.addEventListener('change', () => {
          el.classList.remove('invalid');
          let msg = el.parentElement.querySelector('.messages');
          if (!msg) {
            msg = el.parentElement
                .parentElement.querySelector('.messages');
          }
          if (msg) {
            msg.classList.remove('error');
            msg.innerHTML = '';
          }
        });
      }
    });
    const checkFields = (constraints) => {
      const errors = validate(form, constraints);
      if (errors) {
        Object.entries(errors).forEach(([id, error]) => {
          let isRadio = 0;
          let input = form.elements[id];
          if (input instanceof Array || input instanceof RadioNodeList) {
            input = input[0];
            isRadio = 1;
          }
          if (input) {
            input.classList.add('invalid');
            let msg = input.parentElement.querySelector('.messages');
            if (isRadio && !msg) {
              msg = input.parentElement
                  .parentElement.querySelector('.messages');
            }
            if (null !== msg) {
              msg.innerHTML = error[0];
              msg.classList.add('error');
            }
          }
        });
        return false;
      } else {
        return true;
      }
    };
    form.addEventListener('submit', (e) => {
      if (form.id === 'agreements') {
        e.preventDefault();
        // const data = new FormData(form);
        const constraints = {
          agreement_report: {
            presence: {
              message: `^Подтвердите согласие на предоставление
              кредитного отчета`,
            },
          },
          agreement_personal: {
            presence: {
              message: `^Подтвердите согласие на хранение и
              обработку персональных данных`,
            },
          },
          agreement_fszn: {
            presence: {
              message: `^Подтвердите согласие на получение данных из ФСЗН`,
            },
          },
        };
        if (checkFields(constraints)) {
          form.submit();
        }
      }
      if (form.id === 'register_address') {
        e.preventDefault();
        const constraints = {
          matches: {
            presence: {
              message: `^Выберетите значение!`,
            },
          },
        };
        if (checkFields(constraints)) {
          form.submit();
        }
      }
    });
  }

  if (null !== form && form.id === 'confirmation') {
    const timer = document.querySelector(`[data-timer]`);
    const resend = document.querySelector(`[data-resend]`);
    const timeEl = document.querySelector(`[data-time]`);
    const timerFunc = () => {
      const timerId = setInterval(() => {
        let time = timeEl.dataset.time;
        --time;
        if (time >= 0) {
          timeEl.innerHTML = time;
          timeEl.dataset.time = time;
        } else {
          clearInterval(timerId);
          timer.classList.add(`is-hidden`);
          resend.classList.remove(`is-hidden`);
        }
      }, 1000);
    };
    timerFunc();
    resend.addEventListener('click', async (e) => {
      e.preventDefault();
      timeEl.innerHTML = 59;
      timeEl.dataset.time = 59;
      timer.classList.remove(`is-hidden`);
      resend.classList.add(`is-hidden`);
      const response = await fetch('/lead/sendsms');
      if (response.ok) {
        const json = await response.json();
        console.log(json);
      }
      timerFunc();
    });
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
