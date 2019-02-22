<?php

header("Content-type: text/css");

echo '#tabs {
	background: rgb('.(int)$_GET['r']*0.6.', '.(int)$_GET['g']*0.6.', '.(int)$_GET['b']*0.6.');
}
.login_form .fas {
	color: rgb('.(int)(255*0.4+$_GET['r']*0.6).', '.(int)(255*0.4+$_GET['g']*0.6).', '.(int)(255*0.4+$_GET['b']*0.6).');
}
.login_form .button {
	background: rgb('.(int)$_GET['r'].', '.(int)$_GET['g'].', '.(int)$_GET['b'].');
}
.login_form .button:hover {
	background: rgb('.(int)$_GET['r']*0.6.', '.(int)$_GET['g']*0.6.', '.(int)$_GET['b']*0.6.');
}';