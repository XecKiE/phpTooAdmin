"use strict";


/*************************************************************************************************/
/*                                         INITIALIZATION                                        */
/*************************************************************************************************/
function initialize() {
	window.addEventListener('keydown', on_key_down);
	TABS.current_tab = document.querySelector('#tabs > .selected');
	TABS.current_page = document.querySelector('#pages > .selected');
	initialize_page(0, start_context);
	if(login_on_start !== null) {
		request_login(login_on_start, 0, null, load_content);
	}
};




/*************************************************************************************************/
/*                                         TAB MANAGEMENT                                        */
/*************************************************************************************************/
var TABS = {
	tab_nb: 0,
	current_tab: null,
	current_page: null,
	current_id: 0,
};
function focus_tab(_dom) {
	if(TABS.current_tab !== null) {
		TABS.current_tab.classList.remove('selected');
		TABS.current_page.classList.remove('selected');
	}
	TABS.current_tab = _dom;
	TABS.current_tab.classList.add('selected');
	TABS.current_id = TABS.current_tab.dataset.id;
	TABS.current_page = document.getElementById('page_'+TABS.current_id);
	TABS.current_page.classList.add('selected');
	set_url();
}
function tab_close() {
	if(TABS.current_tab !== null) {
		var n = TABS.current_tab.previousElementSibling;
		if(n === null) {
			n = TABS.current_tab.nextElementSibling;
		}
		TABS.current_tab.remove();
		TABS.current_page.remove();
		if(n !== null && n.id !== 'new_tab') {
			TABS.current_tab = n;
			TABS.current_tab.classList.add('selected');
			TABS.current_id = TABS.current_tab.dataset.id;
			TABS.current_page = document.getElementById('page_'+TABS.current_id);
			TABS.current_page.classList.add('selected');
			set_url();
		} else {
			TABS.current_tab = null;
			TABS.current_page = null;
		}
	}
}
function tab_left() {
	if(TABS.current_tab !== null) {
		var n = TABS.current_tab.previousElementSibling;
		if(n === null) {
			n = document.getElementById('new_tab').previousElementSibling;
		}
		if(n !== null) {
			TABS.current_tab.classList.remove('selected');
			TABS.current_page.classList.remove('selected');
			TABS.current_tab = n;
			TABS.current_tab.classList.add('selected');
			TABS.current_id = TABS.current_tab.dataset.id;
			TABS.current_page = document.getElementById('page_'+TABS.current_id);
			TABS.current_page.classList.add('selected');
			set_url();
		}
	}
}
function tab_right() {
	if(TABS.current_tab !== null) {
		var n = TABS.current_tab.nextElementSibling;
		if(n.id === 'new_tab') {
			n = null;
		}
		if(n === null) {
			n = TABS.current_tab.parentElement.firstElementChild;
		}
		if(n !== null) {
			TABS.current_tab.classList.remove('selected');
			TABS.current_page.classList.remove('selected');
			TABS.current_tab = n;
			TABS.current_tab.classList.add('selected');
			TABS.current_id = TABS.current_tab.dataset.id;
			TABS.current_page = document.getElementById('page_'+TABS.current_id);
			TABS.current_page.classList.add('selected');
			set_url();
		}
	}
}

function tab_new() {
	var new_context = {};
	for(var i in PAGE[TABS.current_id].context) {
		new_context[i] = PAGE[TABS.current_id].context[i];
	}
	ajax({
		url: '/?ajax=1&action=new_tab&tab_nb='+(++TABS.tab_nb),
		method: 'post',
		responseType: 'json',
		data: new_context
	}).done(function(data) {
		if(TABS.current_tab !== null) {
			TABS.current_tab.classList.remove('selected');
			TABS.current_page.classList.remove('selected');
			TABS.current_tab.insertAdjacentHTML('afterend', data.tab);
			TABS.current_tab = TABS.current_tab.nextElementSibling;
		} else {
			var d = document.getElementById('new_tab');
			d.insertAdjacentHTML('beforebegin', data.tab);
			TABS.current_tab = d.previousElementSibling;
		}
		document.getElementById('pages').insertAdjacentHTML('beforeend', data.page);
		TABS.current_tab.classList.add('selected');
		TABS.current_id = TABS.current_tab.dataset.id;
		TABS.current_page = document.getElementById('page_'+TABS.current_id);
		TABS.current_page.classList.add('selected');
		initialize_page(TABS.current_id, new_context);
		set_url();
	});
}


/*************************************************************************************************/
/*                                              DOM                                              */
/*************************************************************************************************/
HTMLElement.prototype.replaceHTML = function(_html) {
	while(this.firstChild) {
		this.removeChild(this.firstChild);
	}
	this.insertAdjacentHTML('afterbegin', _html);
}


/*************************************************************************************************/
/*                                              AJAX                                             */
/*************************************************************************************************/
function ajax(_settings = {}) {
	var xhr = new XMLHttpRequest();
	xhr.tab_id = _settings.tab_id ? _settings.tab_id : TABS.current_id;
	xhr.settings = _settings;
	var url = _settings.url || window.location.href;
	var data = '';
	if(_settings.data) {
		if(typeof _settings.data == 'string') {
			data = _settings.data;
		} else if(typeof _settings.data == 'object') {
			data = json_to_uri(_settings.data);
		}
	}
	var method = _settings.method.toLowerCase() || 'post';
	if(method == 'get' && data) {
		if(url.indexOf('?') === -1) {
			url += '&'+data
		} else {
			url += '?'+data
		}
	}
	xhr.callback_done = [];
	xhr.callback_error = [];

	if(_settings.responseType) {
		xhr.responseType = _settings.responseType;
	}
	xhr.open(method, url);
	if(_settings.method == 'post' && data) {
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}

	//TODO Un prototype ou un truc du genre ?
	xhr.onreadystatechange = function() {
		if(this.readyState === XMLHttpRequest.DONE) {
			if(this.status === 200) {
				if(this.responseType == 'json' && this.response.need_login) {
					request_login(this.response.need_login, this.tab_id, this);
				} else {
					if(this.responseType == 'json') {
						for(var i in this.response) {
							switch(i) {
								case 'info':    info(   this.response.title, this.response.info   );break;
								case 'confirm': confirm(this.response.title, this.response.confirm);break;
								case 'warning': warning(this.response.title, this.response.warning);break;
								case 'error':   error(  this.response.title, this.response.error  );break;
								case 'alert':   alert(  this.response.title, this.response.alert  );break;
							}
						}
					}
					for(var i=0 ; i<this.callback_done.length ; i++) {
						this.callback_done[i](this.response);
					}
				}
			} else {
				for(var i=0 ; i<this.callback_error.length ; i++) {
					this.callback_error[i](this.status);
				}
			}
		}
	}

	if(method == 'post' && data) {
		xhr.send(data);
	} else {
		xhr.send();
	}
	return xhr;
}

XMLHttpRequest.prototype.done = function(_callback) {
	if(typeof _callback != 'undefined' && _callback !== null) {
		if(typeof _callback == 'object') {
			for(var i=0 ; i<_callback.length ; i++) {
				this.callback_done.push(_callback[i]);
			}
		} else {
			this.callback_done.push(_callback);
		}
	}
	return this;
}
XMLHttpRequest.prototype.error = function(_callback) {
	if(typeof _callback != 'undefined' && _callback !== null) {
		if(typeof _callback == 'object') {
			for(var i=0 ; i<_callback.length ; i++) {
				this.callback_error.push(_callback[i]);
			}
		} else {
			this.callback_error.push(_callback);
		}
	}
	return this;
}


/*************************************************************************************************/
/*                                             LOGIN                                             */
/*************************************************************************************************/
var login_waiting_popup = {},
	login_waiting_ajax = {},
	login_waiting_callbacks = {};

function request_login(_login_form, _tab_id, _ajax_query = null, _callback = null) {
	set_url();
	set_title();
	if(typeof login_waiting_popup[PAGE[_tab_id].context.server] == 'undefined') {
		login_waiting_popup[PAGE[_tab_id].context.server] = [];
	}
	if(!login_waiting_popup[PAGE[_tab_id].context.server].length) {
		//Add login form on current tab
		info('Il faut vous connecter pour continuer');
		login_waiting_popup[PAGE[_tab_id].context.server].push(new Popup({
			title: 'Se connecter',
			contentHTML: _login_form,
		}));

	}
	//Add ajax call to waiting list
	if(_ajax_query !== null) {
		if(typeof login_waiting_ajax[PAGE[_tab_id].context.server] == 'undefined') {
			login_waiting_ajax[PAGE[_tab_id].context.server] = [];
		}
		//TODO Vérifier que ça peut pas péter des trucs
		_ajax_query.settings.tab_id = _tab_id;
		login_waiting_ajax[PAGE[_tab_id].context.server].push({
			settings: _ajax_query.settings,
			callback_done: _ajax_query.callback_done,
			callback_error: _ajax_query.callback_error
		});
	}
	//Add callback to waiting list
	if(_callback !== null) {
		if(typeof login_waiting_callbacks[PAGE[_tab_id].context.server] == 'undefined') {
			login_waiting_callbacks[PAGE[_tab_id].context.server] = [];
		}
		login_waiting_callbacks[PAGE[_tab_id].context.server].push(_callback);
	}
}


function login(_dom) {
	ajax({
		url: '/?ajax=1&action=login',
		method: 'post',
		responseType: 'json',
		data: {
			server: _dom.server.value,
			login: _dom.user.value,
			password: _dom.password.value
		}
	}).done(function(data) {
		if(!data.error) {
			if(typeof login_waiting_popup[data.server] != 'undefined') {
				for(var i in login_waiting_popup[data.server]) {
					login_waiting_popup[data.server][i].close();
				}
				delete login_waiting_popup[data.server];
			}
			if(typeof login_waiting_ajax[data.server] != 'undefined') {
				for(var i in login_waiting_ajax[data.server]) {
					ajax(login_waiting_ajax[data.server][i].settings).done(login_waiting_ajax[data.server][i].callback_done).error(login_waiting_ajax[data.server][i].callback_error);
				}
				delete login_waiting_ajax[data.server];
			}
			if(typeof login_waiting_callbacks[data.server] != 'undefined') {
				for(var i in login_waiting_callbacks[data.server]) {
					login_waiting_callbacks[data.server][i]();
				}
				delete login_waiting_callbacks[data.server];
			}
		}
	});
}

function logout() {
	ajax({
		url: '/?ajax=1&action=logout',
		method: 'post',
		responseType: 'json',
		data: PAGE[TABS.current_id].context
	}).done(function(data) {
		if(data.login_form) {
			request_login(data.login_form, TABS.current_id, null, load_content);
		}
	});
}



/*************************************************************************************************/
/*                                        BREADCRUMB DATA                                        */
/*************************************************************************************************/
function refresh_server_list() {
	ajax({
		url: '/?ajax=1&action=get_server',
		method: 'post',
		responseType: 'json'
	}).done(function(data) {
		breadcrumb_server = data;
		PAGE[TABS.current_id].server_list.set_data(breadcrumb_server);
	});
}
function refresh_database_list(_server) {
	ajax({
		url: '/?ajax=1&action=get_database',
		method: 'post',
		responseType: 'json',
		data: {
			'server': _server
		}
	}).done(function(data) {
		breadcrumb_database[_server] = data;
		PAGE[TABS.current_id].database_list.set_data(breadcrumb_database[_server]);
	});
}
function refresh_table_list(_server, _database) {
	ajax({
		url: '/?ajax=1&action=get_table',
		method: 'post',
		responseType: 'json',
		data: {
			'server': _server,
			'database': _database
		}
	}).done(function(data) {
		if(!breadcrumb_table[_server]) {
			breadcrumb_table[_server] = {};
		}
		breadcrumb_table[_server][_database] = data;
		PAGE[TABS.current_id].table_list.set_data(breadcrumb_table[_server][_database]);
	});
}

function select_server(_server_color, _event) {
	var t = _server_color.split('|');
	var _server = t[0];
	var color = JSON.parse(t[1]);
	if(PAGE[TABS.current_id].context.server != _server) {
		PAGE[TABS.current_id].context.server = _server;
		PAGE[TABS.current_id].database_list.reset();
		PAGE[TABS.current_id].database_list.d_input.disabled = false;
		PAGE[TABS.current_id].table_list.reset();
		PAGE[TABS.current_id].table_list.d_input.disabled = true;
		console.log(color);
		document.getElementById('favicon').href = document.getElementById('favicon').href.replace(/(.*\?r=)[0-9]+(&g=)[0-9]+(&b=)[0-9]+(.*)/, '$1'+color.r+'$2'+color.g+'$3'+color.b+'$4');;
		document.getElementById('theme').href = document.getElementById('theme').href.replace(/(.*\?r=)[0-9]+(&g=)[0-9]+(&b=)[0-9]+(.*)/, '$1'+color.r+'$2'+color.g+'$3'+color.b+'$4');;
	}
	if(_event.type == 'keydown' && _event.key == 'Tab') {
		//TODO Load and Refrech datbase_list contnet
		refresh_database_list(PAGE[TABS.current_id].context.server);
		PAGE[TABS.current_id].database_list.focus();
	} else {
		//Load page content
		load_content({get_controls: true, remove: ['control', 'database', 'table']});
	}
}
function back_server(_event) {
	delete(PAGE[TABS.current_id].context.server);
	PAGE[TABS.current_id].server_list.reset();
	PAGE[TABS.current_id].database_list.reset();
	PAGE[TABS.current_id].table_list.reset();
	PAGE[TABS.current_id].database_list.d_input.disabled = true;
	PAGE[TABS.current_id].table_list.d_input.disabled = true;
	load_content({get_controls: true, remove: ['control']});
}
function focus_server() {
	refresh_server_list();
}

function select_database(_database, _event) {
	if(PAGE[TABS.current_id].context.database != _database) {
		PAGE[TABS.current_id].context.database = _database;
		PAGE[TABS.current_id].table_list.reset();
		PAGE[TABS.current_id].table_list.d_input.disabled = false;
	}
	//TODO Load and Refrech table_list contnet
	refresh_table_list(PAGE[TABS.current_id].context.server, PAGE[TABS.current_id].context.database);
	if(_event.type == 'keydown' && _event.key == 'Tab') {
		PAGE[TABS.current_id].table_list.focus();
	} else {
		//Load page content
		load_content({get_controls: true, remove: ['control', 'table']});
	}
}
function back_database(_event) {
	delete(PAGE[TABS.current_id].context.database);
	PAGE[TABS.current_id].database_list.reset();
	PAGE[TABS.current_id].table_list.reset();
	PAGE[TABS.current_id].table_list.d_input.disabled = true;
	PAGE[TABS.current_id].server_list.focus();
}
function focus_database() {
	refresh_database_list(PAGE[TABS.current_id].context.server);
}

function select_table(_table, _event) {
	if(PAGE[TABS.current_id].context.table != _table) {
		PAGE[TABS.current_id].context.table = _table;
		//TODO Load and Refrech datbase_list contnet
		//Load page content
	}
	load_content({get_controls: true, remove: ['control']});
}
function back_table(_event) {
	delete(PAGE[TABS.current_id].context.table);
	PAGE[TABS.current_id].table_list.reset();
	PAGE[TABS.current_id].database_list.focus();
}
function focus_table() {
	refresh_table_list(PAGE[TABS.current_id].context.server, PAGE[TABS.current_id].context.database);
}

function open_breadcrumb() {
	if(typeof PAGE[TABS.current_id].context.table != 'undefined' && PAGE[TABS.current_id].context.table !== null) {
		PAGE[TABS.current_id].table_list.focus();
	} else if(typeof PAGE[TABS.current_id].context.database != 'undefined' && PAGE[TABS.current_id].context.database !== null) {
		PAGE[TABS.current_id].database_list.focus();
	} else {
		PAGE[TABS.current_id].server_list.focus();
	}
}


/*************************************************************************************************/
/*                                            CONTENT                                            */
/*************************************************************************************************/
function load_content(_options = {}) {
	var tab_id = TABS.current_id;
	if(_options.tab_id) {
		tab_id = options.tab_id;
	}
	if(_options.add) {
		for(var i in _options.add) {
			PAGE[tab_id].context[i] = _options.add[i];
			delete PAGE[tab_id].context.detail; //TODO Quand on change de page, ça vire les détails, il faudrait gérer ça dans une fonction à part
		}
	}
	if(_options.remove) {
		for(var i=0 ; i<_options.remove.length ; i++) {
			delete PAGE[tab_id].context[_options.remove[i]];
			delete PAGE[tab_id].context.detail; //TODO Quand on change de page, ça vire les détails, il faudrait gérer ça dans une fonction à part
		}
	}
	set_url();
	set_title();
	if(PAGE[tab_id].requests.content != null) {
		PAGE[tab_id].requests.content.abort();
	}
	//TODO Ajouter le tab_id en paramètre de la méthode
	PAGE[tab_id].requests.content = ajax({
		url: '/?ajax=1&action=get_content'+(_options.get_controls?'_and_controls':''),
		method: 'post',
		responseType: 'json',
		data: PAGE[tab_id].context
	}).done(function(data) {
		//TODO Pour tout ces appels ajax : vérifier qu'on changement de page entre temps ne charge pas le contenu dans le mauvais onglet
		if(typeof data.content != 'undefined') {
			TABS.current_page.getElementsByClassName('content')[0].replaceHTML(data.content);
		}
		if(typeof data.controls != 'undefined') {
			TABS.current_page.getElementsByClassName('controls')[0].replaceHTML(data.controls);
		}

		init_highlight();
	});
}

function init_highlight() {
	var d = document.querySelectorAll('.highlight:not(.treated)');
	for(var i=0 ; i<d.length ; i++) {
		(function(_dom) {
			_dom.highlight = CodeMirror.fromTextArea(_dom);
			_dom.highlight.on('change', function(_editor) {
				_dom.value = _editor.getValue();
			});
			_dom.classList.add('treated');
		})(d[i]);
	}
}



/*************************************************************************************************/
/*                                              URL                                              */
/*************************************************************************************************/
function set_url() {
	var gets = [];
	if(PAGE[TABS.current_id].context.server) {
		gets.push('server='+PAGE[TABS.current_id].context.server);
	}
	if(PAGE[TABS.current_id].context.server && PAGE[TABS.current_id].context.database) {
		gets.push('database='+PAGE[TABS.current_id].context.database);
	}
	if(PAGE[TABS.current_id].context.server && PAGE[TABS.current_id].context.database && PAGE[TABS.current_id].context.table) {
		gets.push('table='+PAGE[TABS.current_id].context.table);
	}
	if(PAGE[TABS.current_id].context.control) {
		gets.push('control='+PAGE[TABS.current_id].context.control);
	}
	history.pushState({}, 'TODO', '?'+gets.join('&'));
}

function set_title() {
	if(PAGE[TABS.current_id].context.server) {
		if(PAGE[TABS.current_id].context.database) {
			if(PAGE[TABS.current_id].context.table) {
				PAGE[TABS.current_id].d_tab.textContent = PAGE[TABS.current_id].context.table;
			} else {
				PAGE[TABS.current_id].d_tab.textContent = PAGE[TABS.current_id].context.database;
			}
		} else {
			PAGE[TABS.current_id].d_tab.textContent = PAGE[TABS.current_id].context.control ? PAGE[TABS.current_id].context.control : 'welcome';
		}
	} else {
		PAGE[TABS.current_id].d_tab.textContent = PAGE[TABS.current_id].context.control ? PAGE[TABS.current_id].context.control : 'welcome';
	}
}


/*************************************************************************************************/
/*                                             PAGES                                             */
/*************************************************************************************************/
var PAGE = [];
function refresh_page(nb) {
	console.log('refresh '+nb);
}

function initialize_page(_id, _context = {}) {
	PAGE[_id] = {
		requests: {
			content: null
		}
	};

	PAGE[_id].context = _context

	PAGE[_id].d_tab = document.getElementById('tab_'+_id);
	PAGE[_id].d_page = document.getElementById('page_'+_id);

	PAGE[_id].d_server = PAGE[_id].d_page.getElementsByClassName('breadcrumb_server')[0];
	PAGE[_id].d_database = PAGE[_id].d_page.getElementsByClassName('breadcrumb_database')[0];
	PAGE[_id].d_table = PAGE[_id].d_page.getElementsByClassName('breadcrumb_table')[0];

	PAGE[_id].server_list = new Fuzzy(PAGE[_id].d_server, breadcrumb_server, {
		on_select: select_server,
		on_back: back_server,
		on_focus: focus_server
	});
	PAGE[_id].database_list = new Fuzzy(PAGE[_id].d_database, PAGE[_id].context.server ? breadcrumb_database[PAGE[_id].context.server] : null, {
		on_select: select_database,
		on_back: back_database,
		on_focus: focus_database
	});
	PAGE[_id].table_list = new Fuzzy(PAGE[_id].d_table, PAGE[_id].context.server && PAGE[_id].context.database ? breadcrumb_table[PAGE[_id].context.server][PAGE[_id].context.database] : null, {
		on_select: select_table,
		on_back: back_table,
		on_focus: focus_table
	});

}



/*************************************************************************************************/
/*                                          NOTIFICATION                                         */
/*************************************************************************************************/
/**
 * Open a javascript notification
 * @param  {object} _notif An object containing the following attributes :
 *                         * title: Title of the notification
 *                         * content: Content of the notification
 *                         * type: Type of the notification (info, confirm, alert(default), warning, error)
 *                         * time : Time before the notification dissapear (in seconds) (default: 3s), 0 for never ending
 * @return {object}        An object containing the notification
 */
function Notification(_notif = {}) {
	this.d_notif = document.createElement('div');
	this.d_notif.classList.add('notification', 'hidden');
	var icon = document.createElement('i');
	icon.classList.add('fas');
	if(typeof _notif.type == 'undefined') {
		_notif.type = 'alert';
	}
	switch(_notif.type) {
		case 'info':
			icon.classList.add('fa-info-circle');
			break;
		case 'confirm':
			icon.classList.add('fa-check-circle');
			break;
		case 'warning':
			icon.classList.add('fa-exclamation-triangle');
			break;
		case 'error':
			icon.classList.add('fa-times-circle');
			break;
		case 'alert':
		default:
			_notif.type = 'alert';
			icon.classList.add('fa-bell');
			break;
	}
	var t = document.createElement('div');
	t.appendChild(icon);
	this.d_notif.appendChild(t);
	this.d_notif.classList.add(_notif.type);
	var t = document.createElement('div');
	if(_notif.title) {
		var t2 = document.createElement('div');
		t2.textContent = _notif.title;
		t2.classList.add('title');
		t.appendChild(t2);
	}
	if(_notif.content) {
		var t2 = document.createElement('div');
		t2.textContent = _notif.content;
		t.appendChild(t2);
	}
	this.d_notif.appendChild(t);


	//Add listener to the notification
	var that = this;

	if(_notif.timeout !== 0) {
		if(!_notif.timeout) {
			_notif.timeout = 3;
		}
		setTimeout(function() {
			that.close();
		}, _notif.timeout*1000);
	}

	this.d_notif.addEventListener('click', function() {
		that.close();
	});

	//Add the notification to the document
	document.getElementById('notifications').insertAdjacentElement('afterbegin', this.d_notif);
	this.d_notif.style.marginTop = -(this.d_notif.offsetHeight+5)+'px';
	setTimeout(function() {
		that.d_notif.classList.remove('hidden');
		console.log(that.d_notif.style.marginTop);
		that.d_notif.style.marginTop = '5px';
	}, 5);
}
Notification.prototype.close = function() {
	this.d_notif.classList.add('hidden');
	this.d_notif.style.marginTop = -(this.d_notif.offsetHeight+5)+'px';
	var that = this;
	setTimeout(function() {
		that.d_notif.remove();
	}, 1000);
}

function info(_title = '', _content = '', _timeout = 2) {
	return new Notification({
		'type': 'info',
		'title': _title,
		'content': _content,
		'timeout': _timeout
	});
}
function confirm(_title = '', _content = '', _timeout = 2) {
	return new Notification({
		'type': 'confirm',
		'title': _title,
		'content': _content,
		'timeout': _timeout
	});
}
function warning(_title = '', _content = '', _timeout = 2) {
	return new Notification({
		'type': 'warning',
		'title': _title,
		'content': _content,
		'timeout': _timeout
	});
}
function error(_title = '', _content = '', _timeout = 0) {
	return new Notification({
		'type': 'error',
		'title': _title,
		'content': _content,
		'timeout': _timeout
	});
}
function alert(_title = '', _content = '', _timeout = 2) {
	return new Notification({
		'type': 'alert',
		'title': _title,
		'content': _content,
		'timeout': _timeout
	});
}


/*************************************************************************************************/
/*                                             POPUP                                             */
/*************************************************************************************************/
function Popup(_popup = {}) {
	this.d_popup = document.createElement('div');
	this.d_popup.classList.add('popup');
	//TODO Ajouter une croix dans le titre si la popup n'est pas bloquante
	var t2 = document.createElement('div');
	if(_popup.title) {
		t2.textContent = _popup.title;
	}
	t2.classList.add('title');
	this.d_popup.appendChild(t2);
	if(_popup.content || _popup.contentHTML) {
		var t2 = document.createElement('div');
		if(_popup.content) {
			t2.textContent = _popup.content;
		}
		if(_popup.contentHTML) {
			t2.insertAdjacentHTML('beforeend', _popup.contentHTML);
		}
		t2.classList.add('content');
		this.d_popup.appendChild(t2);
	}

	this.popup_bg = PAGE[TABS.current_id].d_page.getElementsByClassName('popup_bg')[0];
	if(!this.popup_bg) {
		this.popup_bg = document.createElement('div');
		this.popup_bg.classList.add('popup_bg');
		PAGE[TABS.current_id].d_page.insertAdjacentElement('afterbegin', this.popup_bg);
	}
	this.popup_bg.insertAdjacentElement('afterbegin', this.d_popup);
}
Popup.prototype.close = function() {
	this.d_popup.classList.add('hidden');
	this.d_popup.style.marginTop = -(this.d_popup.offsetHeight+5)+'px';
	var that = this;
	//TODO Animer la disparition
	setTimeout(function() {
		that.d_popup.remove();
		//TODO Animer la disparation du background sans risque (si une popup apparait pendant l'interval detemps le bg ne devrait finalement pas disparaitre
		if(that.popup_bg.querySelector('.popup:not(.hidden)') === null) {
			that.popup_bg.remove();
		}
	}, 1);
}




/*************************************************************************************************/
/*                                             EVENT                                             */
/*************************************************************************************************/
function on_key_down(event) {
	if(['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName.toUpperCase()) === -1) {
		var stop = false;
		if(event.ctrlKey && event.altKey && event.code == 'KeyT') {
			tab_new();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyQ') {
			tab_left();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyE') {
			tab_right();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyZ') {
			tab_close();
			stop = true;
		}
		if(event.code == 'Tab') {
			open_breadcrumb();
			stop = true;
		}
		if(stop) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
}



/*************************************************************************************************/
/*                                         FORMULAIRE SQL                                        */
/*************************************************************************************************/
function sql_execute(_form) {
	ctx_add_detail('sql_query', _form.sql_query.value);
	load_content();
}

function sql_empty(_form) {
	_form.sql_query.highlight.setValue('')
}

function sql_format(_form) {
	console.log('TODO');
}



/*************************************************************************************************/
/*                                            CONTEXTE                                           */
/*************************************************************************************************/
function ctx_add_detail(_key, _value, _id = null) {
	if(_id === null) {
		_id = TABS.current_id;
	}
	if(typeof PAGE[_id].context.detail == 'undefined') {
		PAGE[_id].context.detail = {};
	}
	PAGE[_id].context.detail[_key] = _value;
}



function json_to_uri(_value, _breadcrumb) {
	if(typeof _breadcrumb == 'undefined') {
		_breadcrumb = [];
	}
	if(Array.isArray(_value)) {
		var t = [];
		for(var i=0 ; i<_value.length ; i++) {
			var t2 = _breadcrumb.slice();
			t2.push({});
			t.push(json_to_uri(_value[i], t2));
		}
		return t.join('&');
	} else if(typeof _value == 'object') {
		var t = [];
		for(var i in _value) {
			var t2 = _breadcrumb.slice();
			t2.push(i)
			t.push(json_to_uri(_value[i], t2));
		}
		return t.join('&');
	} else {
		var t = '';
		for(var i=0 ; i<_breadcrumb.length ; i++) {
			if(typeof _breadcrumb[i] == 'object') {
				t += '[]';
			} else if(i == 0) {
				t += encodeURIComponent(_breadcrumb[i]);
			} else {
				t += '['+encodeURIComponent(_breadcrumb[i])+']';
			}
		}
		return t+'='+encodeURIComponent(_value);
	}

}