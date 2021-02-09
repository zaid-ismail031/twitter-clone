from django.contrib import admin
from . import models

# Register your models here.
admin.site.register(models.User)
admin.site.register(models.Post, models.PostAdmin)
admin.site.register(models.Like)
admin.site.register(models.Follow)
