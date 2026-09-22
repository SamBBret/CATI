async function loadNews() {
	try {
		const response = await fetch(
			"/page/news/news-index.json"
		);

		if (!response.ok) {
			throw new Error(
				`Could not load news index: ${response.status}`
			);
		}

		const news = await response.json();

		const currentPage =
			getCurrentPage(
				news.totalPages
			);

		await renderNews(
			news,
			currentPage
		);

		renderPagination(
			news,
			currentPage
		);
	} catch (error) {
		console.error(
			"Could not load news:",
			error
		);
	}
}


function getCurrentPage(totalPages) {
	const params =
		new URLSearchParams(
			window.location.search
		);

	const requestedPage =
		Number(
			params.get("page")
		);

	if (
		!Number.isInteger(
			requestedPage
		) ||
		requestedPage < 1
	) {
		return 1;
	}

	return Math.min(
		requestedPage,
		totalPages
	);
}


async function renderNews(
	news,
	currentPage
) {
	const newsList =
		document.getElementById(
			"news-list"
		);

	if (!newsList) {
		return;
	}

	const start =
		(currentPage - 1) *
		news.articlesPerPage;

	const end =
		start +
		news.articlesPerPage;

	const articles =
		news.articles.slice(
			start,
			end
		);

	const cards =
		await Promise.all(
			articles.map(
				async (article) => {
					const response =
						await fetch(
							article.card
						);

					if (!response.ok) {
						throw new Error(
							`Could not load news card: ${article.card}`
						);
					}

					return response.text();
				}
			)
		);

	newsList.innerHTML =
		cards.join("");
}


function renderPagination(news, currentPage) {
  const pagination =
    document.getElementById("news-pagination");

  if (!pagination) return;

  const pages =
    getPaginationPages(
      currentPage,
      news.totalPages
    );

  let html = "";

  if (currentPage > 1) {
    html += `
      <a
        href="?page=${currentPage - 1}"
		class="button white"
        rel="next"
      >
        Previous
      </a>
    `;
  }

  html += pages
    .map((page) =>
      renderPaginationItem(
        page,
        currentPage
      )
    )
    .join("");

  if (currentPage < news.totalPages) {
    html += `
      <a
        href="?page=${currentPage + 1}"
		class="button white"
        rel="next"
      >
        Next
      </a>
    `;
  }

  pagination.innerHTML = html;
}

function renderPaginationItem(
	page,
	currentPage
) {
	if (page === "ellipsis") {
		return `
			<span
				class="ellipsis"
				aria-hidden="true">
				…
			</span>
		`;
	}

	const active =
		page === currentPage
			? " active"
			: "";

	const ariaCurrent =
		page === currentPage
			? ' aria-current="page"'
			: "";

	return `
		<a 
			href="?page=${page}" ${ariaCurrent}class="${active} button white">
			${page}
		</a>
	`;
}


function getPaginationPages(
	currentPage,
	totalPages
) {
	if (totalPages <= 7) {
		return Array.from(
			{
				length:
					totalPages
			},
			(_, index) =>
				index + 1
		);
	}

	const pages =
		new Set();

	pages.add(1);

	for (
		let page =
			currentPage - 2;
		page <=
			currentPage + 2;
		page++
	) {
		if (
			page >= 1 &&
			page <= totalPages
		) {
			pages.add(page);
		}
	}

	pages.add(
		totalPages
	);

	const sortedPages =
		[
			...pages
		].sort(
			(a, b) =>
				a - b
		);

	const result = [];

	for (
		let i = 0;
		i <
		sortedPages.length;
		i++
	) {
		const page =
			sortedPages[i];

		const previous =
			sortedPages[i - 1];

		if (
			previous !== undefined &&
			page - previous > 1
		) {
			result.push(
				"ellipsis"
			);
		}

		result.push(page);
	}

	return result;
}


/*
 * Sidebar
 */

fetch(
	"/page/snipets/newssidebar.html"
)
	.then(
		(response) =>
			response.text()
	)
	.then(
		(data) => {
			const sidebar =
				document.getElementById(
					"sidebar"
				);

			if (sidebar) {
				sidebar.innerHTML =
					data;
			}
		}
	)
	.catch(
		(error) => {
			console.error(
				"Could not load news sidebar:",
				error
			);
		}
	);


/*
 * Start news listing.
 */

if (
	document.getElementById(
		"news-list"
	)
) {
	loadNews();
}