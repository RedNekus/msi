@extends('msi')
@section('content')
<div class="form-container">
    <div class="form-container__title">Предмет лизинга</div>
    <form class="lead-form" action="/lead/add" method="POST">
        @csrf
        @if(isset($id) && $id > 0)
            <input type="hidden" name="id" id="id" value="{{$id}}" autocomplete="off">
        @endif
        <div class="lead-form__check">
            <input class="lead-form__check-input" type="checkbox" name="decided" id="decided">
            <label class="lead-form__check-label" for="decided">Не определился с предметом лизинга</label>
        </div>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="link">Ссылка на автомобиль</legend>
            <input class="lead-form__control" type="text" name="link" id="link" placeholder="*Ссылка" value="{{$lead->link ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="model">Марка</legend>
            <input class="lead-form__control" type="text" name="model" id="model" placeholder="*Марка" value="{{$lead->model ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="price">Стоимость ($)</legend>
            <input class="lead-form__control" type="text" name="price" id="price" placeholder="*1000" value="{{$lead->price ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="term">Срок лизинга</legend>
            <input class="lead-form__control" type="text" name="term" id="term" placeholder="*3 года" value="{{$lead->term ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="down_payment">Первоначальный взнос (%)</legend>
            <input class="lead-form__control" type="text" name="down_payment" id="down_payment" placeholder="*10%" value="{{$lead->down_payment ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a href="/register-address">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection