<?php

function db_init($server) {
	global $connexion;

	$host = $_SESSION['CONNECTION'][$server]['HOST'];
	$user = $_SESSION['CONNECTION'][$server]['USER'];
	$pwd = $_SESSION['CONNECTION'][$server]['PWD'];

	//TODO Virer le @ qui est utile pour éviter de tout péter quand on affiche les warnings. Afficher les erreurs à l'utilisateur ?
	$connexion = @new mysqli($host, $user, $pwd);
	if ($connexion->connect_errno) {
		return false;
	}
	$connexion->set_charset("utf-8");
	return true;
}
function db_query($query) {
	global $connexion;
	if(!isset($connexion)) {
		db_init();
	}
	if(!$results = $connexion->query($query)) {
		throw new DBException('Query failed', 1, $query, $connexion->error);
	}
	return $results;
}

function db_perform($table, $array) {
	foreach($array as &$element) {
		if($element != 'NOW()') {
			$element = "'".$element."'";
		}
	}
	db_query("INSERT INTO ".$table."(".implode(',', array_keys($array)).") VALUES (".implode(',', $array).")");
}
function db_fetch_all($query, $resulttype = MYSQLI_ASSOC) {
	return $query->fetch_all($resulttype);
}

function db_fetch_array($query, $resulttype = MYSQLI_ASSOC) {
	return $query->fetch_array($resulttype);
}

function db_free($query) {
	$query->free();
}

function db_num_rows($query) {
	return $query->num_rows;
}
function db_decode($string) {
	return utf8_encode($string);
}

function db_input($string) {
	global $connexion;
	if(!isset($connexion)) {
		db_init();
	}
	return $connexion->escape_string($string);
}
function db_session_start() {
	mb_internal_encoding('UTF-8');
	session_start();
}

function db_session_close() {
	session_write_close();
}

function db_int($value) {
	return (int)$value;
}

function db_float($value) {
	return (float)$value;
}

function db_str($value) {
	return addslashes($value);
}

class DBException extends Exception {
	private $query;
	private $query_error;

	public function __construct($message = '', $code = 0, $query = '', $query_error = '', Throwable $previous = NULL) {
		$this->query = $query;
		$this->query_error = $query_error;
		parent::__construct($message, $code, $previous);
	}

	public function get_query() {
		return $this->query;
	}
	public function get_query_error() {
		return $this->query_error;
	}
}