@extends('msi')
@section('content')
<div class="form-container">
    <div class="form-container__title">Адрес проживания</div>
    <form class="lead-form" action="/register-address" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="zip_code">Почтовый индекс</legend>
            <input class="lead-form__control" type="text" name="zip_code" id="zip_code" placeholder="220000" value="{{$zip_code ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="settlement">Населенный пункт</legend>
            <input class="lead-form__control" type="text" name="settlement" id="settlement" placeholder="Минск" value="{{$settlement ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="street">Улица</legend>
            <input class="lead-form__control" type="text" name="street" id="street" placeholder="Ленина" value="{{$street ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="house">Дом</legend>
            <input class="lead-form__control" type="text" name="house" id="house" placeholder="1" value="{{$house ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="housing">Корпус</legend>
            <input class="lead-form__control" type="text" name="housing" id="housing" placeholder="№" value="{{$housing ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="apartment">Квартира</legend>
            <input class="lead-form__control" type="text" name="apartment" id="apartment" placeholder="№" value="{{$apartment ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a id="back" href="/passport" data-href="/address">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
        <div class="lead-form__radio-block">
            <legend>Адрес регистрации совпадает с адресом проживания?</legend>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="matches" id="matches_0" value="0">
                <label class="lead-form__radio-label" for="matches_0">Нет</label>
            </p>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="matches" id="matches_1" value="1">
                <label class="lead-form__radio-label" for="matches_1">Да</label>
            </p>
        </div>
    </form>
</div>
@endsection