<?php
$domain = $_SERVER['HTTP_HOST'];
$protocol = 'https';
?>
<!DOCTYPE html>
<html lang="ru">
  <head>
    <title>МСИ (Yoowhils)</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <script src="/js/main.js"></script>
    <link href="https://fonts.cdnfonts.com/css/tt-norms-pro" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    <base href="{{$protocol}}://{{$domain}}">
    @hasSection('styles')
      @yield('styles')
    @endif
  </head>
  <body>
    @include('msi.header')
    @hasSection('tabs')
      @yield('tabs')
    @else
      <div class="container">
          @include('msi.nav')
      </div>
    @endif
    <main>
        @yield('content')
    </main>
    <footer></footer>
  </body>
</html>
