<?php

function get_html() {
	return '<!doctype html>
<html lang="fr">
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0">
		<title>phpTooAdmin</title>
		<link id="favicon" rel="icon" href="img/favicon.php?r='.(int)c()->color()['r'].'&g='.(int)c()->color()['g'].'&b='.(int)c()->color()['b'].'" />
		<meta charset="utf-8">
		<link id="theme" rel="stylesheet" href="css/style.php?r='.(int)c()->color()['r'].'&g='.(int)c()->color()['g'].'&b='.(int)c()->color()['b'].'" />
		<script src="lib/fuzzy/fuzzy.js"></script>
		<link rel="stylesheet" href="lib/fuzzy/fuzzy.css" />
		<script src="lib/codemirror/lib/codemirror.js"></script>
		<link rel="stylesheet" href="lib/codemirror/lib/codemirror.css" />
		<script src="lib/codemirror/mode/sql/sql.js"></script>
		<link rel="stylesheet" href="lib/fontawesome/css/all.min.css" />
		<script src="js/script.js"></script>
		<link rel="stylesheet" href="css/style.css" />
	</head>
	<body>
		<div id="tabs">
			'.get_tab().'
			<div onclick="tab_new();" id="new_tab">&nbsp;+&nbsp;</div>
		</div>
		<div id="pages">
			'.get_page().'
		</div>
		<div id="notifications">
		</div>
		<script>
			var breadcrumb_server = '.json_encode(get_server()).';
			var breadcrumb_database = '.json_encode(c()->server() !== null?[c()->server() => get_database()]:[]).';
			var breadcrumb_table = '.json_encode(c()->server() !== null && c()->database()?[c()->server() => [c()->database() => get_table()]]:[]).';
			var start_context = '.c()->get_json().';
			document.addEventListener("DOMContentLoaded", initialize);
			var login_on_start = '.(c()->server() !== null && !c()->logged_in() ? json_encode(get_login_form()) : 'null').';
		</script>
		<input type="hidden" name="token" value="'.p(c()->token()).'" />
	</body>
</html>';
}

function get_tab($nb = 0, $focus = true) {
	if(c()->server() !== null) {
		if(c()->database()) {
			if(c()->table()) {
				$title = c()->table();
			} else {
				$title = c()->database();
			}
		} else {
			$title = c()->control()?:'welcome';
		}
	} else {
		$title = c()->control()?:'welcome';
	}
	return '<div onclick="focus_tab(this);" id="tab_'.$nb.'" class="tab'.($focus?' selected':'').'" data-id="'.$nb.'">'.$title.'</div>';
}

function get_page($nb = 0, $focus = true) {
	$return = '<div id="page_'.$nb.'" class="page'.($focus?' selected':'').'">
				<div class="header">
					<div class="breadcrumb">
						<div class="breadcrumb_icons" onclick="back_server();"><i class="fas fa-home"></i></div>
						<div class="breadcrumb_icons" onclick="logout();"><i class="fas fa-sign-out-alt"></i></div>
						<div class="breadcrumb_icons" onclick="load_content();"><i class="fas fa-sync-alt"></i></div>
						<div class="fuzzy breadcrumb_server"><input placeholder="Choisir un serveur"'.(c()->server() !== null?' value="'.p(c()->server_name()).'"':'').'/></div>
						<div class="fuzzy breadcrumb_database"><input placeholder="Choisir une base de données" '.(c()->server() !== null?'':'disabled').''.(c()->database()?' value="'.p(c()->database()).'"':'').'/></div>
						<div class="fuzzy breadcrumb_table"><input placeholder="Choisir une table" '.(c()->server() !== null && c()->database()?'':'disabled').''.(c()->table()?' value="'.p(c()->table()).'"':'').'/></div>
					</div>
					<div class="controls">
						'.get_controls().'
					</div>
				</div>
				<div class="content">
					'.get_content().'
				</div>
			</div>';
	return $return;
}

function get_controls() {
	if(c()->server() !== null) {
		if(c()->database()) {
			if(c()->table()) {
				return '<div onclick="load_content({add: {control: \'display\'}});">Afficher</div>
						<div onclick="load_content({add: {control: \'structure\'}});">Structure</div>
						<div onclick="load_content({add: {control: \'sql\'}});">SQL</div>
						<div onclick="load_content({add: {control: \'search\'}});">Rechercher</div>
						<div onclick="load_content({add: {control: \'insert\'}});">Insérer</div>
						<div onclick="load_content({add: {control: \'export\'}});">Export</div>
						<div onclick="load_content({add: {control: \'import\'}});">Import</div>
						<div onclick="load_content({add: {control: \'privileges\'}});">Privilèges</div>
						<div onclick="load_content({add: {control: \'operations\'}});">Opérations</div>
						<div onclick="load_content({add: {control: \'déclencheurs\'}});">Déclencheurs</div>';
			} else {
				return '<div onclick="load_content({add: {control: \'structure\'}});">Structure</div>
						<div onclick="load_content({add: {control: \'sql\'}});">SQL</div>
						<div onclick="load_content({add: {control: \'export\'}});">Export</div>
						<div onclick="load_content({add: {control: \'import\'}});">Import</div>
						<div onclick="load_content({add: {control: \'privileges\'}});">Privilèges</div>
						<div onclick="load_content({add: {control: \'operations\'}});">Opérations</div>
						<div onclick="load_content({add: {control: \'suivi\'}});">Suivi</div>
						<div onclick="load_content({add: {control: \'déclencheurs\'}});">Déclencheurs</div>';
			}
		} else {
			return '<div onclick="load_content({add: {control: \'welcome\'}});">Accueil</div>
						<div onclick="load_content({add: {control: \'structure\'}});">Base de données</div>
						<div onclick="load_content({add: {control: \'sql\'}});">SQL</div>
						<div onclick="load_content({add: {control: \'status\'}});">État</div>
						<div onclick="load_content({add: {control: \'users\'}});">Utilisateurs</div>
						<div onclick="load_content({add: {control: \'export\'}});">Export</div>
						<div onclick="load_content({add: {control: \'import\'}});">Import</div>';
		}
	} else {
		return '<div onclick="load_content({add: {control: \'welcome\'}});">Accueil</div>
						<div onclick="load_content({add: {control: \'tuto\'}});">Tutoriels</div>
						<div onclick="load_content({add: {control: \'settings\'}});">Paramètres</div>';

	}
}


function get_content() {
	if(c()->server() !== null) {
		if(c()->logged_in()) {
			if(c()->database()) {
				if(c()->table()) {
					return get_content_table();
				} else {
					return get_content_database();
				}
			} else {
				return get_content_server();
			}
		}
	} else {
		return get_content_welcome();
	}
}

function get_content_welcome() {
	$return = '';

	switch(c()->control()) {
		case 'tuto':
			break;
		case 'status':
			break;
		case 'welcome':
		default:
			$return .= '<div class="welcome">
						<img class="welcome_logo" src="img/logo.gif"/>
						<div class="welcome_title">Bienvenue dans phpTooAdmin</div>
						<div class="welcome_boxes">
							<div>
								<div>Tutoriels</div>
								<ul>
									<li>Introduction à phpTooAdmin</li>
									<li>Utilisation avancée</li>
								</ul>
							</div>
							<div>
								<div>Versions</div>
								<ul>
									<li>phpTooAdmin</li>
									<li>Serveur Web</li>
									<li>Serveur de BDD</li><!--TODO FUU je suis pas forcément connecté ici, donc j\'ai pas ces infos...-->
								</ul>
							</div>
							<div>
								<div>Paramètres</div>
								<ul>
									<li>Fonctionnalités</li>
									<li>Raccourcis</li>
									<li>Cosmétique</li>
									<li>Modules</li>
								</ul>
							</div>
						</div>
					</div>';
			break;
	}
	return $return;
}

function get_content_server() {
	$return = '';

	switch(c()->control()) {
		case 'structure':
			break;
		case 'sql':
			return get_content_sql();
			break;
		case 'status':
			break;
		case 'users':
			break;
		case 'export':
			break;
		case 'import':
			break;
		case 'welcome':
		default:
			$return .= '<div class="welcome">
						<div class="welcome_boxes">
							<div>
								<div>Serveur de base de données</div>
								<ul>
								</ul>
							</div>
							<div>
								<div>Serveur Web</div>
								<ul>
								</ul>
							</div>
						</div>
					</div>';
			break;
	}
	return $return;
}

function get_content_database() {
	$return = '';

	switch(c()->control()) {
		case 'sql':
			return get_content_sql();
			break;
		case 'export':
			break;
		case 'import':
			break;
		case 'privileges':
			break;
		case 'operations':
			break;
		case 'suivi':
			break;
		case 'déclencheurs':
			break;
		case 'structure':
		default:
			$tables_info = get_tables_info();
			$return .= '<table class="table">
						<thead>
							<tr>
								<th>Table</th>
								<th>Actions</th>
								<th>Lignes</th>
								<th>Type</th>
								<th>Encodage</th>
								<th>Taille</th>
							</tr>
						</thead>
						<tbody>';
			foreach($tables_info as $table_info) {
				$return .= '
							<tr>
								<td>'.p($table_info['name']).'</td>
								<td></td>
								<td>'.p($table_info['lignes']).'</td>
								<td>'.p($table_info['moteur']).'</td>
								<td>'.p($table_info['collation']).'</td>
								<td>'.p($table_info['size']).'</td>
							</tr>';
			}
			$return .= '
						</tbody>
					</table>';
			break;
	}
	return $return;
}

function get_content_table() {
	$return = '';
	$table_info = get_table_info();


	switch(c()->control()) {
		case 'display':
			$return .= get_data_table_from_query();
			break;
		case 'sql':
			return get_content_sql();
			break;
		case 'search':
			break;
		case 'insert':
			break;
		case 'export':
			break;
		case 'import':
			break;
		case 'privileges':
			break;
		case 'operations':
			break;
		case 'suivi':
			break;
		case 'déclencheurs':
			break;
		case 'structure':
		default:
			//Columns
			$return .= '<table class="table">
						<thead>
							<tr>
								<th>Nom</th>
								<th>Type</th>
								<th>Encodage</th>
								<th>Null</th>
								<th>Valeur par défaut</th>
								<th>Commentaires</th>
								<th>Extra</th>
							</tr>
						</thead>
						<tbody>';
			foreach($table_info['columns'] as $column) {
				$keys = [];
				foreach($column['indexes'] as $index) {
					//TODO Explain index in popup
					//TODO petit chiffre pour indiquer la cardinalité
					if($index['name'] == 'PRIMARY') {
						$keys[] = '<i class="fas fa-key key_primary"></i>';
					} else if($index['unique']) {
						$keys[] = '<i class="fas fa-key key_unique"></i>';
					} else {
						$keys[] = '<i class="fas fa-key key_index"></i>';
					}
				}
				foreach($column['foreign_keys'] as $foreign_key) {
					$keys[] = '<i class="fas fa-key key_foreign"></i>';
				}
				$keys = $keys ? ' '.implode(' ', $keys) : '';
				$return .= '
							<tr>
								<td>'.p($column['name']).$keys.'</td>
								<td>'.p($column['type']).'</td>
								<td>'.p($column['collation']).'</td>
								<td>'.p($column['nullable']).'</td>
								<td>'.p($column['default']).'</td>
								<td>'.p($column['comment']).'</td>
								<td>'.p($column['extra']).'</td>
							</tr>';
			}
			$return .= '
						</tbody>
					</table>';

			//Indexes
			$return .= '<table class="table">
						<thead>
							<tr>
								<th>Nom</th>
								<th>Type</th>
								<th>Unique</th>
								<th>Commentaire</th>
								<th>Colonne</th>
								<th>Cardinalité</th>
								<th>Interclassment</th>
								<th>Null</th>
							</tr>
						</thead>
						<tbody>';
			foreach($table_info['indexes'] as $index) {
				$return .= '
							<tr>
								<td rowspan="'.count($index['columns']).'">'.p($index['name']).'</td>
								<td rowspan="'.count($index['columns']).'">'.p($index['type']).'</td>
								<td rowspan="'.count($index['columns']).'">'.p($index['unique']).'</td>
								<td rowspan="'.count($index['columns']).'">'.p($index['comment']).'</td>';
				$first = true;
				foreach($index['columns'] as $column) {
					if(!$first) {
						$return .= '
							</tr>
							<tr>';
					}
					$return .= '
								<td>'.p($column['name']).'</td>
								<td>'.p($column['cardinality']).'</td>
								<td>'.p($column['collation']).'</td>
								<td>'.p($column['nullable']).'</td>';
					$first = false;
				}
				$return .= '
							</tr>';
			}
			$return .= '
						</tbody>
					</table>';

			//Foreign keys
			$return .= '<table class="table">
						<thead>
							<tr>
								<th>Nom</th>
								<th>Colonne</th>
								<th>Référence</th>
							</tr>
						</thead>
						<tbody>';
			foreach($table_info['foreign_keys'] as $foreign_key) {
				$return .= '
							<tr>
								<td rowspan="'.count($foreign_key['columns']).'">'.p($foreign_key['name']).'</td>';
				$first = true;
				foreach($foreign_key['columns'] as $column) {
					if(!$first) {
						$return .= '
							</tr>
							<tr>';
					}
					$return .= '
								<td>'.p($column['origin_column']).'</td>
								<td>'.p($foreign_key['destination_database']).' - '.p($foreign_key['destination_table']).' - '.p($column['destination_column']).'</td>';
					$first = false;
				}
				$return .= '
							</tr>';
			}
			$return .= '
						</tbody>
					</table>';
			break;
	}
	return $return;
}


function get_content_sql() {
	$return = '';

	$return .= '<form class="form" onsubmit="sql_execute(this); return false;">
						<textarea class="highlight" name="sql_query">'.c()->detail['sql_query'].'</textarea>
						<div>
							<button type="submit" class="btn" onclick="sql_empty(this.form); return false;">Vider</button>
							<button type="submit" class="btn" onclick="sql_format(this.form); return false;">Formatter</button>
							<button type="submit" class="btn">Exécuter</button>
						</div>
					</form>';

	if(!c()->ajax()) {
		$return .= '
					<script>
						init_highlight();
					</script>';
	}

	$return .= get_data_table_from_query(c()->detail['sql_query']);

	return $return;
}

function get_login_form() {
	return '
					<form class="login_form" method="post" onsubmit="login(this); return false;">
						<input type="hidden" name="server" value="'.c()->server().'" />
						<label>
							<div>
								<i class="fas fa-user-circle"></i>
							</div>
							<input type="text" name="user" placeholder="Utilisateur" autofocus />
						</label>
						<label>
							<div>
								<i class="fas fa-lock"></i>
							</div>
							<input type="password" name="password" placeholder="Mot de passe" />
						</label>
						<input type="submit" class="button" value="Se connecter" />
					</form>';
}

function get_data_table_from_query($query = null) {
	$results = get_data_from_query($query);
	$return .= '
					<table class="table">
						<thead>
							<tr>';
	foreach($results['legend'] as $legend) {
		$return .= '
								<td>'.p($legend).'</td>';
	}
	$return .= '
							</tr>
						</thead>
						<tbody>';
	foreach($results['rows'] as $row) {
		$return .= '
							<tr>';
		foreach($row as $data) {
			$return .= '
								<td>'.p($data).'</td>';
		}
		$return .= '
							</tr>';
	}
	$return .= '
						</tbody>
					</table>';
	return $return;
}