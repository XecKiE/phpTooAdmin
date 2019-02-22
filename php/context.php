<?php

class Context {
	private static $singleton = null;

	private $server;
	private $database;
	private $table;
	private $control;
	private $color;
	private $logged_in = false;

	private function __construct() {
		$this->server   = isset($_POST['server'])   ? $_POST['server']   : (isset($_GET['server'])   ? $_GET['server']   : null);
		$this->database = isset($_POST['database']) ? $_POST['database'] : (isset($_GET['database']) ? $_GET['database'] : null);
		$this->table    = isset($_POST['table'])    ? $_POST['table']    : (isset($_GET['table'])    ? $_GET['table']    : null);
		$this->control  = isset($_POST['control'])  ? $_POST['control']  : (isset($_GET['control'])  ? $_GET['control']  : null);
		$this->detail   = isset($_POST['detail'])   ? $_POST['detail']   : (isset($_GET['detail'])   ? $_GET['detail']   : []  );
		$this->color    = ['r' => 182, 'g' => 183, 'b' => 177];
		$this->ajax     = isset($_GET['ajax']);
		if(!isset($_SESSION['token'])) {
			$_SESSION['token'] = bin2hex(random_bytes(20));
		}

		if($this->server != null) {
			if($_POST['login'] && $_POST['password'] && !SERVERS[$this->server]['PWD']) {
				$_SESSION['CONNECTION'][$this->server] = [
					'HOST' => SERVERS[$this->server]['HOST'],
					'USER' => SERVERS[$this->server]['USER']?:db_str($_POST['login']),
					'PWD' => SERVERS[$this->server]['PWD']?:db_str($_POST['password']),
				];
			}
			if($_GET['action'] == 'logout') {
				unset($_SESSION['CONNECTION'][$this->server]);
			}
			if(!$_SESSION['CONNECTION'][$this->server] && SERVERS[$this->server]['HOST'] && SERVERS[$this->server]['USER'] && SERVERS[$this->server]['PWD']) {
				$_SESSION['CONNECTION'][$this->server] = [
					'HOST' => SERVERS[$this->server]['HOST'],
					'USER' => SERVERS[$this->server]['USER']?:db_str($_POST['login']),
					'PWD' => SERVERS[$this->server]['PWD']?:db_str($_POST['password']),
				];
			}

			if(isset(SERVERS[$this->server]['COLOR'])) {
				$this->color = SERVERS[$this->server]['COLOR'];
			}

			if($_SESSION['CONNECTION'][$this->server]) {
				if(db_init($this->server)) {
					$this->logged_in = true;
				} else {
					unset($_SESSION['CONNECTION'][$this->server]);
				}
			}
		}
	}

	public function server()      { return $this->server;                                  }
	public function server_name() { return SERVERS[$this->server]['NAME'];                 }
	public function database()    { return $this->database;                                }
	public function table()       { return $this->table;                                   }
	public function control()     { return $this->control;                                 }
	public function detail( )     { return $this->detail;                                  }
	public function color()       { return $this->color;                                   }
	public function user()        { return $_SESSION['CONNECTION'][$this->server]['USER']; }
	public function logged_in()   { return $this->logged_in;                               }
	public function ajax()        { return $this->ajax;                                    }
	public function token()       { return $_SESSION['token'];                             }
	
	public function get_json() {
		$return = [];
		if($this->server !== null) {
			$return['server'] = $this->server;
		}
		if($this->database !== null) {
			$return['database'] = $this->database;
		}
		if($this->table !== null) {
			$return['table'] = $this->table;
		}
		if($this->control !== null) {
			$return['control'] = $this->control;
		}
		return json_encode($return);
	}

	public static function get() {
		if(is_null(self::$singleton)) {
			self::$singleton = new Context();
		}

		return self::$singleton;
	}
}

function c() {
	return Context::get();
}