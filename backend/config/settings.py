from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# ──────────────────────────────────────────
# Core
# ──────────────────────────────────────────
SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost", cast=Csv())

# ──────────────────────────────────────────
# Apps
# ──────────────────────────────────────────
INSTALLED_APPS = [
    # Jazzmin must come BEFORE django.contrib.admin
    "jazzmin",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",

    # Local
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    # CORS must come before CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

AUTH_USER_MODEL = "core.User"

# ──────────────────────────────────────────
# Templates
# ──────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ──────────────────────────────────────────
# Database
# ──────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME":     config("DB_NAME"),
        "USER":     config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST":     config("DB_HOST", default="localhost"),
        "PORT":     config("DB_PORT", default="5432"),
    }
}

# ──────────────────────────────────────────
# Password validators
# ──────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ──────────────────────────────────────────
# Internationalisation
# ──────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ──────────────────────────────────────────
# Static & Media
# ──────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ──────────────────────────────────────────
# Django REST Framework
# ──────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",

    # Pagination — all list endpoints return pages of 20 items
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,

    # Throttling — protect API from abuse and Groq from excessive calls
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/hour",    # unauthenticated (register endpoint)
        "user": "300/hour",   # general authenticated requests
        "ai":   "30/hour",    # AI-specific endpoints (SendMessage, Generate)
    },
}

# ──────────────────────────────────────────
# Simple JWT
# ──────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":  True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ──────────────────────────────────────────
# CORS
# ──────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────
# drf-spectacular  (Swagger / OpenAPI)
# ──────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE":       "Email Subject Line Optimizer API",
    "DESCRIPTION": "AI-powered email subject line generation and management.",
    "VERSION":     "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "TAGS": [
        {"name": "Auth",      "description": "Register, login, profile"},
        {"name": "Campaigns", "description": "Email campaign management"},
        {"name": "Subjects",  "description": "Subject line management"},
        {"name": "AI Chat",   "description": "AI-powered subject line generation"},
        {"name": "Admin",     "description": "Admin-only endpoints"},
    ],
}

# ──────────────────────────────────────────
# Jazzmin  (Admin UI)
# ──────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title":        "Email Optimizer Admin",
    "site_header":       "Email Optimizer",
    "site_brand":        "✉ Optimizer",
    "site_logo":         None,
    "welcome_sign":      "Welcome to the Email Subject Line Optimizer",
    "copyright":         "Email Optimizer",
    "search_model":      ["core.User", "core.EmailCampaign"],
    "topmenu_links": [
        {"name": "Home",       "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "API Docs",   "url": "/api/schema/swagger-ui/", "new_window": True},
        {"name": "Site",       "url": "/api/", "new_window": True},
    ],
    "usermenu_links": [
        {"name": "API Docs", "url": "/api/schema/swagger-ui/", "new_window": True},
    ],
    "show_sidebar":       True,
    "navigation_expanded": True,
    "icons": {
        "auth":                  "fas fa-users-cog",
        "core.User":             "fas fa-user",
        "core.EmailCampaign":    "fas fa-envelope-open-text",
        "core.SubjectLine":      "fas fa-heading",
        "core.ChatSession":      "fas fa-comments",
        "core.ChatMessage":      "fas fa-comment-dots",
    },
    "default_icon_parents":  "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active":  True,
    "custom_css": None,
    "custom_js":  None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text":   False,
    "footer_small_text":   False,
    "body_small_text":     False,
    "brand_small_text":    False,
    "brand_colour":        "navbar-primary",
    "accent":              "accent-primary",
    "navbar":              "navbar-dark",
    "no_navbar_border":    False,
    "navbar_fixed":        True,
    "layout_boxed":        False,
    "footer_fixed":        False,
    "sidebar_fixed":       True,
    "sidebar":             "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme":               "default",
    "dark_mode_theme":     None,
    "button_classes": {
        "primary":   "btn-primary",
        "secondary": "btn-secondary",
        "info":      "btn-info",
        "warning":   "btn-warning",
        "danger":    "btn-danger",
        "success":   "btn-success",
    },
}

# ──────────────────────────────────────────
# Groq
# ──────────────────────────────────────────
GROQ_API_KEY = config("GROQ_API_KEY")

# ──────────────────────────────────────────
# Logging
# ──────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{levelname}] {asctime} {module}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        # Our app — DEBUG in dev, INFO in production
        "core": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        # Django request errors (500s)
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}

# ──────────────────────────────────────────
# Production security headers
# (uncomment when deploying behind HTTPS)
# ──────────────────────────────────────────
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
