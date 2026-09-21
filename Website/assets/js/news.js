fetch("/page/snipets/newssidebar.html")
	.then(response => response.text())
	.then(data => {
		const sidebar = document.getElementById("sidebar");

		if (sidebar) {
			sidebar.innerHTML = data;
		}
	})
	.catch(error => {
		console.error("Could not load news sidebar:", error);
	});