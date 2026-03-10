from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Admin panel (Jazzmin-themed)
    path("admin/", admin.site.urls),

    # OpenAPI schema + Swagger UI + ReDoc
    path("api/schema/",          SpectacularAPIView.as_view(),        name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/",    SpectacularRedocView.as_view(url_name="schema"),    name="redoc"),

    # All app endpoints live under /api/
    path("api/", include("core.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
