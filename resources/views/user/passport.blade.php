@extends('msi')
@section('content')
<?php
    $document_types = [
        "Паспорт",
        "id-карта",
        "Иностранный паспорт",
        "Вид на жительство РБ",
        "Удостоверение беженца"
    ];
    if(empty($document_type)) {
        $document_type =  null;
    }
?>
<div class="form-container">
    <div class="form-container__title">Документ, удостоверяющий личность</div>
    <form class="lead-form" action="/passport" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_type">Тип документа</legend>
            <select class="lead-form__select" name="document_type" id="document_type">
                <option value="">Выбрать…</option>
                @foreach($document_types as $type)
                <option value="{{$type}}" @if($type === $document_type) selected @endif>{{$type}}</option>
                @endforeach
            </select>
            <div class="lead-form__custom-select">
                <div class="lead-form__select-selected">
                    {{ $document_type ?? 'Выбрать…' }}
                </div>
                <div class="lead-form__select-items">
                    <div data-value="">Выбрать…</div>
                    @foreach($document_types as $type)
                    <div data-value="{{$type}}">{{$type}}</div>
                    @endforeach
                </div>
            </div>
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_number">Идентификационный номер</legend>
            <input class="lead-form__control" type="text" name="document_number" id="document_number" placeholder="Номер" value="{{$document_number ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_series">Серия и номер паспорта</legend>
            <input class="lead-form__control" type="text" name="document_series" id="document_series" placeholder="Номер и серия" value="{{$document_series ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_date">Дата выдачи</legend>
            <input class="lead-form__control" type="text" name="document_date" id="document_date" placeholder="Дата" value="{{$document_date ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="document_validity">Срок действия</legend>
            <input class="lead-form__control" type="text" name="document_validity" id="document_validity" placeholder="Дата" value="{{$document_validity ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="issuedby">Орган, выдавший документ</legend>
            <input class="lead-form__control" type="text" name="issuedby" id="issuedby" placeholder="Орган" value="{{$issuedby ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a href="/profile">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection