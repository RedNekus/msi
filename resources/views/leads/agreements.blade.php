@extends('msi')
@section('content')
<div class="form-container">
    <div class="form-container__title">Для дальнейшего рассмотрения Вашей заявки, пожалуйста, подтвердите согласие на предоставление данных</div>
    <form class="lead-form" action="/lead/add/agreements" method="POST" id="agreements">
        @csrf
        <!-- <div>Посмотреть согласие на предоставление кредитного отчета</div> -->
        <div class="lead-form__link"><a href="/areement-report" target="_blank">Посмотреть согласие на предоставление кредитного отчета</a></div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_report" id="agreement_report" value="1" @if(isset($agreement_report) && $agreement_report) checked @endif>
            <label class="lead-form__check-label" for="agreement_report">Выражаю согласие Обществу с ограниченной ответственностью «Ювилс Лизинг» на предоставление ему Национальным банком Республики Беларусь моего кредитного отчета для заключения и сопровождения договора финансовой аренды (лизинга).</label>
            <div class="messages"></div>
          </div>
          <div class="lead-form__link"><a href="/areement-personal" target="_blank">Посмотреть согласие на хранение и обработку персональных данных</a></div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_personal" id="agreement_personal" value="1" @if(isset($agreement_personal) && $agreement_personal) checked @endif>
            <label class="lead-form__check-label" for="agreement_personal">Выражаю согласие Обществу с ограниченной ответственностью «Ювилс Лизинг» на хранение и обработку персональных данных</label>
            <div class="messages"></div>
          </div>
          <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="agreement_fszn" id="agreement_fszn" value="1" @if(isset($agreement_fszn) && $agreement_fszn) checked @endif>
            <label class="lead-form__check-label" for="agreement_fszn">Выражаю согласие Обществу с ограниченной ответственностью «Ювилс Лизинг» на получение данных из ФСЗН</label>
            <div class="messages"></div>
          </div>
          <div class="lead-form__link"><a href="/areement-fszn" target="_blank">Посмотреть согласие на получение данных из ФСЗН</a></div>
          <div class="lead-form__back"><a href="/register-address">Назад</a></div>
          <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
          </div>
    </form>
</div>
@endsection