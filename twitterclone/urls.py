
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("following", views.following, name="following"),
    path("user/<str:username>", views.user, name="user"),


    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    path("create", views.create_post, name="create"),
    path("edit", views.edit, name="edit"),
    path("like/<int:id>", views.likes, name="like"),
    path("follow/<str:username>", views.follow, name="follow"),

    path("posts/page<int:pagenumber>", views.posts, name="posts"),
    path("followposts/page<int:pagenumber>", views.followposts, name="followposts"),
    path("userposts/<str:username>/page<int:pagenumber>", views.userposts, name="userposts"),

    path("getlikes", views.get_likes, name="getlikes"),
    path("getuser", views.getuser, name="getuser"),
    path("getpages", views.getpages, name="getpages"),

    path("flock", views.flockApp, name="flockApp")
]
