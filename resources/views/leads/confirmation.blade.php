@extends('msi')
@section('content')
<pre>
<?php
?>
</pre>
<div class="form-container form-container--auth">
    <div class="form-container__title mb-0">Подтвердите данные</div>
    <div class="form-container__text">Мы отправили SMS-код на номер +375 (29) 161 93 54. Введите его.</div>
    <form class="lead-form" action="lead/add/confirmation" method="POST">
        @csrf
        <p class="lead-form__info">Повторный код можно получить через 59 с</p>
        <fieldset class="lead-form__group mt-0">
            <input class="lead-form__control" type="text" name="workplace" id="workplace" placeholder="SMS-код">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__back"><a href="#">Назад</a></div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Подтвердить">
        </div>
    </form>
</div>
@endsection