# ============================================================
# DevSecOps Portfolio — Image Nginx
# ============================================================
# Image de base légère basée sur Alpine Linux (~ 40 Mo)
FROM nginx:alpine

# Métadonnées de l'image (label OCI standard)
LABEL maintainer="Arij Belaid <aarijbelaid@gmail.com>" \
      description="DevSecOps Portfolio — Arij Belaid (HTML5/CSS3/JS servi par Nginx)" \
      version="1.0"

# Suppression de la page par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copie des fichiers statiques du portfolio dans le répertoire servi par Nginx
COPY index.html    /usr/share/nginx/html/
COPY style.css     /usr/share/nginx/html/
COPY script.js     /usr/share/nginx/html/
COPY screenshot.png /usr/share/nginx/html/

# Configuration Nginx personnalisée (sécurité + performance)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Documentation : le conteneur écoute sur le port 80
EXPOSE 80

USER nginx
# Commande par défaut : lancer Nginx au premier plan
CMD ["nginx", "-g", "daemon off;"]

