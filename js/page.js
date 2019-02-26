"use strict";

class Page {
	static pages = [];
	static page_nb = 0;
	static current_tab = null;
	static current_page = null;
	static current_id = 0;

	static current() {
		return this.pages[this.current_id];
	}

	static id(_id) {
		return this.pages[_id];
	}

	static focus(_dom) {
		if(Page.current_tab !== null) {
			Page.current_tab.classList.remove('selected');
			Page.current_page.classList.remove('selected');
		}
		Page.current_tab = _dom;
		Page.current_tab.classList.add('selected');
		Page.current_id = Page.current_tab.dataset.id;
		Page.current_page = document.getElementById('page_'+Page.current_id);
		Page.current_page.classList.add('selected');
		set_url();
	}

	static left() {
		if(Page.current_tab !== null) {
			var n = Page.current_tab.previousElementSibling;
			if(n === null) {
				n = document.getElementById('new_tab').previousElementSibling;
			}
			if(n !== null) {
				Page.current_tab.classList.remove('selected');
				Page.current_page.classList.remove('selected');
				Page.current_tab = n;
				Page.current_tab.classList.add('selected');
				Page.current_id = Page.current_tab.dataset.id;
				Page.current_page = document.getElementById('page_'+Page.current_id);
				Page.current_page.classList.add('selected');
				set_url();
			}
		}
	}

	static right() {
		if(Page.current_tab !== null) {
			var n = Page.current_tab.nextElementSibling;
			if(n.id === 'new_tab') {
				n = null;
			}
			if(n === null) {
				n = Page.current_tab.parentElement.firstElementChild;
			}
			if(n !== null) {
				Page.current_tab.classList.remove('selected');
				Page.current_page.classList.remove('selected');
				Page.current_tab = n;
				Page.current_tab.classList.add('selected');
				Page.current_id = Page.current_tab.dataset.id;
				Page.current_page = document.getElementById('page_'+Page.current_id);
				Page.current_page.classList.add('selected');
				set_url();
			}
		}
	}

	static close() {
		if(Page.current_tab !== null) {
			var n = Page.current_tab.previousElementSibling;
			if(n === null) {
				n = Page.current_tab.nextElementSibling;
			}
			Page.current_tab.remove();
			Page.current_page.remove();
			if(n !== null && n.id !== 'new_tab') {
				Page.current_tab = n;
				Page.current_tab.classList.add('selected');
				Page.current_id = Page.current_tab.dataset.id;
				Page.current_page = document.getElementById('page_'+Page.current_id);
				Page.current_page.classList.add('selected');
				set_url();
			} else {
				Page.current_tab = null;
				Page.current_page = null;
			}
		}
	}

	static new() {
		var new_context = {};
		for(var i in PAGE[Page.current_id].context) {
			new_context[i] = PAGE[Page.current_id].context[i];
		}
		ajax({
			url: '/?ajax=1&action=new_tab&tab_nb='+(++Page.page_nb),
			method: 'post',
			responseType: 'json',
			data: new_context
		}).done(function(data) {
			if(Page.current_tab !== null) {
				Page.current_tab.classList.remove('selected');
				Page.current_page.classList.remove('selected');
				Page.current_tab.insertAdjacentHTML('afterend', data.tab);
				Page.current_tab = Page.current_tab.nextElementSibling;
			} else {
				var d = document.getElementById('new_tab');
				d.insertAdjacentHTML('beforebegin', data.tab);
				Page.current_tab = d.previousElementSibling;
			}
			document.getElementById('pages').insertAdjacentHTML('beforeend', data.page);
			Page.current_tab.classList.add('selected');
			Page.current_id = Page.current_tab.dataset.id;
			Page.current_page = document.getElementById('page_'+Page.current_id);
			Page.current_page.classList.add('selected');
			PAGE[Page.current_id] = new Page(Page.current_id, new_context);
			set_url();
		});
	}

	constructor(_id, _context = {}) {
		this.id = _id;
		this.context = _context;

		this.requests = {
			content: null
		};


		this.d_tab = document.getElementById('tab_'+this.id);
		this.d_page = document.getElementById('page_'+this.id);

		this.d_server = this.d_page.getElementsByClassName('breadcrumb_server')[0];
		this.d_database = this.d_page.getElementsByClassName('breadcrumb_database')[0];
		this.d_table = this.d_page.getElementsByClassName('breadcrumb_table')[0];

		//TODO Rename fuzzy_server
		this.server_list = new Fuzzy(this.d_server, breadcrumb_server, {
			on_select: select_server,
			on_back: back_server,
			on_focus: focus_server
		});
		//TODO Rename fuzzy_database
		this.database_list = new Fuzzy(this.d_database, this.context.server ? breadcrumb_database[this.context.server] : null, {
			on_select: select_database,
			on_back: back_database,
			on_focus: focus_database
		});
		//TODO Rename fuzzy_table
		this.table_list = new Fuzzy(this.d_table, this.context.server && this.context.database ? breadcrumb_table[this.context.server][this.context.database] : null, {
			on_select: select_table,
			on_back: back_table,
			on_focus: focus_table
		});
	}

	context_add(_param) {
		for(var i in _param) {
			this.context[i] = _param[i];
			delete this.context.detail; //TODO Quand on change de page, ça vire les détails, il faudrait gérer ça dans une fonction à part
		}
	}

	context_remove(_param) {
		for(var i=0 ; i<_param.length ; i++) {
			delete this.context[_param[i]];
			delete this.context.detail; //TODO Quand on change de page, ça vire les détails, il faudrait gérer ça dans une fonction à part
		}
	}

	context_detail_add(_param) {
		if(typeof this.context.detail == 'undefined') {
			this.context.detail = {};
		}
		for(var i in _param) {
			this.context.detail[i] = _param[i];
		}
	}

	context_detail_remove(_param) {
		if(typeof this.context.detail != 'undefined') {
			for(var i=0 ; i<_param.length ; i++) {
				delete this.context.detail[_param[i]];
			}
		}
	}

	load_content(_options = {}) {
		set_url();
		set_title();
		if(this.requests.content != null) {
			this.requests.content.abort();
		}
		//TODO Ajouter le tab_id en paramètre de la méthode
		this.requests.content = ajax({
			url: '/?ajax=1&action=get_content'+(_options.get_controls?'_and_controls':''),
			method: 'post',
			responseType: 'json',
			data: this.context
		}).done(function(data) {
			//TODO Pour tout ces appels ajax : vérifier qu'on changement de page entre temps ne charge pas le contenu dans le mauvais onglet
			if(typeof data.content != 'undefined') {
				Page.current_page.getElementsByClassName('content')[0].replaceHTML(data.content);
			}
			if(typeof data.controls != 'undefined') {
				Page.current_page.getElementsByClassName('controls')[0].replaceHTML(data.controls);
			}

			init_highlight();
		});
	}
}