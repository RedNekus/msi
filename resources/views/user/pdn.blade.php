@extends('msi')
@section('content')
<?php
?>
<div class="form-container">
    <div class="form-title">Кредитная нагрузка</div>
    <p class="lead-form__info">Укажите сумму ежемесячных платежей по действующим кредитам, займам, картам рассрочки, лизингам, факторингам или иным обязтельствам в банках, микрофинансовых, лизинговых организациях, организациях торговли (сервиса), а так же суммарную текущую просроченную задолженность по данным обязательствам (основной долг и проценты).</p>
    <form class="lead-form" action="/user/pdn" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="current_payment">Размер ежемесячных платежей</legend>
            <input class="lead-form__control" type="text" name="current_payment" id="current_payment" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="overdue_amount">Размер текущей просрочки</legend>
            <input class="lead-form__control" type="text" name="overdue_amount" id="overdue_amount" value="">
            <div class="messages"></div>
        </fieldset>
        <div class="form-title">Иные платежи</div>
        <p  class="lead-form__info">Укажите прочие ежемесячные платежи, а так же размер удержаний по исполнительным листам, если таковые имеются.</p>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="utility_payment">Коммунальные платежи</legend>
            <input class="lead-form__control" type="text" name="utility_payment" id="utility_payment" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="alimony">Алименты</legend>
            <input class="lead-form__control" type="text" name="alimony" id="alimony" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="writs_of_execution">Исполнительные листы</legend>
            <input class="lead-form__control" type="text" name="writs_of_execution" id="writs_of_execution" value="">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__back"><a href="/user/income">Назад</a></div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection