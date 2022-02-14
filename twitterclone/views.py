import json
import math
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist

from .models import User, Post, Like, Follow


def index(request):
    return render(request, "twitterclone/index.html")


def following(request):
    return render(request, "twitterclone/following.html")


def user(request, username):
    # Getting id associated with username
    try:
        userid = int(User.objects.get(username=username).id)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "User does not exist"})

    following = Follow.objects.get(user=request.user).following.all()

    following_ids = []
    for follows in following:
        following_ids.append(int(follows.id))

    followercount = Follow.objects.get(user=userid).follows
    followingcount = len(Follow.objects.get(user=userid).following.all())

    if userid in following_ids and username != request.user.username:
        return render(request, "twitterclone/user.html", {
            "username": username,
            "isfollow": "Unfollow",
            "notmyself": True,
            "followercount": followercount,
            "followingcount": followingcount,
        })

    if userid not in following_ids and username != request.user.username:
        return render(request, "twitterclone/user.html", {
            "username": username,
            "isfollow": "Follow",
            "notmyself": True,
            "followercount": followercount,
            "followingcount": followingcount
        })

    if username == request.user.username:
        return render(request, "twitterclone/user.html", {
            "username": username,
            "notmyself": False,
            "followercount": followercount,
            "followingcount": followingcount
        })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "twitterclone/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "twitterclone/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "twitterclone/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "twitterclone/register.html", {
                "message": "Username already taken."
            })
        login(request, user)

        # Create user's likes in database
        userlike = Like.objects.create(user=request.user)
        userlike.save()

        # Create user's follows in database
        userfollow = Follow.objects.create(user=request.user)
        userfollow.save()

        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "twitterclone/register.html")


# API for creating a new post
@csrf_exempt
@login_required
def create_post(request):

    # Ensure that request method can only be "POST"
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"})

    # Get contents of post
    body_unicode = request.body.decode('utf-8')
    data = json.loads(body_unicode)
    content = data.get("content", "")

    # Initialize post object
    post = Post(
        user=request.user,
        body=content,
        likes=0
    )

    # Add post to database
    post.save()

    # JSON response
    return JsonResponse({"success": "Post created successfully"}, status=201)


# API for likes
@login_required
def likes(request, id):

    # Ensure that request method can only be "POST"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    # Error checking
    users_likes = Like.objects.get(user=request.user)
    queryset = users_likes.liked_posts.all()
    idlist = []
    for post in queryset:
        idlist.append(post.id)

    if id not in idlist:
        # Update likes on post
        post = Post.objects.get(id=id)
        updated = int(post.likes) + 1
        post.likes = updated
        post.save()

        # Add post to user's row in database
        like_model = Like.objects.get(user=request.user)
        like_model.liked_posts.add(post)
        like_model.save()
        return JsonResponse({"success": "Post liked successfully"}, status=201)

    if id in idlist:
        # Remove liked post from user's row in database
        post = Post.objects.get(id=id)
        users_likes = Like.objects.get(user=request.user)
        users_likes.liked_posts.remove(post)
        users_likes.save()

        # Update like count on post
        updated = int(post.likes) - 1
        post.likes = updated
        post.save()
        return JsonResponse({"success": "Post unliked successfully"}, status=201)

    # JSON response
    return JsonResponse({"success": "Post liked/unliked successfully"}, status=201)


# API for retrieving latest posts
@login_required
def posts(request, pagenumber):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    # Get all posts, latest first
    posts_queryset = Post.objects.all().order_by('-timestamp')

    # Return if zero posts
    if len(posts_queryset) == 0:
        return JsonResponse({"error": "There are no posts"})

    # Pagination
    required = posts_queryset[(10*pagenumber - 10):10*pagenumber]

    return JsonResponse([posts.serialize() for posts in required], safe=False)


# API for retrieving posts for people that a user follows
@login_required
def followposts(request, pagenumber):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    following = Follow.objects.get(user=request.user).following.all()

    following_ids = []
    for follows in following:
        following_ids.append(int(follows.id))

    posts_queryset = Post.objects.filter(user__id__in=following_ids).order_by('-timestamp')
    # Return if zero posts
    if len(posts_queryset) == 0:
        return JsonResponse({"error": "There are no posts"})

    # Pagination
    required = posts_queryset[(10 * pagenumber - 10):10 * pagenumber]

    return JsonResponse([posts.serialize() for posts in required], safe=False)


# API for getting user's posts
@login_required
def userposts(request, pagenumber, username):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    # Getting id associated with username
    try:
        userid = User.objects.get(username=username).id
    except ObjectDoesNotExist:
        return JsonResponse({"error": "User does not exist"})

    posts_queryset = Post.objects.filter(user=userid).order_by('-timestamp')
    if len(posts_queryset) == 0:
        return JsonResponse({"error": "There are no posts yet"})

    # Pagination
    required = posts_queryset[(10 * pagenumber - 10):10 * pagenumber]

    return JsonResponse([posts.serialize() for posts in required], safe=False)


# API for retrieving liked posts
@login_required
def get_likes(request):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    likes = Like.objects.get(user=request.user).liked_posts.all()

    return JsonResponse([like.serialize() for like in likes], safe=False)


# Getting username
@login_required
def getuser(request):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    return JsonResponse({"user": request.user.username})


# Get number of pages for all
@login_required
def getpages(request):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    # Get all posts, latest first
    posts_queryset = Post.objects.all().order_by('-timestamp')

    numberofpages = math.ceil(len(posts_queryset)/10)

    return JsonResponse({"number": numberofpages})


# Follow a user
@login_required
def follow(request, username):

    # Ensure that request method can only be "GET"
    if request.method != "GET":
        return JsonResponse({"error": "GET request required"})

    # Getting id associated with username
    try:
        userid = int(User.objects.get(username=username).id)
    except ObjectDoesNotExist:
        return JsonResponse({"error": "User does not exist"})

    following = Follow.objects.get(user=request.user).following.all()

    following_ids = []
    for follows in following:
        following_ids.append(int(follows.id))

    if userid not in following_ids and userid != request.user:

        # Update ManyToMany field in follower's Follow model
        userToBeFollowed = User.objects.get(id=userid)
        follow_model = Follow.objects.get(user=request.user)
        follow_model.following.add(userToBeFollowed)
        follow_model.save()

        # Update follower count for user that was just followed
        followee_model = Follow.objects.get(user=userid)
        newfollowcount = int(followee_model.follows) + 1
        followee_model.follows = newfollowcount
        followee_model.save()

        return JsonResponse({"message": "User followed successfully!"})

    if userid in following_ids and userid != request.user:

        # Update ManyToMany field in follower's Follow model
        userToBeUnfollowed = User.objects.get(id=userid)
        follow_model = Follow.objects.get(user=request.user)
        follow_model.following.remove(userToBeUnfollowed)
        follow_model.save()

        # Update follower count for user that was just unfollowed
        followee_model = Follow.objects.get(user=userid)
        newfollowcount = int(followee_model.follows) - 1
        followee_model.follows = newfollowcount
        followee_model.save()

        return JsonResponse({"message": "User unfollowed successfully!"})

    return JsonResponse({"error": "Follow/unfollow action could not be completed successfully"})


# Editing a post
@csrf_exempt
@login_required
def edit(request):

    # Ensure that request method can only be "POST"
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"})

    # Get contents of post
    data = json.loads(request.body)
    postid = data.get("postid", "")
    content = data.get("content", "")

    postToEdit = Post.objects.get(id=postid)

    if postToEdit.user != request.user:
        return JsonResponse({"error": "Forbidden"})

    postToEdit.body = content
    postToEdit.save()

    return JsonResponse({"success": "Post edited successfully"})









