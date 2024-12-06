<?php
    $cur_uri =$_SERVER['REQUEST_URI'];
    $step = session()->get('step') ?? 0;
    $links = [
        1 => ['/profile', 'Личные данные', 'steps__item'],
        ['/passport', 'Документ, удостоверяющий личность', 'steps__item'],
        ['/register-address', 'Адрес регистрации', 'steps__item'],
        ['/lead/add', 'Предмет лизинга', 'steps__item'],
        ['/lead/add/info', 'Дополнительная информация', 'steps__item'],
        ['/lead/add/agreements', 'Подписание согласий', 'steps__item'],
        ['/lead/add/confirmation', 'Подтверждение данных', 'steps__item']
    ];
    foreach($links as $num => $link) {
        if($cur_uri === $link[0]) {
            $links[$num][2] .= ' steps__item--active';
        } else if($num > $step) {
            $links[$num][2] .= ' steps__item--inactive';
        }
    }
?>
<nav class="steps">  
    @foreach($links as $link)
        <div class="{{$link[2]}}"><a href="{{$link[0]}}">{{$link[1]}}</a></div>
    @endforeach
</nav>