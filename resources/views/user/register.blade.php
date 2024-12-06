@extends('blank')
@section('content')
<div class="form-container form-container--auth">
    <div class="form-container__title">Регистрациия</div>
    <div>
        <img src="./img/logo.svg" alt="Ваши возможности лизинга">
    </div>
    <form class="lead-form" action="/register" method="POST">
        @csrf
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="phone" id="phone" placeholder="Введите номер телефона">
            <div class="messages"></div>
        </div>
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="name" id="name" placeholder="Имя">
            <div class="messages"></div>
        </div>
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="lastname" id="lastname" placeholder="Фамилия">
            <div class="messages"></div>
        </div>
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="middlename" id="middlename" placeholder="Отчество">
            <div class="messages"></div>
        </div>
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="password" id="password" placeholder="Пароль">
            <div class="messages"></div>
        </div>
        <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="politic" id="politic">
            <label class="lead-form__check-label" for="politic"> <span>Cогласен с условиями <a href="#">Политики конфиденциальности</a></span></label>
        </div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Зарегистрироваться">
        </div>
    </form>
    <div class="lead-form__footer">
        <p><a href="/passport">Назад</a></p>
    </div>
</div>
@endsection
