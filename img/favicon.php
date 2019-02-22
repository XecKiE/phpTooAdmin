<?php

$img = imagecreatefrompng('favicon.png');
imageAlphaBlending($img, true);
imageSaveAlpha($img, true);

imagefilter($img, IMG_FILTER_COLORIZE, $_GET['r'], $_GET['g'], $_GET['b']);

header('Content-Type: image/png');
imagepng($img);

imagedestroy($img);