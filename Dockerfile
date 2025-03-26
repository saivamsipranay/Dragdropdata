# Use the official nginx image to serve the build directory
FROM nginx:stable-perl

# Copy the built React app to the Nginx server's default directory
#COPY ./build /usr/share/nginx/html
RUN mkdir -p /var/lib/react/react-app/build
COPY ./build /var/lib/react/react-app/build/

RUN sed -i 's|index  index.html index.htm;|try_files $uri $uri/ /index.html;|g' /etc/nginx/conf.d/default.conf
RUN sed -i 's|root   /usr/share/nginx/html;|root   /var/lib/react/react-app/build;|g' /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
