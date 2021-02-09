from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib import admin


class PostAdmin(admin.ModelAdmin):
    readonly_fields = ("id", "timestamp")


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    body = models.TextField()
    likes = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "body": self.body,
            "likes": self.likes,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }

    def __str__(self):
        return f"{self.user} post {self.id}"


class Like(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="likes")
    liked_posts = models.ManyToManyField(Post, blank=True, related_name="all_likes")

    def __str__(self):
        return f"{self.user}'s likes"


class Follow(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="follows")
    following = models.ManyToManyField(User, blank=True)
    follows = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user}'s follows"



