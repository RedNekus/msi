@extends('msi')
@section('content')
<pre>
<?php
    var_dump($data);
    //var_dump($deal);
    //var_dump($user);
?>
</pre>
<div class="form-container form-container--auth">
    <div class="form-container__title mb-0">Отчет успешно<br>сформирован!</div>
    <div class="form-container__text">Ожидайте обратной связи<br> от нашего специалиста</div>
</div>
@endsection