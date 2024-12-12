@extends('msi')
@section('content')
<pre>
<?php
    //var_dump($data);
?>
</pre>
<div class="form-container">
    <div class="form-container__title">Для дальнейшего рассмотрения Вашей заявки, пожалуйста, подтвердите согласие на предоставление данных</div>
    <form class="lead-form" action="/lead/add/agreements" method="POST">
        @csrf
        <div>Посмотреть согласие на предоставление кредитного отчета</div>
        <div class="lead-form__link"><a href="#">Посмотреть согласие на предоставление кредитного отчета</a></div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_report" id="agreement_report" value="1">
            <label class="lead-form__check-label" for="agreement_report">Выражаю согласие Обществу с ограниченной ответственностью «Ювилс Лизинг» на предоставление ему Национальным банком Республики Беларусь моего кредитного отчета для заключения и сопровождения договора финансовой аренды (лизинга).</label>
          </div>
          <div class="lead-form__link"><a href="#">Посмотреть согласие на хранение и обработку персональных данных</a></div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_personal" id="agreement_personal" value="1">
            <label class="lead-form__check-label" for="agreement_personal">Выражаю согласие Обществу с ограниченной ответственностью «Ювилс Лизинг» на хранение и обработку персональных данных</label>
          </div>
          <div class="lead-form__link"><a href="#">Посмотреть политику конфиденциальности</a></div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_politic" id="agreement_politic" value="1">
            <label class="lead-form__check-label" for="agreement_politic">Согласен с условиями политики конфиденциальности</label>
          </div>
          <div class="lead-form__back"><a href="/register-address">Назад</a></div>
          <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
          </div>
    </form>
</div>
@endsection