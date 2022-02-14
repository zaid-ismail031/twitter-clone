document.addEventListener('DOMContentLoaded', function() {
	all_posts(1);

	pageno = 1;
	// Use button to post
	document.querySelector('#submit').addEventListener('click', create);

	document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagnext">Next</a></li>`;

	document.querySelector('#pagnext').addEventListener('click', () => {
		pagination(pageno);
	})
	
})


// Shows all posts for a certain page number
function all_posts(pagenumber) {

	var maincontainer = document.getElementById("posts-view");
	maincontainer.innerHTML = '';

	page = document.createElement("div");
	page.innerHTML = `<h4>Page ${pagenumber}</h4>`;
	maincontainer.appendChild(page);

	fetch(`/posts/page${pagenumber}`, {
		method: 'GET'
	})

		.then((response) => {
			return response.json();
		})

		.then((data) => {
			data.forEach((element) => {

				// Structuring the DOM
				var div = document.createElement("div");
				div.className = "container";

				console.log(element);

				newlikes = element.likes;

				string = `Posted by <a href=/user/${element.user}>${element.user}</a> on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`

				div.innerHTML = string;

				var like = document.createElement("button");
				like.className = "btn btn-secondary";

				var unlike = document.createElement("button");
				unlike.className = "btn btn-secondary";

				like.innerHTML = "Like";
				unlike.innerHTML = "Unlike";

				// liked flag
				let hasbeenliked = null;

				// unliked flag
				let hasbeenUnliked = null;

				var editbutton = document.createElement("button");
				editbutton.className = "btn btn-secondary";
				editbutton.innerHTML = "Edit";

				// Unlike button client functionality
				unlike.addEventListener('click', function () {
 				 	like.innerHTML = "Like";
 				 	updatelike(element.id);
 				 	newlikes = Number(element.likes) - 1;
 				 	if (hasbeenliked == true) {newlikes = element.likes;}
 				 	else {hasbeenUnliked = true;}

 				 	console.log("unliked flag:", hasbeenUnliked);
 				 	div.innerHTML = `Posted by <a href=/user/${element.user}>${element.user}</a> on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`;
 				 	div.appendChild(like);
 				})

				// Like button client functionality 
 				like.addEventListener('click', function() {
 				 	like.innerHTML = "Unlike";
 				 	updatelike(element.id);
 				 	newlikes = Number(element.likes) + 1;
 				 	if (hasbeenUnliked == true) {newlikes = element.likes;}
 				 	else {hasbeenliked = true;}

 				 	console.log("liked flag:", hasbeenliked);
 				 	div.innerHTML = `Posted by <a href=/user/${element.user}>${element.user}</a> on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`;
 				 	div.appendChild(unlike);	
 				})

				maincontainer.appendChild(div);

				// Determine whether to initially show the like button or unlike button, depending on result from 
				// return_likes() which returns true/false depending on whether post has already been liked or not

				async function check() {
 				 	
 				 	is_liked = await return_likes(element.id);

 				 	if (is_liked == true) {
 				 		div.appendChild(unlike);
 				 	}

 				 	else if (is_liked == false) {
 				 		div.appendChild(like);
 				 	}

				}

				check();

				const user = document.getElementById("username").innerHTML;
				console.log("From html", user);
				
				if (user == element.user) {
					div.appendChild(editbutton);
				}

				editbutton.addEventListener('click', function () {
					div.innerHTML = `Posted by <a href=/user/${element.user}>${element.user}</a> on ${element.timestamp}<br><textarea id="edit">${element.body}</textarea><br>${element.likes} likes<br>`;

					var finishbutton = document.createElement("button");
					finishbutton.className = "btn btn-secondary";
					finishbutton.innerHTML = "Finish";
					div.appendChild(finishbutton);

					finishbutton.addEventListener('click', function () {
						var body = document.querySelector("#edit").value;
						div.innerHTML = `Posted by <a href=/user/${element.user}>${element.user}</a> on ${element.timestamp}<br>${body}<br>${element.likes} likes<br>`;
						edit(element.id, body);
					})


				})
				
			})
	
		})

}


async function return_likes(id) {

	response = await fetch("/getlikes", {method: 'GET'})
	data = await response.json()

	let liked_ids = [];
	let id_check = Number(id);

	result = await data;

	for (var i = 0; i < result.length; i++) {
		liked_ids.push(Number(result[i].id));
	}

	if (liked_ids.includes(id_check)) {
		return true;
	}

	return false;
}


// Updating likes (whether it is a 'like' or 'unlike' is determined server-side)
function updatelike(id) {
	fetch(`like/${id}`, {
		method: 'GET'
	})
}


function create() {
	const body = document.querySelector("#compose-post").value;

	var maincontainer = document.getElementById("posts-view");
	var d = new Date(); 

	(async function domupdate() {
		document.getElementById("compose-post").value = "";
		string = `Posted now by you<br>${body}<br>0 likes<br>`;
		var div = document.createElement("div");
		div.className = "container";
		div.innerHTML = string;

		var like = document.createElement("button");
		like.className = "btn btn-secondary";
		like.innerHTML = "Like";

		div.appendChild(like);
		maincontainer.prepend(div);


	})()

	postJSON = JSON.stringify({content: body});

	fetch('/create', {
		method: 'POST',
		body: postJSON
	})

	.then((response) => {
		return false;
	})

	.catch(error => {
		console.log(error.message);
	})

	return false;
}


// accessing the api that simply returns the logged in user's username. to assist the create() function.
async function getuser() {
	fetch = await fetch('/getuser');
	data = await fetch.json();
	user = await data.user;
	return user;
}



async function getnumber() {
	fetch = await fetch('/getnumber');
	data = await fetch.json();
	number = await data.number;
	return number;
}


async function pagination(pageno) {
	pageno += 1;
	all_posts(pageno);

	if (pageno > 1) {
		document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagprev">Previous</a></li><li class="page-item"><a class="page-link" id="pagnext2">Next</a></li>`;

		document.querySelector('#pagnext2').addEventListener('click', () => {
			pageno += 1;
			all_posts(pageno);
		})

		document.querySelector('#pagprev').addEventListener('click', () => {
			pageno = pageno - 1;
			all_posts(pageno);

			if (pageno == 1) {
				document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagnext3">Next</a></li>`;

				document.querySelector('#pagnext3').addEventListener('click', () => {
					pagination(pageno);
				})
			}
		})

	}

}


function edit(postid, body) {

	postJSON = JSON.stringify({postid: postid, content: body});

	fetch('/edit', {
		method: 'POST',
		body: postJSON
	})
}



