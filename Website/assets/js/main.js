/*
	TXT by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var $window = $(window),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '361px',   '736px'  ],
			xsmall:  [ null,      '360px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Load Menu.
	fetch("../menu.json")
		.then(r => r.json())
		.then(menu => {

			const currentPage =
				window.location.pathname.split("/").pop() || "index.html";
			const path = findPath(menu, currentPage);
			const marked = path ? markActive(menu, path) : menu;

			const nav = document.getElementById("nav");
			nav.innerHTML =
				'<a class="nav-logo" href="index.html" aria-label="CATI home">' +
					'<img src="../LogoCATI.svg" alt="CATI">' +
				'</a>';

			const ul = buildMenu(marked);
			nav.appendChild(ul);

			initMenu();
		});

		function initMenu() {	
			const $nav = $('#nav');


		// Dropdowns.
			$('#nav > ul').dropotron({
				mode: 'fade',
				noOpenerFade: true,
				speed: 300,
				alignment: 'center'
			});

		// Scrolly
			$('.scrolly').scrolly({
				speed: 1000,
				offset: function() { return $nav.height() - 5; }
			});

		// Nav.

			// Title Bar.
				$(
					'<div id="titleBar">' +
						'<a href="#navPanel" class="toggle"></a>' +
						'<span class="title">' + 				
							'<a class="nav-logo" href="index.html" aria-label="CATI home">' +
								'<img src="../LogoCATI-dark.svg" alt="CATI">' +
							'</a>' + 
						'</span>' +
					'</div>'
				)
					.appendTo($body);

			// Panel.
	
			var $navPanel = $(
					'<div id="navPanel"><nav></nav></div>'
			);

			var $navList = $('#nav > ul').first().clone();
			$navPanel.find('nav').append($navList);

			$navPanel
				.appendTo($body)
				.panel({
					delay: 500,
					hideOnClick: true,
					hideOnSwipe: true,
					resetScroll: true,
					resetForms: true,
					side: 'left',
					target: $body,
					visibleClass: 'navPanel-visible'
				});

			function openCurrentBranch() {
				var $currents = $navPanel.find('li.current');

				$currents.each(function() {
					var $node = $(this);

					while ($node.length) {
						$node.addClass('active');
						$node.children('ul').show();
						$node = $node.parents('li').first();
					}
				});
			}

			openCurrentBranch();

			$navPanel.on('click', 'li:has(ul) > a', function(event) {
				event.preventDefault();
				event.stopPropagation();

				var $li = $(this).closest('li');
				var $submenu = $li.children('ul');
				var isOpen = $li.hasClass('active') && $submenu.is(':visible');
				var $parentBranch = $li.parents('li').first();

				if ($parentBranch.length) {
					$parentBranch.siblings('li').find('ul').hide();
					$parentBranch.siblings('li').find('ul').parent('li').removeClass('active');
				}

				$li.siblings('li').find('ul').hide();
				$li.siblings('li').find('ul').parent('li').removeClass('active');

				$li.toggleClass('active', !isOpen);
				$submenu.toggle(!isOpen);
			});

			//Footer
			fetch("../page/snipets/footer.html")
				.then(response => response.text())
				.then(data => {
					document.getElementById("footer").innerHTML = data;
				});

		}

})(jQuery);
const slides = document.querySelectorAll('.banner .slide');
let index = 0;

if (slides.length > 0) {
	setInterval(function() {
		if (!slides || slides.length === 0)
			return;

		if (slides[index])
			slides[index].classList.remove('active');

		index = (index + 1) % slides.length;

		if (slides[index])
			slides[index].classList.add('active');
	}, 4000);
}

function findPath(items, target, path = []) {
	for (const item of items) {

		const currentPath = [...path, item];
		if (item.link === target) {

			return currentPath;
		}

		if (item.children) {
			const result = findPath(item.children, target, currentPath);
			if (result) return result;
		}
	}

	return null;
}

function markActive(items, path) {
	return items.map(item => {
		const isCurrent = path.includes(item);
		const newItem = {
			...item,
			current: isCurrent,
			active: isCurrent
		};

		if (item.children) {
			newItem.children = markActive(item.children, path);
		}

		return newItem;
	});
}

function buildMenu(items) {
	const ul = document.createElement("ul");

	items.forEach(item => {
		const li = document.createElement("li");

		if (item.current || item.active) {
			li.classList.add("current");
		}
		if (item.status === "not available") {
			li.classList.add("not-available");
		}

		const a = document.createElement("a");
		a.textContent = item.name;
		a.href = item.link || "#";

		li.appendChild(a);

		if (item.children && item.children.length > 0) {
			li.appendChild(buildMenu(item.children));
		}

		ul.appendChild(li);
	});

	return ul;
}

function nextSlide(){
  if (!slides || slides.length === 0)
    return;

  if (slides[index])
    slides[index].classList.remove('active');

  index = (index + 1) % slides.length;

  if (slides[index])
    slides[index].classList.add('active');
}