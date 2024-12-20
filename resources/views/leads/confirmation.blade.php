@extends('msi')
@section('content')
<div class="form-container form-container--auth">
    <div class="form-container__title mb-0">Подтвердите данные</div>
    @if(!empty($phone))
    <div class="form-container__text">Мы отправили SMS-код на номер {{$phone}}. Введите его.</div>
    @elseif(!empty($error))
    <div class="form-container__text error">{{$error}}</div>
    @endif
    <form class="lead-form" action="lead/add/confirmation" method="POST" id="confirmation">
        @csrf
        <p class="lead-form__info" data-timer>Повторный код можно получить через <span data-time="59">59</span> с</p>
        <p class="lead-form__info is-hidden" data-resend><a href="">Получить код повторно</a></p>
        <fieldset class="lead-form__group mt-0">
            <input class="lead-form__control" type="text" name="code" id="code" placeholder="SMS-код">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__back"><a href="lead/add/agreements">Назад</a></div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Подтвердить">
        </div>
    </form>
</div>
@endsection