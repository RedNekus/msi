@extends('msi')
@section('content')
<?php
    if(isset($data->subject)) {
        $firstrname = $data->subject->name_ru->given_name_ru;
        $lastname = $data->subject->name_ru->family_name_ru;
        $middlename = $data->subject->name_ru->middle_name_ru;
        $year = substr($data->subject->birthdate, 0, 4);
        $month = substr($data->subject->birthdate, 4, -2);
        $day = substr($data->subject->birthdate, -2);
        $birthdate = "$day.$month.$year";
        $gender = $data->subject->sex === 'male' ? "М" : "Ж";
        $phone = "+" . trim($data->contact->phones[0]);
    }  else {
        extract($data);
        $firstrname = &$name;
        $gender = isset($gender) && $gender !== 0? 'М' : 'Ж';
        if(isset($birthdate)) {
            $birthdate = explode(" ", $birthdate)[0];
            $birthdate = array_reverse(explode("-", $birthdate));
            $birthdate = implode(".", $birthdate);
        }
    }
?>
<div class="form-container">
    <div class="form-title">Личные данные</div>
    <form class="lead-form" action="/profile" method="POST">
        @csrf
        <fieldset class="lead-form__group lead-form__group--disabled">
            <legend class="lead-form__label" for="firstrname">Имя</legend>
            <input class="lead-form__control" type="text" name="firstrname" id="firstrname" readonly="readonly" value="{{$firstrname}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group lead-form__group--disabled">
            <legend class="lead-form__label" for="lastname">Фамилия</legend>
            <input class="lead-form__control" type="text" name="lastname" id="lastname" readonly="readonly" value="{{$lastname ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group lead-form__group--disabled">
            <legend class="lead-form__label" for="middlename">Отчество</legend>
            <input class="lead-form__control" type="text" name="middlename" id="middlename" readonly="readonly" value="{{$middlename ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group lead-form__group--disabled">
            <legend class="lead-form__label" for="gender">Пол</legend>
            <input class="lead-form__control" type="text" name="gender" id="gender" readonly="readonly" value="{{$gender}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group lead-form__group--disabled">
            <legend class="lead-form__label" for="birthday">День рождения</legend>
            <input class="lead-form__control" type="text" name="birthday" id="birthday" readonly="readonly" value="{{$birthdate ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <fieldset class="lead-form__group lead-form__group--disabled is-editable">
            <legend class="lead-form__label" for="phone">Мобильный телефон</legend>
            <input class="lead-form__control" type="text" name="phone" id="phone" readonly="readonly" value="{{$phone ?? ''}}">
            <div class="messages"></div>
        </fieldset>
        <!-- <div class="lead-form__edit">
            <a class="lead-form__edit-action" href="#" data-action="edit">Редактировать данные</a>
        </div> -->
        <div class="lead-form__bottom">
            <input class="lead-form__button" type="submit" value="Далее">
        </div>
    </form>
</div>
@endsection