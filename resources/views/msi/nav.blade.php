<?php
    $cur_uri = $_SERVER['REQUEST_URI'];
    if($cur_uri === '/address') {
        $cur_uri = '/register-address';
    }
    //$step = session()->get('step') ?? 0;
    $step = 0;
    $links = [
        1 => ['/profile', 'Личные данные', 'steps__item'],
        ['/passport', 'Документ, удостоверяющий личность', 'steps__item'],
        ['/register-address', 'Адрес регистрации', 'steps__item'],
        //['/user/income', 'Личный доход', 'steps__item'],
        //['/user/pdn', 'Кредитная нагрузка', 'steps__item'],
        ['/lead/add/agreements', 'Подписание согласий', 'steps__item'],
        ['/lead/add/confirmation', 'Подтверждение данных', 'steps__item']
    ];
    foreach($links as $num => $link) {
        if($cur_uri === $link[0]) {
            $step = $num;
            $links[$num][2] .= ' steps__item--active';
        } 
    }
    foreach($links as $num => $link) {
        if($num > $step) {
            $links[$num][2] .= ' steps__item--inactive';
        }
    }
?>
<nav class="steps">  
    @foreach($links as $link)
        <div class="{{$link[2]}}"><span>{{$link[1]}}</span></div>
    @endforeach
</nav>