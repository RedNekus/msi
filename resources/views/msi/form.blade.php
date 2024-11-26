@extends('msi')
@section('content')
<pre>
<?php
    //var_dump($deal);
    //var_dump($user);
?>
</pre>
<div class="form-container">
    <div class="form-container__title">Предмет лизинга</div>
    <form class="lead-form" action="/cabinet" method="POST">
        @csrf
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="workplace">Место работы</legend>
            <input class="lead-form__control" type="text" name="workplace" id="workplace" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="position">Должность</legend>
            <input class="lead-form__control" type="text" name="position" id="position" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="experience">Стаж работы на последнем месте</legend>
            <input class="lead-form__control" type="text" name="experience" id="experience" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="income"><p><span>Среднемесяный доход</span> <span>за последние 3 месяца</span></p></legend>
            <input class="lead-form__control" type="text" name="income" id="income" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="hr_phone"><p><span>Телефон отдела кадров /</span> <span>бухгалтерии</span></p></legend>
            <input class="lead-form__control" type="text" name="hr_phone" id="hr_phone" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="marital_status">Семейное положение</legend>
            <input class="lead-form__control" type="text" name="marital_status" id="marital_status" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="spouse_name"><p><span>ФИО супруга(и) / ближайшего</span> <span>родственника</span></p></legend>
            <input class="lead-form__control" type="text" name="spouse_name" id="spouse_name" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="spouse_phone">Мобильный телефон</legend>
            <input class="lead-form__control" type="text" name="spouse_phone" id="spouse_phone" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="spouse_workplace">Где и кем работает</legend>
            <input class="lead-form__control" type="text" name="spouse_workplace" id="spouse_workplace" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="spouse_income"><p><span>Среднемесячный доход</span> <span>за последние 3 месяца</span></p></legend>
            <input class="lead-form__control" type="text" name="spouse_income" id="spouse_income" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="dependents">Количество иждивенцев</legend>
            <input class="lead-form__control" type="text" name="dependents" id="dependents" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="contact_person">Контактное лицо</legend>
            <input class="lead-form__control" type="text" name="contact_person" id="contact_person" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group">
            <legend class="lead-form__label" for="person_phone">Мобильный телефон</legend>
            <input class="lead-form__control" type="text" name="person_phone" id="person_phone" placeholder="*">
            <div class="messages"></div>
        </fieldset>
        <div class="lead-form__radio-block">
            <legend>Привлекались к уголовной / административной ответственности?</legend>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="liability" id="liability_0" value="1">
                <label class="lead-form__radio-label" for="liability_0">Нет</label>
            </p>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="liability" id="liability" value="">
                <label class="lead-form__radio-label" for="liability">Да</label>
            </p>
            <p class="lead-form__radio is-hidden" data-shown>
                <input class="lead-form__radio-input" type="radio" name="liability" id="liability_1" value="2">
                <label class="lead-form__radio-label" for="liability_1">Привлекался к административной ответственности</label>
            </p>
            <p class="lead-form__radio is-hidden" data-shown>
                <input class="lead-form__radio-input" type="radio" name="liability" id="liability_2" value="3">
                <label class="lead-form__radio-label" for="liability_2">Привлекался к уголовной ответственности</label>
            </p>
            <p class="lead-form__radio is-hidden" data-shown>
                <input class="lead-form__radio-input" type="radio" name="liability" id="liability_3" value="4">
                <label class="lead-form__radio-label" for="liability_3">Привлекался к административной и уголовной ответственности</label>
            </p>
        </div>
        <div class="lead-form__radio-block">
            <legend>Имеются ли у Вас не исполненные решения суда?</legend>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="decisions" id="decisions_0" value="1">
                <label class="lead-form__radio-label" for="decisions_0">Нет</label>
            </p>
            <p class="lead-form__radio">
                <input class="lead-form__radio-input" type="radio" name="decisions" id="decisions_1" value="2">
                <label class="lead-form__radio-label" for="decisions_1">Да</label>
            </p>
        </div>
        <div class="lead-form__bottom">
            <div class="lead-form__back"><a href="#">Назад</a></div>
            <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection