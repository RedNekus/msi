@extends('msi')
@section('content')
<?php
?>
<div class="form-container">
    <div class="form-title">Кредитная нагрузка</div>
    <p class="lead-form__info">Укажите сумму ежемесячных платежей по действующим кредитам, займам, картам рассрочки, лизингам, факторингам или иным обязтельствам в банках, микрофинансовых, лизинговых организациях, организациях торговли (сервиса), а так же суммарную текущую просроченную задолженность по данным обязательствам (основной долг и проценты).</p>
    <form class="lead-form" action="/profile" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="firstrname">Размер ежемесячных платежей</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="firstrname">Размер текущей просрочки</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" value="">
            <div class="messages"></div>
        </fieldset>
        <div class="form-title">Иные платежи</div>
        <p  class="lead-form__info">Укажите прочие ежемесячные платежи, а так же размер удержаний по исполнительным листам, если таковые имеются.</p>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="firstrname">Коммунальные платежи</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="firstrname">Алименты</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="firstrname">Исполнительные листы</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" value="">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection