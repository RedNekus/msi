@extends('blank')
@section('content')
<div class="form-container form-container--auth">
    <div class="form-container__title">Вход в личный кабинет</div>
    <div>
        <img src="./img/logo.svg" alt="Ваши возможности лизинга">
    </div>
    <form class="lead-form" action="/auth" method="POST">
        @csrf
        <div class="lead-form__group">
            <input class="lead-form__control" type="text" name="phone" id="phone" placeholder="Ваш номер телефона">
            <div class="messages"></div>
        </div>
        <div class="lead-form__group">
            <input class="lead-form__control" type="password" name="password" id="password" placeholder="Пароль">
            <div class="messages"></div>
        </div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Войти">
        </div>
    </form>
    <div class="lead-form__footer">
        <p>Нет аккаунта?</p>
        <p><a href="/register">Зарегистрироваться</a></p>
    </div>
</div>
@endsection
