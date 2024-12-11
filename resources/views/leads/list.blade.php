@extends('msi')
@section('styles')
<link rel="stylesheet" type="text/css" href="css/leads.css">
@endsection
@section('tabs')
<div class="container">
    <div class="tabs">
        <div class="tabs__button">Заявки</div>
    </div>
</div>
@endsection
@section('content')
<div class="container">
    <div class="leads__top">
        <h1 class="leads__header">Мои заявки</h1>
        <div class="leads__button"><a class="leads__main-btn" href="">Подать заявку на лизинг</a></div>
    </div>
    <div class="leads__descr">Для подачи заявки  необходимо пройти аутентификацию в межбанковской системе идентификации (МСИ)</div>
    @if($leads && count($leads))
        <div class="leads">
        @foreach ($leads as $num => $lead)
            <div class="leads__item">
                <h3 class="leads__title"> <a href="/lead/{{$lead->id}}">Заявка № {{$num + 1}}</a></h3>
                <div class="leads__block"> 
                    <p><strong>{{$lead->title}}</strong></p>
                </div>
                <div class="leads__block">
                    <p><strong>Статус</strong></p>
                    @if($lead->step < 7)
                        <div class="leads__btn leads__btn--require">Требует заполнения</div>
                    @else
                        <div class="leads__btn leads__btn--issued">Заявка оформлена</div>
                    @endif
                </div>
            </div>
        @endforeach
        </div>
    @else
        <div class="leads__empty">
            <div class="leads__empty-pic"><img src="/img/empty.svg"></div>
            <div class="leads__empty-title">Заявки не найдены</div>
            <div class="leads__empty-text">Ваши заявки появятся здесь, как только вы их создадите</div>
        </div>
    @endif
</div>
@endsection