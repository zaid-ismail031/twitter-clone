document.addEventListener('DOMContentLoaded', function() {

	const username = window.location.pathname.split('/')[2];
	//username = window.location.pathname.split('/')[2];
	all_posts(username, 1);

	pageno = 1;

	// Use button to post
	//document.querySelector('#submit').addEventListener('click', create);

	document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagnext">Next</a></li>`;

	document.querySelector('#pagnext').addEventListener('click', () => {
		pagination(pageno);
	})

	try {
	document.querySelector('#follow-button').addEventListener('click', () => {
		follow(window.location.pathname.split('/')[2]);
	})

	}

	catch(err) {null;}

})


// Shows all posts for a certain page number
function all_posts(username, pagenumber) {

	var maincontainer = document.getElementById("posts-view");
	maincontainer.innerHTML = '';

	page = document.createElement("div");
	page.innerHTML = `<h4>Page ${pagenumber}</h4>`;
	maincontainer.appendChild(page);

	fetch(`/userposts/${username}/page${pagenumber}`, {
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

				//element.likes = 1000;
				newlikes = element.likes;

				string = `Posted by ${element.user} on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`

				div.innerHTML = string;

				var like = document.createElement("button");
				like.className = "btn btn-secondary";

				var unlike = document.createElement("button");
				unlike.className = "btn btn-secondary";

				like.innerHTML = "Like";
				unlike.innerHTML = "Unlike";


				var editbutton = document.createElement("button");
				editbutton.className = "btn btn-secondary";
				editbutton.innerHTML = "Edit";

				// liked flag
				let hasbeenliked = null;

				// unliked flag
				let hasbeenUnliked = null;

				// Unlike button client functionality
				unlike.addEventListener('click', function () {
 				 	like.innerHTML = "Like";
 				 	updatelike(element.id);
 				 	newlikes = Number(element.likes) - 1;
 				 	if (hasbeenliked == true) {newlikes = element.likes;}
 				 	else {hasbeenUnliked = true;}

 				 	console.log("unliked flag:", hasbeenUnliked);
 				 	div.innerHTML = `Posted by ${element.user} on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`;
 				 	div.appendChild(like);
 				 	
 				 	//is_liked = false;
 				 	
 				})

				// Like button client functionality 
 				like.addEventListener('click', function() {
 				 	like.innerHTML = "Unlike";
 				 	updatelike(element.id);
 				 	newlikes = Number(element.likes) + 1;
 				 	if (hasbeenUnliked == true) {newlikes = element.likes;}
 				 	else {hasbeenliked = true;}

 				 	console.log("liked flag:", hasbeenliked);
 				 	div.innerHTML = `Posted by ${element.user} on ${element.timestamp}<br>${element.body}<br>${newlikes} likes<br>`;
 				 	div.appendChild(unlike);
 				 	
 				 	//is_liked = true;
 				 	
 				})

				maincontainer.appendChild(div);

				// Determine whether to initially show the like button or unlike button, depending on result from 
				// return_likes() which returns true/false depending on whether post has already been liked or not

				(async function check() {
 				 	is_liked = await return_likes(element.id);

 				 	if (is_liked == true) {
 				 		div.appendChild(unlike);
 				 	}

 				 	else if (is_liked == false) {
 				 		div.appendChild(like);
 				 	}	 	
				})()

				const user = document.getElementById("username").innerHTML;
				console.log("From html", user);
				
				if (user == element.user) {
					div.appendChild(editbutton);
				}

				editbutton.addEventListener('click', function () {
					div.innerHTML = `Posted by ${element.user} on ${element.timestamp}<br><textarea id="edit">${element.body}</textarea><br>${element.likes} likes<br>`;

					var finishbutton = document.createElement("button");
					finishbutton.className = "btn btn-secondary";
					finishbutton.innerHTML = "Finish";
					div.appendChild(finishbutton);

					finishbutton.addEventListener('click', function () {
						var body = document.querySelector("#edit").value;
						div.innerHTML = `Posted by ${element.user} on ${element.timestamp}<br>${body}<br>${element.likes} likes<br>`;
						edit(element.id, body);
					})


				})

			})
		})
}


// check_likes and return_likes determine if a post is liked already or not. 
async function check_likes(id) {


	response = await fetch("/getlikes", {method: 'GET'})
	data = await response.json()
	return data;
}


async function return_likes(id) {

	let liked_ids = [];
	let id_check = Number(id);

	result = await check_likes(id);

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
	fetch(`/like/${id}`, {
		method: 'GET'
	})
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


function pagination(pageno) {
	pageno += 1;
	all_posts(window.location.pathname.split('/')[2], pageno);

	if (pageno > 1) {
		document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagprev">Previous</a></li><li class="page-item"><a class="page-link" id="pagnext2">Next</a></li>`;

		document.querySelector('#pagnext2').addEventListener('click', () => {
			pageno += 1;
			all_posts(window.location.pathname.split('/')[2], pageno);
		})

		document.querySelector('#pagprev').addEventListener('click', () => {
			pageno = pageno - 1;
			all_posts(window.location.pathname.split('/')[2], pageno);

			if (pageno == 1) {
				document.getElementById('pagination-view').innerHTML = `<nav aria-label="Page navigation example"><ul class="pagination"><li class="page-item"><a class="page-link" id="pagnext3">Next</a></li>`;

				document.querySelector('#pagnext3').addEventListener('click', () => {
					pagination(pageno);
				})
			}
		})

	}

}


function follow(user) {

	var hasbeenFollowed = null;
	var hasbeenUnfollowed = null;
	
	// Follow button
	if (document.getElementById("follow-button").innerHTML == "Follow") {
		document.getElementById("follow-button").innerHTML = "Unfollow";

		followercount = Number(document.getElementById("followercount").innerHTML.split(" ")[0]);
		console.log("this is the followercount", followercount);
		newfollowercount = followercount + 1;
		document.getElementById("followercount").innerHTML = `${newfollowercount} followers`; 
	}

	// Unfollow button
	else if (document.getElementById("follow-button").innerHTML == "Unfollow") {
		document.getElementById("follow-button").innerHTML = "Follow";

		followercount = Number(document.getElementById("followercount").innerHTML.split(" ")[0]);
		console.log("this is the followercount", followercount);
		newfollowercount = followercount - 1;
		document.getElementById("followercount").innerHTML = `${newfollowercount} followers`; 
	}

	fetch(`/follow/${user}`, {
		method: 'GET'
	})
}


function edit(postid, body) {

	postJSON = JSON.stringify({postid: postid, content: body});

	fetch('/edit', {
		method: 'POST',
		body: postJSON
	})
}




