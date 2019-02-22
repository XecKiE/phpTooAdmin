<?php

require 'php/app_start.php';

c();

if($_GET['ajax']) {
	$json = [];
	try {
		if(c()->server() !== null && !c()->logged_in() && !in_array($_GET['action'], ['login', 'logout', 'new_tab'])) {
			$json['need_login'] = get_login_form();
		} else {
			switch($_GET['action']) {
				case 'login':
					if(c()->logged_in()) {
						$json = [
							'title' => 'Connexion à '.p(c()->server_name()),
							'confirm' => 'Connexion réussie pour l\'utilisateur '.p(c()->user()),
							'server' => c()->server(),
						];
					} else {
						$json = [
							'title' => 'Connexion à '.p(c()->server_name()),
							'warning' => 'Connexion échouée pour l\'utilisateur '.p(c()->user())
						];
					}
					break;
				case 'logout':
					if(c()->server() !== null) {
						if(c()->logged_in()) {
							$json = [
								'title' => 'Déconnexion de '.p(c()->server_name()),
								'warning' => 'Deconnexion échouée pour l\'utilisateur '.p(c()->user),
							];
						} else {
							$json = [
								'title' => 'Déconnexion de '.p(c()->server_name()),
								'confirm' => 'Deconnexion réussie pour l\'utilisateur '.p(c()->user),
								'login_form' => get_login_form(),
							];
						}
					} else {
						$json = [
							'title' => 'Déconnexion impossible',
							'warning' => 'Il n\'est pas possible de se déconnecter sans avoir sélectionnée un serveur',
						];
					}
					break;
				case 'new_tab':
					$json = [
						'tab' => get_tab($_GET['tab_nb'], false),
						'page' => get_page($_GET['tab_nb'], false),
					];
					break;
				case 'get_server':
					$json = get_server();
					break;
				case 'get_database':
					$json = get_database($_POST['server']);
					break;
				case 'get_table':
					$json = get_table($_POST['server'], $_POST['table']);
					break;
				case 'get_content_and_controls':
					$json['controls'] = get_controls();
				case 'get_content':
					$json['content'] = get_content();
					break;
			}
		}
	} catch(DBException $e) {
		$json['error'] = $e->get_query_error();
	}
	echo json_encode($json);
} else {
	echo get_html();
}

require 'php/app_end.php';