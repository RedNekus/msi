@extends('msi')
@section('content')
<?php
    $employment = [
        1465 => "Наемный сотрудник",
        1467 => "Собственник бизнеса",
        1469 => "Самозанятый",
        1471 => "Индивидуальный предприниматель",
        1473 => "Государственный служащий",
        1475 => "Пенсионер",
        1477 => "Работающий пенсионер",
        1479 => "Безработный",
    ];
    $employment_type = 1465;
    $activity_type = 0;
    $activities = App\Models\Bitrix::getActivitiesList();
?>
<div class="form-container">
    <div class="form-title">Личный доход</div>
    <p class="lead-form__info">Укажите тип занятости и сверу деятельности организации, в которой работаете, а так же размер среднемесячного дохода</p>
    <form class="lead-form" action="/user/income" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="employment_type">Тип занятости</legend>
            <select class="lead-form__select" name="employment_type" id="employment_type">
                <option value="">Выбрать…</option>
                @foreach($employment as $key=>$val)
                <option value="{{$key}}" @if($key === $employment_type) selected @endif>{{$val}}</option>
                @endforeach
            </select>
            <div class="lead-form__custom-select">
                <div class="lead-form__select-selected">
                    {{ $employment[$employment_type] ?? 'Выбрать…' }}
                </div>
                <div class="lead-form__select-items">
                    <div data-value="">Выбрать…</div>
                    @foreach($employment as $key=>$val)
                    <div data-value="{{$key}}">{{$val}}</div>
                    @endforeach
                </div>
            </div>
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="activity_type">Вид экономической деятельности</legend>
            <select class="lead-form__select" name="activity_type" id="activity_type">
                <option value="">Выбрать…</option>
                @foreach($activities as $key=>$val)
                <option value="{{$key}}" @if($key === $activity_type) selected @endif>{{$val}}</option>
                @endforeach
            </select>
            <div class="lead-form__custom-select">
                <div class="lead-form__select-selected">
                    {{ $activities[$activity_type] ?? 'Выбрать…' }}
                </div>
                <div class="lead-form__select-items">
                    <div data-value="">Выбрать…</div>
                    @foreach($activities as $key=>$val)
                    <div data-value="{{$key}}">{{$val}}</div>
                    @endforeach
                </div>
            </div>
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="income">Среднемесячный доход</legend>
            <input class="lead-form__control" type="text" name="income" id="income" value="">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="pension">Размер пенсии</legend>
            <input class="lead-form__control" type="text" name="pension" id="pension" value="">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__back"><a href="/address">Назад</a></div>
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection