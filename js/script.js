"use strict";


/*************************************************************************************************/
/*                                         INITIALIZATION                                        */
/*************************************************************************************************/
function initialize() {
	window.addEventListener('keydown', on_key_down);
	Page.current_tab = document.querySelector('#tabs > .selected');
	Page.current_page = document.querySelector('#pages > .selected');
	Page.pages[0] = new Page(0, start_context);
	if(login_on_start !== null) {
		request_login(login_on_start, 0, null, function() {
			Page.current().load_content();
		});
	}
};



/*************************************************************************************************/
/*                                              DOM                                              */
/*************************************************************************************************/
HTMLElement.prototype.replaceHTML = function(_html) {
	while(this.firstChild) {
		this.removeChild(this.firstChild);
	}
	this.insertAdjacentHTML('afterbegin', _html);
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

function select_val(_select) {
	return _select.options[_select.selectedIndex].value;
}


/*************************************************************************************************/
/*                                              AJAX                                             */
/*************************************************************************************************/
function ajax(_settings = {}) {
	var xhr = new XMLHttpRequest();
	xhr.tab_id = _settings.tab_id ? _settings.tab_id : Page.current_id;
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

	var responseType = _settings.responseType || 'json';
	xhr.responseType = responseType;

	xhr.open(method, url);

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
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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
	if(typeof login_waiting_popup[Page.id(_tab_id).context.server] == 'undefined') {
		login_waiting_popup[Page.id(_tab_id).context.server] = [];
	}
	if(!login_waiting_popup[Page.id(_tab_id).context.server].length) {
		//Add login form on current tab
		info('Il faut vous connecter pour continuer');
		login_waiting_popup[Page.id(_tab_id).context.server].push(new Popup({
			title: 'Se connecter',
			contentHTML: _login_form,
		}));

	}
	//Add ajax call to waiting list
	if(_ajax_query !== null) {
		if(typeof login_waiting_ajax[Page.id(_tab_id).context.server] == 'undefined') {
			login_waiting_ajax[Page.id(_tab_id).context.server] = [];
		}
		//TODO Vérifier que ça peut pas péter des trucs
		_ajax_query.settings.tab_id = _tab_id;
		login_waiting_ajax[Page.id(_tab_id).context.server].push({
			settings: _ajax_query.settings,
			callback_done: _ajax_query.callback_done,
			callback_error: _ajax_query.callback_error
		});
	}
	//Add callback to waiting list
	if(_callback !== null) {
		if(typeof login_waiting_callbacks[Page.id(_tab_id).context.server] == 'undefined') {
			login_waiting_callbacks[Page.id(_tab_id).context.server] = [];
		}
		login_waiting_callbacks[Page.id(_tab_id).context.server].push(_callback);
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
		data: Page.current().context
	}).done(function(data) {
		if(data.login_form) {
			request_login(data.login_form, Page.current_id, null, function() {
				Page.current().load_content();
			});
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
		Page.current().server_list.set_data(breadcrumb_server);
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
		Page.current().database_list.set_data(breadcrumb_database[_server]);
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
		Page.current().table_list.set_data(breadcrumb_table[_server][_database]);
	});
}

function select_server(_server_color, _event) {
	var t = _server_color.split('|');
	var _server = t[0];
	var color = JSON.parse(t[1]);
	if(Page.current().context.server != _server) {
		Page.current().context.server = _server;
		Page.current().database_list.reset();
		Page.current().database_list.d_input.disabled = false;
		Page.current().table_list.reset();
		Page.current().table_list.d_input.disabled = true;
		document.getElementById('favicon').href = document.getElementById('favicon').href.replace(/(.*\?r=)[0-9]+(&g=)[0-9]+(&b=)[0-9]+(.*)/, '$1'+color.r+'$2'+color.g+'$3'+color.b+'$4');;
		document.getElementById('theme').href = document.getElementById('theme').href.replace(/(.*\?r=)[0-9]+(&g=)[0-9]+(&b=)[0-9]+(.*)/, '$1'+color.r+'$2'+color.g+'$3'+color.b+'$4');;
	}
	if(_event.type == 'keydown' && _event.key == 'Tab') {
		//TODO Load and Refrech datbase_list contnet
		refresh_database_list(Page.current().context.server);
		Page.current().database_list.focus();
	} else {
		//Load page content
		Page.current().context_remove(['control', 'database', 'table']);
		Page.current().load_content({get_controls: true});
	}
}
function back_server(_event) {
	delete(Page.current().context.server);
	Page.current().server_list.reset();
	Page.current().database_list.reset();
	Page.current().table_list.reset();
	Page.current().database_list.d_input.disabled = true;
	Page.current().table_list.d_input.disabled = true;
	Page.current().context_remove(['control']);
	Page.current().load_content({get_controls: true});
}
function focus_server() {
	refresh_server_list();
}

function select_database(_database, _event) {
	if(Page.current().context.database != _database) {
		Page.current().context.database = _database;
		Page.current().table_list.reset();
		Page.current().table_list.d_input.disabled = false;
	}
	//TODO Load and Refrech table_list contnet
	refresh_table_list(Page.current().context.server, Page.current().context.database);
	if(_event.type == 'keydown' && _event.key == 'Tab') {
		Page.current().table_list.focus();
	} else {
		//Load page content
		Page.current().context_remove(['control', 'table']);
		Page.current().load_content({get_controls: true});
	}
}
function back_database(_event) {
	delete(Page.current().context.database);
	Page.current().database_list.reset();
	Page.current().table_list.reset();
	Page.current().table_list.d_input.disabled = true;
	Page.current().server_list.focus();
}
function focus_database() {
	refresh_database_list(Page.current().context.server);
}

function select_table(_table, _event) {
	if(Page.current().context.table != _table) {
		Page.current().context.table = _table;
		//TODO Load and Refrech datbase_list contnet
		//Load page content
	}
	Page.current().context_remove(['control']);
	Page.current().load_content({get_controls: true});
}
function back_table(_event) {
	delete(Page.current().context.table);
	Page.current().table_list.reset();
	Page.current().database_list.focus();
}
function focus_table() {
	refresh_table_list(Page.current().context.server, Page.current().context.database);
}

function open_breadcrumb() {
	if(typeof Page.current().context.table != 'undefined' && Page.current().context.table !== null) {
		Page.current().table_list.focus();
	} else if(typeof Page.current().context.database != 'undefined' && Page.current().context.database !== null) {
		Page.current().database_list.focus();
	} else {
		Page.current().server_list.focus();
	}
}


/*************************************************************************************************/
/*                                            CONTENT                                            */
/*************************************************************************************************/

function init_highlight() {
	var d = document.querySelectorAll('.highlight:not(.treated)');
	for(var i=0 ; i<d.length ; i++) {
		(function(_dom) {
			var o = {};
			if(_dom.classList.contains('readonly')) {
				o.readOnly = 'nocursor';
			}
			_dom.highlight = CodeMirror.fromTextArea(_dom, o);
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
	if(Page.current().context.server) {
		gets.push('server='+Page.current().context.server);
	}
	if(Page.current().context.server && Page.current().context.database) {
		gets.push('database='+Page.current().context.database);
	}
	if(Page.current().context.server && Page.current().context.database && Page.current().context.table) {
		gets.push('table='+Page.current().context.table);
	}
	if(Page.current().context.control) {
		gets.push('control='+Page.current().context.control);
	}
	history.pushState({}, 'TODO', '?'+gets.join('&'));
}

function set_title() {
	if(Page.current().context.server) {
		if(Page.current().context.database) {
			if(Page.current().context.table) {
				Page.current().d_tab.textContent = Page.current().context.table;
			} else {
				Page.current().d_tab.textContent = Page.current().context.database;
			}
		} else {
			Page.current().d_tab.textContent = Page.current().context.control ? Page.current().context.control : 'welcome';
		}
	} else {
		Page.current().d_tab.textContent = Page.current().context.control ? Page.current().context.control : 'welcome';
	}
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
		//TODO Animation not working FML
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

	this.popup_bg = Page.current().d_page.getElementsByClassName('popup_bg')[0];
	if(!this.popup_bg) {
		this.popup_bg = document.createElement('div');
		this.popup_bg.classList.add('popup_bg');
		Page.current().d_page.insertAdjacentElement('afterbegin', this.popup_bg);
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
			Page.new();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyQ') {
			Page.left();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyE') {
			Page.right();
			stop = true;
		}
		if(event.ctrlKey && event.altKey && event.code == 'KeyZ') {
			Page.close();
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
	Page.current().context_detail_add({'sql_query': _form.sql_query.value});
	Page.current().load_content();
}

function sql_empty(_form) {
	_form.sql_query.highlight.setValue('')
}

function sql_format(_form) {
	info('TODO');
}


function edit_query(_button) {
	var d = _button.form;
	d.sql_query.highlight.toTextArea();
	d.sql_query.classList.remove('treated', 'readonly');
	init_highlight();
	var d2 = d.getElementsByClassName('btn');
	for(var i=0 ; i<d2.length ; i++) {
		d2[i].classList.toggle('hidden');
	}
}

function tv_number_rows(_number_rows) {
	Page.current().context_detail_add({'limit': _number_rows});
	Page.current().load_content();
}

function tv_page(_page_nb) {
	Page.current().context_detail_add({'page': _page_nb});
	Page.current().load_content();
}

function tv_edit(_key) {
	info('TODO');
}
function tv_copy(_key) {
	info('TODO');
}
function tv_delete(_key) {
	info('TODO');
}

/*https://database.xeck.fr/?ajax=1&action=get_content_and_controls
server: 1
database: performance_schema

https://database.xeck.fr/?ajax=1&action=get_content_and_controls
ajax: 1
action: get_content_and_controls*/