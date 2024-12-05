@extends('msi')
@section('content')
<pre>
<?php
    //var_dump($deal);
    //var_dump($user);
?>
</pre>
<div class="form-container">
    <div class="form-container__title">Документ, удостоверяющий личность</div>
    <form class="lead-form" action="/passport" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_type">Тип документа</legend>
            <input class="lead-form__control" type="text" name="document_type" id="document_type" placeholder="Паспорт">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_number">Идентификационный номер</legend>
            <input class="lead-form__control" type="text" name="document_number" id="document_number" placeholder="Номер">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_series">Серия и номер паспорта</legend>
            <input class="lead-form__control" type="text" name="document_series" id="document_series" placeholder="Номер и серия">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_date">Дата выдачи</legend>
            <input class="lead-form__control" type="text" name="document_date" id="document_date" placeholder="Дата">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_validity">Срок действия</legend>
            <input class="lead-form__control" type="text" name="document_validity" id="document_validity" placeholder="Дата">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="issuedby">Орган, выдавший документ</legend>
            <input class="lead-form__control" type="text" name="issuedby" id="issuedby" placeholder="Орган">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a href="#">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection