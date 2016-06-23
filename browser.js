'use strict';
const titlebar = require('titlebar');
const ipc = require('electron').ipcRenderer;

const titleBar = titlebar();
titleBar.appendTo(document.querySelector('.js-header'));

const closeButton = document.querySelector('.titlebar-close');
closeButton.addEventListener('click', () => {
	ipc.send('close');
});

const searchInput = document.querySelector('.js-search-input');
const searchForm = document.querySelector('.js-search-form');
searchForm.addEventListener('submit', e => {
	e.preventDefault();

	const query = searchInput.value;
	search(query)
		.then(modules => {
			if (modules.length > 0) {
				renderModules(modules);
			} else {
				renderEmptyResult();
			}

			ipc.send('resize');
		});
});

function search (query) {
	return fetch('http://node-modules.com/search.json?q=' + query)
		.then(res => res.json());
}

const container = document.querySelector('.js-container');
container.addEventListener('click', e => {
	let target = e.target;

	if (!target.matches('.js-list-item')) {
		target = target.closest('.js-list-item');
	}

	if (!target) {
		return;
	}

	let url = target.dataset.url;

	if (e.altKey) {
		url = 'https://npmjs.org/package/' + target.dataset.name;
	}

	ipc.send('open', url, target.dataset.name);
});

function renderEmptyResult () {
	container.innerHTML = '';

	const wrapper = document.createElement('div');
	wrapper.className = 'no-results';

	const label = document.createElement('h3');
	label.textContent = 'No modules found.';

	wrapper.appendChild(label);
	container.appendChild(wrapper);
}

function renderModules (modules) {
	container.innerHTML = '';

	const fragment = document.createDocumentFragment();

	modules.forEach(module => {
		const listItem = document.createElement('div');
		listItem.className = 'list-item js-list-item';
		listItem.dataset.url = module.url;
		listItem.dataset.name = module.name;

		const header = document.createElement('header');
		header.className = 'list-item-header';

		const name = document.createElement('h3');
		name.className = 'list-item-name';
		name.textContent = module.name;

		const stars = document.createElement('span');
		stars.className = 'list-item-stars';
		stars.textContent = module.stars;

		const starIcon = document.createElement('img');
		starIcon.className = 'star-icon';
		starIcon.src = 'images/star.svg';

		const description = document.createElement('p');
		description.className = 'list-item-description';
		description.textContent = module.description;

		stars.insertBefore(starIcon, stars.firstChild);

		header.appendChild(name);
		header.appendChild(stars);

		listItem.appendChild(header);
		listItem.appendChild(description);

		fragment.appendChild(listItem);
	});

	container.appendChild(fragment);
}
