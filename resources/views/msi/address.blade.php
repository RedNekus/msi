@extends('msi')
@section('content')
<pre>
<?php
    //var_dump($deal);
    //var_dump($user);
?>
</pre>
<div class="form-container">
    <div class="form-container__title">Адрес проживания</div>
    <form class="lead-form" action="/address" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="zip_code">Почтовый индекс</legend>
            <input class="lead-form__control" type="text" name="zip_code" id="zip_code" placeholder="220000">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="settlement">Населенный пункт</legend>
            <input class="lead-form__control" type="text" name="settlement" id="settlement" placeholder="Минск">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="street">Улица</legend>
            <input class="lead-form__control" type="text" name="street" id="street" placeholder="Ленина">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="house">Дом</legend>
            <input class="lead-form__control" type="text" name="house" id="house" placeholder="1">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="housing">Корпус</legend>
            <input class="lead-form__control" type="text" name="housing" id="housing" placeholder="№">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="apartment">Квартира</legend>
            <input class="lead-form__control" type="text" name="apartment" id="apartment" placeholder="№">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a href="/passport">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection