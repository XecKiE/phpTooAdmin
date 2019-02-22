<?php

function prout() {
	echo '<pre>';
	foreach(func_get_args() as $arg) {
		var_dump($arg);
	}
	echo '</pre>';
}

function redirect($url) {
	header('Location: '.$url);
	require 'php/app_end.php';
	die();
}

function p($text) {
	return htmlentities($text);
}

function get_server() {
	$return = [];
	foreach(SERVERS as $server_id => $server) {
		$return[] = [
			'key' => $server_id.'|'.json_encode($server['COLOR']?:['r' => 182, 'g' => 183, 'b' => 177]),
			'label' => $server['NAME'],
		];
	}
	return $return;
}

function get_database($server = null) {
	$return = [];
	if($server === null) {
		$server = c()->server();
	}
	if(c()->logged_in() && $server !== null) {
		$results = db_query("
			SELECT distinct TABLE_SCHEMA
			FROM information_schema.TABLES
			ORDER BY TABLE_SCHEMA ASC
		");
		while($row = db_fetch_array($results)) {
			$return[] = [
				'key' => $row['TABLE_SCHEMA'],
				'label' => $row['TABLE_SCHEMA'],
			];
		}
		db_free($results);
	}
	return $return;
}

function get_table($server = null, $database = null) {
	$return = [];
	if($server === null) {
		$server = c()->server();
	}
	if($database === null) {
		$database = c()->database();
	}
	if(c()->logged_in() && $server !== null && $database) {
		$results = db_query("
			SELECT distinct TABLE_NAME
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = '".db_str($database)."'
			ORDER BY TABLE_NAME ASC
		");
		while($row = db_fetch_array($results)) {
			$return[] = [
				'key' => $row['TABLE_NAME'],
				'label' => $row['TABLE_NAME'],
			];
		}
		db_free($results);
	}
	return $return;
}

function get_tables_info($server = null, $database = null) {
	$return = [];
	if($server === null) {
		$server = c()->server();
	}
	if($database === null) {
		$database = c()->database();
	}
	if(c()->logged_in() && $server !== null && $database) {
		$results = db_query("
			SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COLLATION, DATA_LENGTH
			FROM information_schema.TABLES
			WHERE TABLE_SCHEMA = '".db_str($database)."'
			ORDER BY TABLE_NAME
		");
		while($row = db_fetch_array($results)) {
			$return[$row['TABLE_NAME']] = [
				'name'      => $row['TABLE_NAME'],
				'lignes'    => $row['TABLE_ROWS'],
				'moteur'    => $row['ENGINE'],
				'collation' => $row['TABLE_COLLATION'],
				'size'      => $row['DATA_LENGTH'],
			];
		}
		return $return;
	} else {
		return false;
	}
}

function get_table_info($server = null, $database = null, $table = null) {
	$return = [];
	if($server === null) {
		$server = c()->server();
	}
	if($database === null) {
		$database = c()->database();
	}
	if($table === null) {
		$table = c()->table();
	}
	if(c()->logged_in() && $server !== null && $database && $table) {
		//On récupère les colonnes de la table
		//TODO Vérifier si d'autres informations sont pertinantes
		$results = db_query("
			SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT, EXTRA
			FROM information_schema.COLUMNS
			WHERE TABLE_SCHEMA = '".db_str($database)."'
				AND TABLE_NAME = '".db_str($table)."'
			ORDER BY ORDINAL_POSITION
		");
		$return['columns'] = [];
		while($row = db_fetch_array($results)) {
			$return['columns'][$row['COLUMN_NAME']] = [
				'name'         => $row['COLUMN_NAME'],
				'type'         => $row['COLUMN_TYPE'],
				'collation'    => $row['COLLATION_NAME'],
				'nullable'     => $row['IS_NULLABLE'],
				'default'      => $row['COLUMN_DEFAULT'],
				'comment'      => $row['COLUMN_COMMENT'],
				'extra'        => $row['EXTRA'],
				'indexes'      => [],
				'foreign_keys' => [],
			];
		}
		db_free($results);

		//On récupère les indexes de la table
		//TODO Vérifier si d'autres informations sont pertinantes, genre packed
		$results = db_query("
			SHOW INDEX FROM ".db_str($database).".".db_str($table)."
		");
		$return['indexes'] = [];
		while($row = db_fetch_array($results)) {
			if(!isset($return['indexes'][$row['Key_name']])) {
				$return['indexes'][$row['Key_name']] = [
					'name'    => $row['Key_name'],
					'type'    => $row['Index_type'],
					'comment' => $row['Comment'],
					'unique'  => !$row['Non_unique'],
					'columns' => [],
				];
			}
			$return['indexes'][$row['Key_name']]['columns'][] = [
				'name'        => $row['Column_name'],
				'cardinality' => $row['Cardinality'],
				'collation'   => $row['Collation'],
				'nullable'    => $row['Null'],
			];
			$return['columns'][$row['Column_name']]['indexes'][] = &$return['indexes'][$row['Key_name']];
		}
		db_free($results);

		//On récupère les clefs étrangères de la table
		//TODO Update ou restrict ou autre ??
		$results = db_query("
			SELECT *
			FROM information_schema.KEY_COLUMN_USAGE
			WHERE TABLE_SCHEMA = '".db_str($database)."'
				AND TABLE_NAME = '".db_str($table)."'
				AND REFERENCED_COLUMN_NAME IS NOT NULL
		");
		$return['foreign_keys'] = [];
		while($row = db_fetch_array($results)) {
			if(!isset($return['foreign_keys'][$row['CONSTRAINT_NAME']])) {
				$return['foreign_keys'][$row['CONSTRAINT_NAME']] = [
					'name'                 => $row['CONSTRAINT_NAME'],
					'origin_database'      => $row['TABLE_CATALOG'],
					'origin_table'         => $row['TABLE_SCHEMA'],
					'destination_database' => $row['REFERENCED_TABLE_SCHEMA'],
					'destination_table'    => $row['REFERENCED_TABLE_NAME'],
					'columns'              => [],
				];
			}
			$return['foreign_keys'][$row['CONSTRAINT_NAME']]['columns'][] = [
				'origin_column'      =>  $row['COLUMN_NAME'],
				'destination_column' =>  $row['REFERENCED_COLUMN_NAME'],
			];
			$return['columns'][$row['COLUMN_NAME']]['foreign_keys'][] = &$return['foreign_keys'][$row['CONSTRAINT_NAME']];
		}
		db_free($results);

		return $return;
	} else {
		return false;
	}
}

function get_data_from_query($query = null) {
	if($query === null) {
		$query = "
			SELECT *
			FROM ".c()->database().".".c()->table()."
		";
	}
	$return = [];
	if(c()->logged_in()) {
		$results = db_query($query); //TODO LIMIT 50
		$return['legend'] = [];
		$return['rows'] = [];
		while($row = db_fetch_array($results)) {
			if(!$return['legend']) {
				$return['legend'] = array_keys($row);
			}
			$return['rows'][] = $row;
		}
		db_free($results);
	}
	return $return;
}